# JetStream Go Client

A Go client for connecting to the JetStream gRPC service and streaming Solana transaction data. This client mirrors the functionality of the Rust `jetstream_client` with similar configuration options and instruction decoding capabilities.

## Features

- **gRPC Streaming**: Connect to JetStream gRPC service for real-time Solana data
- **Transaction Filtering**: Filter transactions by account includes, excludes, and required accounts
- **Instruction Decoding**: Built-in decoder for PumpFun program instructions
- **Parsed Mode**: Support for parsed instruction streaming
- **CLI Interface**: Command-line interface with comprehensive configuration options

## Installation

1. Clone the repository and navigate to the Go client directory:

```bash
cd jetstream_client_go
```

2. Install dependencies:

```bash
go mod tidy
```

3. Build the client:

```bash
go build -o jetstream-go-client .
```

## Usage

### Basic Usage

```bash
# Connect to JetStream with default settings (all transactions)
./jetstream-go-client --jetstream-grpc-url "your-jetstream-url"

# With authentication token
./jetstream-go-client --jetstream-grpc-url "your-jetstream-url" --x-token "your-token"
```

### Transaction Filtering

```bash
# Filter by specific accounts
./jetstream-go-client \
  --jetstream-grpc-url "your-jetstream-url" \
  --include-accounts "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P" \
  --exclude-accounts "SomeOtherAccount" \
  --required-accounts "RequiredAccount"

# Use filter configuration file
./jetstream-go-client \
  --jetstream-grpc-url "your-jetstream-url" \
  --filter-config "filters.json"
```

### Parsed Mode

```bash
# Enable parsed instruction streaming
./jetstream-go-client \
  --jetstream-grpc-url "your-jetstream-url" \
  --parsed
```

## Configuration Options

| Flag                   | Short | Description                           | Default          |
| ---------------------- | ----- | ------------------------------------- | ---------------- |
| `--jetstream-grpc-url` | `-j`  | Jetstream gRPC URL                         | `PLACE_URL_HERE` |
| `--x-token`            | `-x`  | X token for authentication            | -                |
| `--filter-config`      | `-f`  | Filter config file path (JSON format) | -                |
| `--include-accounts`   | `-i`  | Include accounts (comma-separated)    | -                |
| `--exclude-accounts`   | `-e`  | Exclude accounts (comma-separated)    | -                |
| `--required-accounts`  | `-r`  | Required accounts (comma-separated)   | -                |
| `--parsed`             | `-p`  | Enable parsed instruction streaming   | `false`          |

## Filter Configuration File

Create a JSON file to define multiple transaction filters:

```json
{
  "filters": {
    "pumpfun-filter": {
      "account_include": ["6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"],
      "account_exclude": [],
      "account_required": []
    },
    "another-filter": {
      "account_include": ["AnotherProgramId"],
      "account_exclude": ["ExcludedAccount"],
      "account_required": ["RequiredAccount"]
    }
  }
}
```

## Instruction Decoding

The client includes a built-in decoder for PumpFun program instructions:

- **Create**: Token creation instructions with name, symbol, and URI
- **Buy**: Token purchase instructions with amount and max SOL cost
- **Sell**: Token sale instructions with amount and min SOL output

### Adding Custom Decoders

To add support for other programs, implement a decoder function in `internal/decoder/` and register it in the `ProcessInstruction` function.

Example:

```go
// In internal/decoder/myprogram.go
func DecodeMyProgramInstruction(accounts []string, data []byte) (*MyProgramInstruction, error) {
    // Your decoding logic here
}

// In internal/decoder/decoder.go
func ProcessInstruction(txInfo *pb.SubscribeUpdateTransactionInfo, instruction *pb.CompiledInstruction) error {
    // ... existing code ...

    // Add your decoder
    if myIx, err := DecodeMyProgramInstruction(accounts, instruction.Data); err == nil {
        log.Printf("Signature: %s - My program instruction: %+v", signature, myIx)
        return nil
    }

    // ... rest of function ...
}
```

## Project Structure

```
jetstream_client_go/
├── main.go                          # Application entry point
├── cmd/
│   └── root.go                      # CLI command definitions
├── internal/
│   ├── config/
│   │   └── config.go                # Configuration structures
│   ├── client/
│   │   └── client.go                # gRPC client implementation
│   └── decoder/
│       ├── decoder.go               # Main decoder interface
│       └── pumpfun.go              # PumpFun instruction decoder
├── jetstream-client-go/proto/       # Generated protobuf files
│   ├── jetstream.pb.go
│   └── jetstream_grpc.pb.go
├── go.mod                           # Go module definition
└── README.md                        # This file
```

## Examples

### Monitor PumpFun Transactions

```bash
./jetstream-go-client \
  --jetstream-grpc-url "your-jetstream-url" \
  --include-accounts "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"
```

### Monitor All Transactions (Development)

```bash
./jetstream-go-client \
  --jetstream-grpc-url "your-jetstream-url"
```

### Use Parsed Mode for Pre-decoded Instructions

```bash
./jetstream-go-client \
  --jetstream-grpc-url "your-jetstream-url" \
  --parsed
```

## Development

### Regenerating Protobuf Files

If the protobuf definitions change, regenerate the Go files:

```bash
export PATH=$PATH:$HOME/go/bin
protoc --experimental_allow_proto3_optional \
  --go_out=. --go-grpc_out=. \
  --go_opt=Mjetstream.proto=jetstream-client-go/proto \
  --go-grpc_opt=Mjetstream.proto=jetstream-client-go/proto \
  --proto_path=../jetstream_protos/protos \
  ../jetstream_protos/protos/jetstream.proto
```

### Testing

```bash
go test ./...
```

### Building for Different Platforms

```bash
# Linux
GOOS=linux GOARCH=amd64 go build -o jetstream-go-client-linux .

# macOS
GOOS=darwin GOARCH=amd64 go build -o jetstream-go-client-macos .

# Windows
GOOS=windows GOARCH=amd64 go build -o jetstream-go-client-windows.exe .
```

## License

This project follows the same license as the parent repository.
