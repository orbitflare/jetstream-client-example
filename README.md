## JetStream Client

This repository contains the JetStream client implementations in various programming languages.

## Directory Structure

```
.
├── clients/
│   ├── rust-client/          # Rust implementation of the JetStream client
│   ├── go-client/            # Go implementation of the JetStream client
│   └── typescript-client/     # TypeScript implementation of the JetStream client
└── README.md
```

## Getting Started

### Go Client

To navigate to the Go client directory and build the client, follow these steps:

1. **Navigate to the Go Client Directory:**

   ```bash
   cd clients/go-client
   ```

2. **Build the Go Client:**

   ```bash
   go build -o jetstream-go-client .
   ```

3. **Run the Go Client:**
   ```bash
   ./jetstream-go-client --help
   ```

### Rust Client

To navigate to the Rust client directory and build the client, follow these steps:

1. **Navigate to the Rust Client Directory:**

   ```bash
   cd clients/rust-client
   ```

2. **Build the Rust Client:**

   ```bash
   cargo build --release
   ```

### TypeScript Client

To navigate to the TypeScript client directory and build the client, follow these steps:

1. **Navigate to the TypeScript Client Directory:**

   ```bash
   cd clients/typescript-client
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Run the TypeScript Client:**
   ```bash
   npm run build && npm run example
   ```

## Contributing

If you would like to contribute to this project, please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License.
