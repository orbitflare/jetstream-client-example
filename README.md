# JetStream Example Client

A standalone example client to connect to JetStream proxy and process transaction data.

## Features

- Connect to JetStream gRPC endpoint
- Filter transactions based on accounts
- Process transaction signatures
- Support for configuration via command-line or JSON file

For more details on updates and improvements, check the [Jetstream Changelog](https://docs.orbitflare.com/data-streaming/jetstream-changelog).

## Build

```bash
cargo build --release
```

## Usage

```bash
# Run with default settings
./target/release/jetstream-client-example

# Specify a custom JetStream gRPC URL
./target/release/jetstream-client-example -j http://your-jetstream-url:7001

# Filter transactions (include accounts)
./target/release/jetstream-client-example -i <pubkey1>,<pubkey2>

# Use a JSON configuration file for complex filters
./target/release/jetstream-client-example -f filters.json

# Control logging level with RUST_LOG environment variable
RUST_LOG=debug ./target/release/jetstream-client-example
```

## Filter Configuration (JSON)

Create a `filters.json` file with the following structure:

```json
{
  "filters": {
    "my-filter": {
      "account_include": ["pubkey1", "pubkey2"],
      "account_exclude": ["pubkey3"],
      "account_required": ["pubkey4"]
    },
    "another-filter": {
      "account_include": [],
      "account_exclude": [],
      "account_required": ["pubkey5", "pubkey6"]
    }
  }
}
```

## Command-line Options

```
  -j, --jetstream-grpc-url <JETSTREAM_GRPC_URL>
          Jetstream gRPC URL [default: http://[SERVER-IP]:[port]]
  -f, --filter-config-path <FILTER_CONFIG_PATH>
          Filter config file path (JSON format)
  -i, --include-accounts <INCLUDE_ACCOUNTS>
          Include accounts (comma-separated Solana pubkeys)
  -e, --exclude-accounts <EXCLUDE_ACCOUNTS>
          Exclude accounts (comma-separated Solana pubkeys)
  -r, --required-accounts <REQUIRED_ACCOUNTS>
          Required accounts (comma-separated Solana pubkeys)
  -h, --help
          Print help
```
