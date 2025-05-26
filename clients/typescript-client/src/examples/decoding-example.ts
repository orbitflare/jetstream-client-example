import { JetstreamClient } from '../jetstream-client';
import { PumpFunDecoder } from '../decoder/pumpfun';
import { PublicKey } from '@solana/web3.js';
import * as grpc from '@grpc/grpc-js';

/**
 * Decoding Example - demonstrates both raw instruction decoding and parsed instruction handling
 * Similar to the Rust jetstream client example
 */
async function main() {
    const client = new JetstreamClient({
        endpoint: 'PLACE_URL_HERE',
        credentials: grpc.credentials.createInsecure(),
    });

    try {
        // Test connection
        console.log('Testing connection...');
        const version = await client.getVersion();
        console.log(`Connected to Jetstream v${version.getVersion()}`);

        // Example 1: Raw Transaction Decoding
        console.log('\n=== Starting Raw Transaction Decoding ===');

        const rawStream = client.subscribe({
            transactions: {
                'pumpfun-filter': {
                    accountInclude: ['6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'], // PumpFun program
                }
            }
        });

        rawStream.on('data', (update) => {
            if (update.hasTransaction()) {
                const txUpdate = update.getTransaction()!;
                const txInfo = txUpdate.getTransaction()!;

                const signature = Buffer.from(txInfo.getSignature_asU8()).toString('base64');
                console.log(`Raw Transaction received - Signature: ${signature}`);

                // Decode instructions
                const instructions = txInfo.getInstructionsList();
                const accountKeys = txInfo.getAccountKeysList().map((key: Uint8Array) =>
                    new PublicKey(Buffer.from(key as Uint8Array))
                );

                for (const instruction of instructions) {
                    const data = instruction.getData_asU8();

                    // Try to decode as PumpFun instruction
                    const pumpIx = PumpFunDecoder.deserializePumpFun(accountKeys, data);
                    if (pumpIx) {
                        console.log(`  PumpFun Instruction: ${pumpIx.type}`);

                        switch (pumpIx.type) {
                            case 'create':
                                console.log(`    Create: ${pumpIx.data.name} (${pumpIx.data.symbol})`);
                                console.log(`    URI: ${pumpIx.data.uri}`);
                                break;
                            case 'buy':
                                console.log(`    Buy: ${pumpIx.data.amount} tokens, max cost: ${pumpIx.data.maxSolCost} lamports`);
                                break;
                            case 'sell':
                                console.log(`    Sell: ${pumpIx.data.amount} tokens, min output: ${pumpIx.data.minSolOutput} lamports`);
                                break;
                        }
                    }
                }
            }
        });

        rawStream.on('error', (error) => {
            console.error('Raw stream error:', error);
        });

        // Example 2: Parsed Instruction Handling
        console.log('\n=== Starting Parsed Instruction Handling ===');

        const parsedStream = client.subscribeParsed(1);

        parsedStream.on('data', (update) => {
            if (!update.getSignature_asU8() || update.getSignature_asU8().length === 0) {
                return;
            }

            const signature = Buffer.from(update.getSignature_asU8()).toString('base64');

            // Extract instruction types
            const instructions = update.getInstructionsList();
            const instructionTypes: string[] = [];

            for (const instruction of instructions) {
                if (instruction.hasInitialize()) {
                    instructionTypes.push('initialize');
                } else if (instruction.hasSetParams()) {
                    instructionTypes.push('set_params');
                } else if (instruction.hasCreate()) {
                    const createData = instruction.getCreate()!;
                    instructionTypes.push(`create(${createData.getName()}, ${createData.getSymbol()})`);
                } else if (instruction.hasBuy()) {
                    const buyData = instruction.getBuy()!;
                    instructionTypes.push(`buy(amount: ${buyData.getAmount()}, max_cost: ${buyData.getMaxSolCost()})`);
                } else if (instruction.hasSell()) {
                    const sellData = instruction.getSell()!;
                    instructionTypes.push(`sell(amount: ${sellData.getAmount()}, min_output: ${sellData.getMinSolOutput()})`);
                } else if (instruction.hasWithdraw()) {
                    instructionTypes.push('withdraw');
                }
            }

            const instructionSummary = instructionTypes.length > 0
                ? `, Instructions: ${instructionTypes.join(', ')}`
                : '';

            console.log(`Parsed Transaction received - Signature: ${signature}${instructionSummary}`);
        });

        parsedStream.on('error', (error) => {
            console.error('Parsed stream error:', error);
        });

        // Keep the connection alive
        console.log('\nListening for transactions... Press Ctrl+C to exit');

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\nShutting down...');
            client.close();
            process.exit(0);
        });

        // Keep the process running
        await new Promise(() => { });

    } catch (error) {
        console.error('Error:', error);
        client.close();
        process.exit(1);
    }
}

// Run the example
main().catch(console.error); 