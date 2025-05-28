import * as grpc from '@grpc/grpc-js';
import * as bs58 from 'bs58';
import { JetstreamClient } from '../jetstream-client';
import '../examples/decoding-example';

export function toSimpleString(data: any): string {
    if (!data) return 'null';

    if (data instanceof Uint8Array) {
        return bs58.default.encode(data);
    }

    if (Array.isArray(data)) {
        return data.map(item => toSimpleString(item)).join(', ');
    }

    if (typeof data === 'object') {
        return JSON.stringify(data);
    }

    return String(data);
}

async function main() {
    const client = new JetstreamClient({
        endpoint: 'PLACE_URL_HERE',
        credentials: grpc.credentials.createInsecure(),
    });

    console.log('Connecting to Jetstream...');

    try {
        const version = await client.getVersion();
        console.log('Connected to Jetstream version:', version.version);

        const stream = client.subscribe({
            transactions: {
                all: {},
            },
        });

        console.log('Listening for transactions...\n');

        stream.on('data', (update) => {
            if (update.transaction) {
                const txUpdate = update.transaction!;
                const txInfo = txUpdate.transaction!;

                console.log('Transaction:');
                console.log('  Slot:', txUpdate.slot);
                console.log('  Signature:', toSimpleString(txInfo.signature));
                console.log('  Instructions:', toSimpleString(txInfo.instructions));
                console.log('  Account Keys:', toSimpleString(txInfo.accountKeys));
                console.log('');
            }

            if (update.account) {
                const accUpdate = update.account!;
                const accInfo = accUpdate.account!;

                console.log('Account Update:');
                console.log('  Slot:', accUpdate.slot);
                console.log('  Address:', toSimpleString(accInfo.pubkey));
                console.log('  Lamports:', accInfo.lamports?.toString() || 'null');
                console.log('  Owner:', toSimpleString(accInfo.owner));
                console.log('  Data Length:', accInfo.data?.length || 0);
                console.log('  Data Preview:', toSimpleString(accInfo.data?.slice(0, 32)));
                console.log('');
            }
        });

        stream.on('error', (error) => {
            console.error('Stream error:', error);
        });

        stream.on('end', () => {
            console.log('Stream ended');
        });

        setTimeout(() => {
            console.log('Closing connection after 30 seconds...');
            stream.cancel();
            client.close();
        }, 30000);

    } catch (error) {
        console.error('Error:', error);
        client.close();
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}
