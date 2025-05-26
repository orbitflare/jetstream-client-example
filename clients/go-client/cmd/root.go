package cmd

import (
	"context"
	"log"

	"jetstream-client-go/internal/client"
	"jetstream-client-go/internal/config"

	"github.com/spf13/cobra"
)

var cfg config.ClientConfig

var rootCmd = &cobra.Command{
	Use:   "jetstream-client-go",
	Short: "JetStream Example Client in Go",
	Long:  "A Go client for connecting to JetStream gRPC service and streaming Solana transaction data",
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx := cmd.Context()
		
		log.Printf("Starting JetStream Go Client")
		log.Printf("gRPC URL: %s", cfg.JetstreamGrpcURL)
		log.Printf("Parsed mode: %t", cfg.ParsedEnabled)

		if cfg.ParsedEnabled {
			return client.RunParsedClient(ctx, &cfg)
		} else {
			return client.RunClient(ctx, &cfg)
		}
	},
}

func Execute(ctx context.Context) error {
	return rootCmd.ExecuteContext(ctx)
}

func init() {
	rootCmd.Flags().StringVarP(&cfg.JetstreamGrpcURL, "jetstream-grpc-url", "j", "PLACE_URL_HERE", "Jetstream gRPC URL")
	rootCmd.Flags().StringVarP(&cfg.XToken, "x-token", "x", "", "X token for authentication")
	rootCmd.Flags().StringVarP(&cfg.FilterConfigPath, "filter-config", "f", "", "Filter config file path (JSON format)")
	rootCmd.Flags().StringSliceVarP(&cfg.IncludeAccounts, "include-accounts", "i", []string{}, "Include accounts (comma-separated Solana pubkeys)")
	rootCmd.Flags().StringSliceVarP(&cfg.ExcludeAccounts, "exclude-accounts", "e", []string{}, "Exclude accounts (comma-separated Solana pubkeys)")
	rootCmd.Flags().StringSliceVarP(&cfg.RequiredAccounts, "required-accounts", "r", []string{}, "Required accounts (comma-separated Solana pubkeys)")
	rootCmd.Flags().BoolVarP(&cfg.ParsedEnabled, "parsed", "p", false, "Enable parsed instruction streaming")
} 