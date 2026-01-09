module jetstream-client-go

go 1.24.0

require (
	github.com/golang/protobuf v1.5.4
	github.com/mr-tron/base58 v1.2.0
	github.com/spf13/cobra v1.10.2
	google.golang.org/grpc v1.78.0
	google.golang.org/protobuf v1.36.11
)

require (
	github.com/inconshreveable/mousetrap v1.1.0 // indirect
	github.com/spf13/pflag v1.0.10 // indirect
	golang.org/x/net v0.48.0 // indirect
	golang.org/x/sys v0.40.0 // indirect
	golang.org/x/text v0.32.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20251222181119-0a764e51fe1b // indirect
)

replace google.golang.org/genproto => google.golang.org/genproto v0.0.0-20230410155749-daa745c078e1

exclude google.golang.org/genproto v0.0.0-20230410155749-daa745c078e1
