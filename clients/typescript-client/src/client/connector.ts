import * as grpc from '@grpc/grpc-js';
import { JetstreamClient, JetstreamUtils } from '../jetstream-client';
import '../examples/decoding-example';

async function main() {
    const client = new JetstreamClient({
        endpoint: 'PLACE_URL_HERE',
        credentials: grpc.credentials.createInsecure(),
    });

    console.log('Connecting to Jetstream...');

    try {
        // Test connection
        const version = await client.getVersion();
        console.log(`Connected to Jetstream version: ${version.getVersion()}`);

        // Subscribe to all transactions
        const stream = client.subscribe({
            transactions: {
                'all': {}
            }
        });

        console.log('Listening for transactions...');

        stream.on('data', (update) => {
            if (update.hasTransaction()) {
                const txUpdate = update.getTransaction()!;
                const txInfo = txUpdate.getTransaction()!;

                console.log(`Transaction at slot ${txUpdate.getSlot()}:`);
                console.log(`  Signature: ${JetstreamUtils.bytesToHex(txInfo.getSignature_asU8())}`);
                console.log(`  Instructions: ${txInfo.getInstructionsList()}`);
                console.log(`  Account keys: ${txInfo.getAccountKeysList()}`);
            }

            if (update.hasAccount()) {
                const accUpdate = update.getAccount()!;
                const accInfo = accUpdate.getAccount()!;

                console.log(`Account update at slot ${accUpdate.getSlot()}:`);
                console.log(`  Address: ${JetstreamUtils.bytesToHex(accInfo.getPubkey_asU8())}`);
                console.log(`  Lamports: ${accInfo.getLamports()}`);
                console.log(`  Owner: ${JetstreamUtils.bytesToHex(accInfo.getOwner_asU8())}`);
            }
        });

        stream.on('error', (error) => {
            console.error('Stream error:', error);
        });

        stream.on('end', () => {
            console.log('Stream ended');
        });

        // Run for 30 seconds then exit
        setTimeout(() => {
            console.log('Closing connection...');
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