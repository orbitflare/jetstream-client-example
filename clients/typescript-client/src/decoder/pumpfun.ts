import { PublicKey } from '@solana/web3.js';
import { BinaryReader } from 'borsh';

// PumpFun Program ID
export const PUMPFUN_PROGRAM_ID = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');

// Instruction discriminators (8 bytes each)
export const CREATE_IX_DISCM = new Uint8Array([24, 30, 200, 40, 5, 28, 7, 119]);
export const BUY_IX_DISCM = new Uint8Array([102, 6, 61, 18, 1, 218, 235, 234]);
export const SELL_IX_DISCM = new Uint8Array([51, 230, 133, 164, 1, 127, 131, 173]);

export interface CreateIxArgs {
    name: string;
    symbol: string;
    uri: string;
}

export interface BuyIxArgs {
    amount: bigint;
    maxSolCost: bigint;
}

export interface SellIxArgs {
    amount: bigint;
    minSolOutput: bigint;
}

export type PumpProgramIx =
    | { type: 'create'; data: CreateIxArgs }
    | { type: 'buy'; data: BuyIxArgs }
    | { type: 'sell'; data: SellIxArgs };

export class PumpFunDecoder {
    /**
     * Deserialize PumpFun program instruction data
     */
    static deserializePumpFun(accounts: PublicKey[], data: Uint8Array): PumpProgramIx | null {
        // Check if this instruction involves the PumpFun program
        const hasPumpFunProgram = accounts.some(account =>
            account.equals(PUMPFUN_PROGRAM_ID)
        );

        if (!hasPumpFunProgram) {
            return null;
        }

        if (data.length < 8) {
            return null;
        }

        // Extract discriminator (first 8 bytes)
        const discriminator = data.slice(0, 8);
        const instructionData = data.slice(8);

        if (this.arraysEqual(discriminator, CREATE_IX_DISCM)) {
            return {
                type: 'create',
                data: this.deserializeCreate(instructionData)
            };
        } else if (this.arraysEqual(discriminator, BUY_IX_DISCM)) {
            return {
                type: 'buy',
                data: this.deserializeBuy(instructionData)
            };
        } else if (this.arraysEqual(discriminator, SELL_IX_DISCM)) {
            return {
                type: 'sell',
                data: this.deserializeSell(instructionData)
            };
        }

        return null;
    }

    private static deserializeCreate(data: Uint8Array): CreateIxArgs {
        const reader = new BinaryReader(Buffer.from(data));

        const name = reader.readString();
        const symbol = reader.readString();
        const uri = reader.readString();

        return { name, symbol, uri };
    }

    private static deserializeBuy(data: Uint8Array): BuyIxArgs {
        const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

        const amount = view.getBigUint64(0, true); // little endian
        const maxSolCost = view.getBigUint64(8, true); // little endian

        return { amount, maxSolCost };
    }

    private static deserializeSell(data: Uint8Array): SellIxArgs {
        const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

        const amount = view.getBigUint64(0, true); // little endian
        const minSolOutput = view.getBigUint64(8, true); // little endian

        return { amount, minSolOutput };
    }

    private static arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
} 