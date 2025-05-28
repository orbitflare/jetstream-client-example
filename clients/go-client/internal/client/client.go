package client

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"strings"

	"jetstream-client-go/internal/config"
	"jetstream-client-go/internal/decoder"
	pb "jetstream-client-go/jetstream-client-go/proto"

	"github.com/mr-tron/base58"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
)

// cleanGrpcURL removes http:// or https:// prefixes from the URL if present
func cleanGrpcURL(url string) string {
	url = strings.TrimPrefix(url, "http://")
	url = strings.TrimPrefix(url, "https://")
	return url
}

// RunClient runs the main jetstream client (non-parsed mode)
func RunClient(ctx context.Context, cfg *config.ClientConfig) error {
	log.Printf("Starting Jetstream connector with URL: %s", cfg.JetstreamGrpcURL)

	// Create gRPC connection with cleaned URL
	grpcURL := cleanGrpcURL(cfg.JetstreamGrpcURL)
	conn, err := grpc.Dial(grpcURL, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return fmt.Errorf("failed to connect to gRPC server: %w", err)
	}
	defer conn.Close()

	client := pb.NewJetstreamClient(conn)

	// Build filters
	filters, err := buildFilters(cfg)
	if err != nil {
		return fmt.Errorf("failed to build filters: %w", err)
	}

	log.Printf("Using %d filter(s) for transaction filtering", len(filters))
	for name, filter := range filters {
		log.Printf("Filter '%s' configuration:", name)
		if len(filter.AccountInclude) > 0 {
			log.Printf("  Include accounts: %v", filter.AccountInclude)
		}
		if len(filter.AccountExclude) > 0 {
			log.Printf("  Exclude accounts: %v", filter.AccountExclude)
		}
		if len(filter.AccountRequired) > 0 {
			log.Printf("  Required accounts: %v", filter.AccountRequired)
		}
	}

	// Create subscribe request
	request := &pb.SubscribeRequest{
		Transactions: filters,
		Accounts:     make(map[string]*pb.SubscribeRequestFilterAccounts),
		Ping:         &pb.SubscribeRequestPing{Id: 1},
	}

	// Add authentication if token is provided
	ctx = addAuthIfPresent(ctx, cfg.XToken)

	// Create stream
	stream, err := client.Subscribe(ctx)
	if err != nil {
		return fmt.Errorf("failed to create subscribe stream: %w", err)
	}

	// Send initial request
	if err := stream.Send(request); err != nil {
		return fmt.Errorf("failed to send subscribe request: %w", err)
	}

	log.Println("Jetstream connector connected successfully")

	// Process incoming messages
	for {
		select {
		case <-ctx.Done():
			log.Println("Context cancelled, shutting down...")
			return nil
		default:
			response, err := stream.Recv()
			if err == io.EOF {
				log.Println("Stream ended")
				return nil
			}
			if err != nil {
				return fmt.Errorf("failed to receive message: %w", err)
			}

			if err := processUpdate(response); err != nil {
				log.Printf("Error processing update: %v", err)
			}
		}
	}
}

// RunParsedClient runs the parsed jetstream client
func RunParsedClient(ctx context.Context, cfg *config.ClientConfig) error {
	log.Printf("Starting Jetstream parsed connector with URL: %s", cfg.JetstreamGrpcURL)

	// Create gRPC connection with cleaned URL
	grpcURL := cleanGrpcURL(cfg.JetstreamGrpcURL)
	conn, err := grpc.Dial(grpcURL, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return fmt.Errorf("failed to connect to gRPC server: %w", err)
	}
	defer conn.Close()

	client := pb.NewJetstreamClient(conn)

	// Create subscribe parsed request
	request := &pb.SubscribeParsedRequest{
		Ping: &pb.SubscribeRequestPing{Id: 1},
	}

	// Add authentication if token is provided
	ctx = addAuthIfPresent(ctx, cfg.XToken)

	// Create stream
	stream, err := client.SubscribeParsed(ctx)
	if err != nil {
		return fmt.Errorf("failed to create subscribe parsed stream: %w", err)
	}

	// Send initial request
	if err := stream.Send(request); err != nil {
		return fmt.Errorf("failed to send subscribe parsed request: %w", err)
	}

	log.Println("Jetstream parsed connector connected successfully")

	// Process incoming messages
	for {
		select {
		case <-ctx.Done():
			log.Println("Context cancelled, shutting down...")
			return nil
		default:
			response, err := stream.Recv()
			if err == io.EOF {
				log.Println("Stream ended")
				return nil
			}
			if err != nil {
				return fmt.Errorf("failed to receive message: %w", err)
			}

			if err := processParsedUpdate(response); err != nil {
				log.Printf("Error processing parsed update: %v", err)
			}
		}
	}
}

// processUpdate processes a regular subscribe update
func processUpdate(update *pb.SubscribeUpdate) error {
	switch u := update.UpdateOneof.(type) {
	case *pb.SubscribeUpdate_Transaction:
		if u.Transaction != nil && u.Transaction.Transaction != nil {
			txInfo := u.Transaction.Transaction
			signature := base58.Encode(txInfo.Signature)
			log.Printf("Jetstream - Transaction received - Signature: %s", signature)

			// Process instructions with decoder
			for _, instruction := range txInfo.Instructions {
				if err := decoder.ProcessInstruction(txInfo, instruction); err != nil {
					// Not an error if instruction can't be decoded - just means it's not a known program
					continue
				}
			}
		}
	case *pb.SubscribeUpdate_Account:
		if u.Account != nil && u.Account.Account != nil {
			pubkey := base58.Encode(u.Account.Account.Pubkey)
			log.Printf("Jetstream - Account update - Pubkey: %s", pubkey)
		}
	case *pb.SubscribeUpdate_Ping:
		log.Println("Received ping")
	case *pb.SubscribeUpdate_Pong:
		if u.Pong != nil {
			log.Printf("Received pong with ID: %d", u.Pong.Id)
		}
	}
	return nil
}

// processParsedUpdate processes a parsed subscribe update
func processParsedUpdate(update *pb.SubscribeUpdateParsedTransaction) error {
	signature := base58.Encode(update.Signature)
	log.Printf("Jetstream - Parsed Transaction received - Signature: %s", signature)

	// Process parsed instructions
	for _, instruction := range update.Instructions {
		log.Printf("Parsed instruction: %+v", instruction)
	}

	return nil
}

// buildFilters builds transaction filters from config
func buildFilters(cfg *config.ClientConfig) (map[string]*pb.SubscribeRequestFilterTransactions, error) {
	filters := make(map[string]*pb.SubscribeRequestFilterTransactions)

	// Try to load filters from file if specified
	if cfg.FilterConfigPath != "" {
		log.Printf("Loading filters from file: %s", cfg.FilterConfigPath)
		file, err := os.Open(cfg.FilterConfigPath)
		if err != nil {
			return nil, fmt.Errorf("failed to open filter config file: %w", err)
		}
		defer file.Close()

		var filterConfig config.FilterConfig
		if err := json.NewDecoder(file).Decode(&filterConfig); err != nil {
			return nil, fmt.Errorf("failed to decode filter config: %w", err)
		}

		// Convert each filter to the protobuf format
		for name, filter := range filterConfig.Filters {
			filters[name] = &pb.SubscribeRequestFilterTransactions{
				AccountInclude:  filter.AccountInclude,
				AccountExclude:  filter.AccountExclude,
				AccountRequired: filter.AccountRequired,
			}
		}
	} else if len(cfg.IncludeAccounts) > 0 || len(cfg.ExcludeAccounts) > 0 || len(cfg.RequiredAccounts) > 0 {
		// If no file but command-line filters provided, use those
		log.Println("Using command-line filter configuration")
		filters["cli-filter"] = &pb.SubscribeRequestFilterTransactions{
			AccountInclude:  cfg.IncludeAccounts,
			AccountExclude:  cfg.ExcludeAccounts,
			AccountRequired: cfg.RequiredAccounts,
		}
	} else {
		// Default case - empty filter (all transactions)
		log.Println("No filters specified, using default filter (all transactions)")
		filters["default"] = &pb.SubscribeRequestFilterTransactions{
			AccountInclude:  []string{},
			AccountExclude:  []string{},
			AccountRequired: []string{},
		}
	}

	return filters, nil
}

// addAuthIfPresent adds authentication metadata if token is provided
func addAuthIfPresent(ctx context.Context, token string) context.Context {
	if token != "" {
		md := metadata.New(map[string]string{
			"authorization": token,
		})
		ctx = metadata.NewOutgoingContext(ctx, md)
	}
	return ctx
} 