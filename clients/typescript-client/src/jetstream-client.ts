import * as grpc from '@grpc/grpc-js';
import { JetstreamClient as GrpcJetstreamClient } from './generated/jetstream_grpc_pb';
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
} from './generated/jetstream_pb';

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
        const credentials = config.credentials || grpc.credentials.createInsecure();
        this.client = new GrpcJetstreamClient(config.endpoint, credentials, config.options);
    }

    /**
     * Subscribe to transaction and account updates with filtering
     */
    subscribe(filters: SubscribeFilters): grpc.ClientDuplexStream<SubscribeRequest, SubscribeUpdate> {
        const stream = this.client.subscribe();

        // Send initial subscription request
        const request = new SubscribeRequest();

        // Set up transaction filters
        if (filters.transactions) {
            const transactionMap = request.getTransactionsMap();
            Object.entries(filters.transactions).forEach(([key, filter]) => {
                const txFilter = new SubscribeRequestFilterTransactions();
                if (filter.accountInclude) {
                    txFilter.setAccountIncludeList(filter.accountInclude);
                }
                if (filter.accountExclude) {
                    txFilter.setAccountExcludeList(filter.accountExclude);
                }
                if (filter.accountRequired) {
                    txFilter.setAccountRequiredList(filter.accountRequired);
                }
                transactionMap.set(key, txFilter);
            });
        }

        // Set up account filters
        if (filters.accounts) {
            const accountMap = request.getAccountsMap();
            Object.entries(filters.accounts).forEach(([key, filter]) => {
                const accFilter = new SubscribeRequestFilterAccounts();
                if (filter.account) {
                    accFilter.setAccountList(filter.account);
                }
                if (filter.owner) {
                    accFilter.setOwnerList(filter.owner);
                }
                // TODO: Add support for complex filters (memcmp, datasize, lamports)
                accountMap.set(key, accFilter);
            });
        }

        // Set up ping
        if (filters.ping) {
            const ping = new SubscribeRequestPing();
            ping.setId(filters.ping.id);
            request.setPing(ping);
        }

        stream.write(request);
        return stream;
    }

    /**
     * Subscribe to parsed transaction updates
     */
    subscribeParsed(pingId?: number): grpc.ClientDuplexStream<SubscribeParsedRequest, SubscribeUpdateParsedTransaction> {
        const stream = this.client.subscribeParsed();

        const request = new SubscribeParsedRequest();
        if (pingId !== undefined) {
            const ping = new SubscribeRequestPing();
            ping.setId(pingId);
            request.setPing(ping);
        }

        stream.write(request);
        return stream;
    }

    /**
     * Send a ping request
     */
    async ping(count: number = 1): Promise<PongResponse> {
        return new Promise((resolve, reject) => {
            const request = new PingRequest();
            request.setCount(count);

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
            const request = new GetVersionRequest();

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

export * from './generated/jetstream_pb';
export * from './generated/jetstream_grpc_pb'; 