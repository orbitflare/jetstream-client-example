import * as grpc from '@grpc/grpc-js';
import { JetstreamClient as GrpcJetstreamClient, JetstreamService } from './generated/jetstream_protos/protos/jetstream';
import {
    SubscribeRequest,
    SubscribeUpdate,
    SubscribeParsedRequest,
    SubscribeUpdateParsedTransaction,
    PingRequest,
    PongResponse,
    GetVersionRequest,
    GetVersionResponse,
    SubscribeRequestFilterTransactions,
    SubscribeRequestFilterAccounts,
    SubscribeRequestPing,
} from './generated/jetstream_protos/protos/jetstream';

export interface JetstreamClientConfig {
    endpoint: string;
    credentials?: grpc.ChannelCredentials;
    options?: grpc.ChannelOptions;
}

export interface TransactionFilter {
    accountInclude?: string[];
    accountExclude?: string[];
    accountRequired?: string[];
}

export interface AccountFilter {
    account?: string[];
    owner?: string[];
    filters?: AccountFilterCondition[];
}

export interface AccountFilterCondition {
    memcmp?: {
        offset: number;
        data: string | Uint8Array;
        encoding?: 'base58' | 'base64' | 'bytes';
    };
    datasize?: number;
    lamports?: {
        eq?: number;
        ne?: number;
        lt?: number;
        gt?: number;
    };
}

export interface SubscribeFilters {
    transactions?: { [key: string]: TransactionFilter };
    accounts?: { [key: string]: AccountFilter };
    ping?: { id: number };
}

export class JetstreamClient {
    private client: GrpcJetstreamClient;
    private endpoint: string;

    constructor(config: JetstreamClientConfig) {
        this.endpoint = config.endpoint;
        this.endpoint = this.endpoint.replace(/^https?:\/\//, '');
        const credentials = config.credentials || grpc.credentials.createInsecure();
        this.client = new GrpcJetstreamClient(this.endpoint, credentials, config.options);
    }

    /**
     * Subscribe to transaction and account updates with filtering
     */
    subscribe(filters: SubscribeFilters): grpc.ClientDuplexStream<SubscribeRequest, SubscribeUpdate> {
        const stream = this.client.subscribe();

        // Send initial subscription request
        const request: SubscribeRequest = {
            transactions: {},
            accounts: {},
            ping: undefined
        };

        // Set up transaction filters
        if (filters.transactions) {
            Object.entries(filters.transactions).forEach(([key, filter]) => {
                const txFilter: SubscribeRequestFilterTransactions = {
                    accountInclude: filter.accountInclude || [],
                    accountExclude: filter.accountExclude || [],
                    accountRequired: filter.accountRequired || []
                };
                request.transactions[key] = txFilter;
            });
        }

        // Set up account filters
        if (filters.accounts) {
            Object.entries(filters.accounts).forEach(([key, filter]) => {
                const accFilter: SubscribeRequestFilterAccounts = {
                    account: filter.account || [],
                    owner: filter.owner || [],
                    filters: []
                };
                request.accounts[key] = accFilter;
            });
        }

        // Set up ping
        if (filters.ping) {
            request.ping = {
                id: filters.ping.id
            };
        }

        stream.write(request);
        return stream;
    }

    /**
     * Subscribe to parsed transaction updates
     */
    subscribeParsed(pingId?: number): grpc.ClientDuplexStream<SubscribeParsedRequest, SubscribeUpdateParsedTransaction> {
        const stream = this.client.subscribeParsed();

        const request: SubscribeParsedRequest = {
            ping: pingId !== undefined ? { id: pingId } : undefined
        };

        stream.write(request);
        return stream;
    }

    /**
     * Send a ping request
     */
    async ping(count: number = 1): Promise<PongResponse> {
        return new Promise((resolve, reject) => {
            const request: PingRequest = {
                count: count
            };

            this.client.ping(request, (error, response) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(response!);
                }
            });
        });
    }

    /**
     * Get version information
     */
    async getVersion(): Promise<GetVersionResponse> {
        return new Promise((resolve, reject) => {
            const request: GetVersionRequest = {};

            this.client.getVersion(request, (error, response) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(response!);
                }
            });
        });
    }

    /**
     * Close the client connection
     */
    close(): void {
        this.client.close();
    }

    /**
     * Get the underlying gRPC client (for advanced usage)
     */
    getGrpcClient(): GrpcJetstreamClient {
        return this.client;
    }
}

// Helper functions for working with protobuf data
export class JetstreamUtils {
    /**
     * Convert bytes to hex string
     */
    static bytesToHex(bytes: Uint8Array): string {
        return Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Convert hex string to bytes
     */
    static hexToBytes(hex: string): Uint8Array {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes;
    }

    /**
     * Convert base58 string to bytes (basic implementation)
     */
    static base58ToBytes(base58: string): Uint8Array {
        // This is a simplified implementation
        // For production use, consider using a proper base58 library like 'bs58'
        throw new Error('Base58 decoding not implemented. Please use a library like bs58.');
    }

    /**
     * Convert bytes to base58 string (basic implementation)
     */
    static bytesToBase58(bytes: Uint8Array): string {
        // This is a simplified implementation
        // For production use, consider using a proper base58 library like 'bs58'
        throw new Error('Base58 encoding not implemented. Please use a library like bs58.');
    }
}

// Export all types from the generated protobuf code
export * from './generated/jetstream_protos/protos/jetstream'; 