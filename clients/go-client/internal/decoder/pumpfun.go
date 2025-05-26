package decoder

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"strings"
)

const PumpFunProgramID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"

// Instruction discriminators (8 bytes each)
var (
	CreateIxDiscriminator = []byte{24, 30, 200, 40, 5, 28, 7, 119}
	BuyIxDiscriminator    = []byte{102, 6, 61, 18, 1, 218, 235, 234}
	SellIxDiscriminator   = []byte{51, 230, 133, 164, 1, 127, 131, 173}
)

// PumpFunInstruction represents a decoded PumpFun instruction
type PumpFunInstruction struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

// String returns a formatted string representation of the instruction
func (p *PumpFunInstruction) String() string {
	switch p.Type {
	case "Create":
		if data, ok := p.Data.(*CreateIxArgs); ok {
			return fmt.Sprintf("Create{Name: %s, Symbol: %s, URI: %s}", data.Name, data.Symbol, data.URI)
		}
	case "Buy":
		if data, ok := p.Data.(*BuyIxArgs); ok {
			return fmt.Sprintf("Buy{Amount: %d, MaxSolCost: %d}", data.Amount, data.MaxSolCost)
		}
	case "Sell":
		if data, ok := p.Data.(*SellIxArgs); ok {
			return fmt.Sprintf("Sell{Amount: %d, MinSolOutput: %d}", data.Amount, data.MinSolOutput)
		}
	}
	return fmt.Sprintf("%s{Data: %+v}", p.Type, p.Data)
}

// CreateIxArgs represents the arguments for a Create instruction
type CreateIxArgs struct {
	Name   string `json:"name"`
	Symbol string `json:"symbol"`
	URI    string `json:"uri"`
}

// BuyIxArgs represents the arguments for a Buy instruction
type BuyIxArgs struct {
	Amount     uint64 `json:"amount"`
	MaxSolCost uint64 `json:"max_sol_cost"`
}

// SellIxArgs represents the arguments for a Sell instruction
type SellIxArgs struct {
	Amount       uint64 `json:"amount"`
	MinSolOutput uint64 `json:"min_sol_output"`
}

// DecodePumpFunInstruction attempts to decode a PumpFun instruction
func DecodePumpFunInstruction(accounts []string, data []byte) (*PumpFunInstruction, error) {
	// Check if any account is the PumpFun program ID
	isPumpFun := false
	for _, account := range accounts {
		if account == PumpFunProgramID {
			isPumpFun = true
			break
		}
	}

	if !isPumpFun {
		return nil, fmt.Errorf("not a PumpFun program instruction")
	}

	if len(data) < 8 {
		return nil, fmt.Errorf("instruction data too short")
	}

	// Extract discriminator (first 8 bytes)
	discriminator := data[:8]
	instructionData := data[8:]

	// Match discriminator and decode accordingly
	if bytes.Equal(discriminator, CreateIxDiscriminator) {
		args, err := decodeCreateInstruction(instructionData)
		if err != nil {
			return nil, fmt.Errorf("failed to decode create instruction: %w", err)
		}
		return &PumpFunInstruction{
			Type: "Create",
			Data: args,
		}, nil
	}

	if bytes.Equal(discriminator, BuyIxDiscriminator) {
		args, err := decodeBuyInstruction(instructionData)
		if err != nil {
			return nil, fmt.Errorf("failed to decode buy instruction: %w", err)
		}
		return &PumpFunInstruction{
			Type: "Buy",
			Data: args,
		}, nil
	}

	if bytes.Equal(discriminator, SellIxDiscriminator) {
		args, err := decodeSellInstruction(instructionData)
		if err != nil {
			return nil, fmt.Errorf("failed to decode sell instruction: %w", err)
		}
		return &PumpFunInstruction{
			Type: "Sell",
			Data: args,
		}, nil
	}

	return nil, fmt.Errorf("unknown PumpFun instruction discriminator: %v", discriminator)
}

// decodeCreateInstruction decodes a Create instruction
func decodeCreateInstruction(data []byte) (*CreateIxArgs, error) {
	reader := bytes.NewReader(data)

	// Read name length and name
	name, err := readBorshString(reader)
	if err != nil {
		return nil, fmt.Errorf("failed to read name: %w", err)
	}

	// Read symbol length and symbol
	symbol, err := readBorshString(reader)
	if err != nil {
		return nil, fmt.Errorf("failed to read symbol: %w", err)
	}

	// Read URI length and URI
	uri, err := readBorshString(reader)
	if err != nil {
		return nil, fmt.Errorf("failed to read uri: %w", err)
	}

	return &CreateIxArgs{
		Name:   name,
		Symbol: symbol,
		URI:    uri,
	}, nil
}

// decodeBuyInstruction decodes a Buy instruction
func decodeBuyInstruction(data []byte) (*BuyIxArgs, error) {
	if len(data) < 16 {
		return nil, fmt.Errorf("buy instruction data too short")
	}

	reader := bytes.NewReader(data)

	var amount, maxSolCost uint64
	if err := binary.Read(reader, binary.LittleEndian, &amount); err != nil {
		return nil, fmt.Errorf("failed to read amount: %w", err)
	}
	if err := binary.Read(reader, binary.LittleEndian, &maxSolCost); err != nil {
		return nil, fmt.Errorf("failed to read max_sol_cost: %w", err)
	}

	return &BuyIxArgs{
		Amount:     amount,
		MaxSolCost: maxSolCost,
	}, nil
}

// decodeSellInstruction decodes a Sell instruction
func decodeSellInstruction(data []byte) (*SellIxArgs, error) {
	if len(data) < 16 {
		return nil, fmt.Errorf("sell instruction data too short")
	}

	reader := bytes.NewReader(data)

	var amount, minSolOutput uint64
	if err := binary.Read(reader, binary.LittleEndian, &amount); err != nil {
		return nil, fmt.Errorf("failed to read amount: %w", err)
	}
	if err := binary.Read(reader, binary.LittleEndian, &minSolOutput); err != nil {
		return nil, fmt.Errorf("failed to read min_sol_output: %w", err)
	}

	return &SellIxArgs{
		Amount:       amount,
		MinSolOutput: minSolOutput,
	}, nil
}

// readBorshString reads a Borsh-encoded string (4-byte length prefix + UTF-8 data)
func readBorshString(reader *bytes.Reader) (string, error) {
	var length uint32
	if err := binary.Read(reader, binary.LittleEndian, &length); err != nil {
		return "", fmt.Errorf("failed to read string length: %w", err)
	}

	if length == 0 {
		return "", nil
	}

	stringBytes := make([]byte, length)
	if _, err := reader.Read(stringBytes); err != nil {
		return "", fmt.Errorf("failed to read string data: %w", err)
	}

	return strings.TrimRight(string(stringBytes), "\x00"), nil
} 