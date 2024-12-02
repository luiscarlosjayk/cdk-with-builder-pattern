package main

import (
	"context"
	"encoding/json"
	"log"
	"github.com/aws/aws-lambda-go/lambda"
)

type RequestPayload struct {
	Message string `json:"message"`
}

func handler(ctx context.Context, payload RequestPayload) (string, error) {
	// Log the payload
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		log.Printf("Error marshalling payload: %v", err)
		return "Failed to log payload", err
	}
	log.Printf("Received payload: %s", string(payloadBytes))

	return "Payload logged successfully", nil
}

func main() {
	// Start the Lambda handler
	lambda.Start(handler)
}