package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"jetstream-client-go/cmd"
)

func main() {
	// Set up signal handling for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Handle interrupt signals
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigChan
		log.Println("Received interrupt signal, shutting down...")
		cancel()
	}()

	// Execute the root command
	if err := cmd.Execute(ctx); err != nil {
		log.Fatalf("Error executing command: %v", err)
	}
} 