import { JetstreamClient, SubscribeUpdateParsedTransaction } from '../jetstream-client';
import { PumpFunDecoder } from '../decoder/pumpfun';
import { PublicKey } from '@solana/web3.js';
import * as grpc from '@grpc/grpc-js';
import { toSimpleString } from '../client/connector';

// Helper function to safely stringify objects with BigInt values
function safeStringify(obj: any): string {
    return JSON.stringify(obj, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
    );
}

async function main() {
    const client = new JetstreamClient({
        endpoint: 'PLACE_URL_HERE',
        credentials: grpc.credentials.createInsecure(),
    });

    try {
        console.log('Connecting to Jetstream...');
        const version = await client.getVersion();
        console.log('Connected to Jetstream version:', version);

        // --- Raw Transaction Decoding ---
        console.log('\n--- Raw Transaction Decoding ---');

        const rawStream = client.subscribe({
            transactions: {
                'pumpfun-filter': {
                    accountInclude: ['6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'],
                }
            }
        });

        rawStream.on('data', (update) => {
            if (!update.transaction) return;

            const txUpdate = update.transaction!;
            const txInfo = txUpdate.transaction!;
            const signature = Buffer.from(txInfo.signature).toString('base64');
            const instructions = txInfo.instructions;
            const accountKeys: PublicKey[] = txInfo.accountKeys.map((key: Buffer) => new PublicKey(key));

            console.log('Raw Transaction:');
            console.log('  Slot:', txUpdate.slot);
            console.log('  Signature:', signature);
            console.log('  Account Keys:', accountKeys.map(k => k.toBase58()).join(', '));
            console.log('  Instruction Count:', instructions.length);

            console.log('');
        });

        rawStream.on('error', (err) => {
            console.error('Raw stream error:', err);
        });

        // --- Parsed Instruction Handling ---
        console.log('\n--- Parsed Instruction Handling ---');

        const parsedStream = client.subscribeParsed(1);

        parsedStream.on('data', (update: SubscribeUpdateParsedTransaction) => {
            const instructions = update.instructions;
            const signature = update.signature;

            console.log('Parsed Transaction:');
            console.log('  Slot:', update.slot);
            console.log('  Signature:', toSimpleString(signature));
            console.log('  Instruction Count:', instructions.length);

            instructions.forEach((ix: any, i: number) => {
                if (ix.initialize) {
                    console.log(`  Instruction [${i}] Type: initialize`);
                } else if (ix.setParams) {
                    console.log(`  Instruction [${i}] Type: set_params`);
                    const d = ix.setParams;
                    console.log(`    Fee Recipient: ${new PublicKey(d.feeRecipient).toBase58()}`);
                    console.log(`    Initial Virtual Token Reserves: ${d.initialVirtualTokenReserves}`);
                    console.log(`    Initial Virtual SOL Reserves: ${d.initialVirtualSolReserves}`);
                    console.log(`    Initial Real Token Reserves: ${d.initialRealTokenReserves}`);
                    console.log(`    Token Total Supply: ${d.tokenTotalSupply}`);
                    console.log(`    Fee Basis Points: ${d.feeBasisPoints}`);
                } else if (ix.create) {
                    const d = ix.create!;
                    console.log(`  Instruction [${i}] Type: create`);
                    console.log(`    Name: ${d.name}`);
                    console.log(`    Symbol: ${d.symbol}`);
                    console.log(`    URI: ${d.uri}`);
                } else if (ix.buy) {
                    const d = ix.buy!;
                    console.log(`  Instruction [${i}] Type: buy`);
                    console.log(`    Amount: ${d.amount}`);
                    console.log(`    Max Cost: ${d.maxSolCost}`);
                } else if (ix.sell) {
                    const d = ix.sell!;
                    console.log(`  Instruction [${i}] Type: sell`);
                    console.log(`    Amount: ${d.amount}`);
                    console.log(`    Min Output: ${d.minSolOutput}`);
                } else if (ix.withdraw) {
                    console.log(`  Instruction [${i}] Type: withdraw`);
                }
            });

            console.log('');
        });

        parsedStream.on('error', (err) => {
            console.error('Parsed stream error:', err);
        });

        console.log('Listening for transactions...');

        process.on('SIGINT', () => {
            console.log('\nShutting down...');
            client.close();
            process.exit(0);
        });

        await new Promise(() => { });

    } catch (err) {
        console.error('Fatal error:', err);
        client.close();
        process.exit(1);
    }
}

const PUMP_FUN_PROGRAM_ID = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');

const hasPumpFunProgram = (accounts: PublicKey[]) =>
    accounts.some(account =>
        account.equals(PUMP_FUN_PROGRAM_ID)
    );

main().catch(console.error);
