# JetStream Client Examples

Example client implementations for [OrbitFlare Jetstream](https://docs.orbitflare.com/data-streaming/jetstream) - a high-performance gRPC service for real-time Solana transaction streaming.

## Clients

- **Rust**: `clients/rust-client/` - See [README](clients/rust-client/README.md)
- **Go**: `clients/go-client/` - See [README](clients/go-client/README.md)
- **TypeScript**: `clients/typescript-client/` - See [README](clients/typescript-client/README.md)

## Quick Start

### Rust

```bash
cd clients/rust-client
cargo build --release
./target/release/rust-client -j http://fra.jetstream.orbitflare.com:80
```

For parsed instruction streaming:

```bash
./target/release/rust-client -j http://fra.jetstream.orbitflare.com:80 -p
```

### Go

```bash
cd clients/go-client
go build -o jetstream-go-client .
./jetstream-go-client --jetstream-grpc-url http://fra.jetstream.orbitflare.com:80
```

### TypeScript

```bash
cd clients/typescript-client
npm install
npm run build && npm run example
```

## Endpoints


- 🇳🇱 Amsterdam 
- 🇩🇪 Frankfurt 
- 🇬🇧 London 
- 🇺🇸 New York 
- 🇺🇸 Ashburn
- 🇺🇸 Utah 
- 🇺🇸 Los Angeles 
- 🇯🇵 Tokyo 

## Documentation

For detailed documentation, see [OrbitFlare Jetstream Docs](https://docs.orbitflare.com/data-streaming/jetstream).
