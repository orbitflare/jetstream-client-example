package decoder

import (
	"fmt"
	"log"

	pb "jetstream-client-go/jetstream-client-go/proto"

	"github.com/mr-tron/base58"
)

// ProcessInstruction processes a transaction instruction and attempts to decode it
func ProcessInstruction(txInfo *pb.SubscribeUpdateTransactionInfo, instruction *pb.CompiledInstruction) error {
	// Convert account keys to string format for easier handling
	accounts := make([]string, len(txInfo.AccountKeys))
	for i, key := range txInfo.AccountKeys {
		accounts[i] = base58.Encode(key)
	}

	signature := base58.Encode(txInfo.Signature)

	// Try to decode as PumpFun instruction
	if pumpIx, err := DecodePumpFunInstruction(accounts, instruction.Data); err == nil {
		log.Printf("Signature: %s - Pump program instruction: %s", signature, pumpIx.String())
		return nil
	}

	// Add more decoders here as needed
	// if otherIx, err := DecodeOtherInstruction(accounts, instruction.Data); err == nil {
	//     log.Printf("Signature: %s - Other program instruction: %+v", signature, otherIx)
	//     return nil
	// }

	return fmt.Errorf("unknown instruction format")
} 