// Sandbox: mock merchant webhook receiver for once-pay-be (Go).
//
// Listens on :8000, POST /webhook
// - reads TEST_ONCE_PAY_API_KEY from .env next to this file (or the environment)
// - verifies the X-Signature header as HMAC-SHA256(raw_request_body, api_key)
//   (matches once-pay-be's send_webhook / get_webhook_signature)
// - outputs the request body
//
// Run: go run main.go
package main

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

const port = 8000

var apiKey = loadAPIKey()

// loadAPIKey prefers the environment, then falls back to a .env file
// (KEY=VALUE lines) placed next to this file.
func loadAPIKey() string {
	if key := os.Getenv("ONCE_PAY_API_KEY"); key != "" {
		return key
	}
	if key := os.Getenv("TEST_ONCE_PAY_API_KEY"); key != "" {
		return key
	}

	raw, err := os.ReadFile(".env")
	if err != nil {
		log.Fatalf("API key not set — export ONCE_PAY_API_KEY or create a .env with TEST_ONCE_PAY_API_KEY")
	}
	for _, line := range strings.Split(string(raw), "\n") {
		line = strings.TrimSpace(line)
		if value, ok := strings.CutPrefix(line, "TEST_ONCE_PAY_API_KEY="); ok {
			return strings.Trim(value, `"'`)
		}
	}
	log.Fatalf("TEST_ONCE_PAY_API_KEY not found in .env")
	return ""
}

// isValidSignature mirrors the node sandbox / once-pay-be pattern:
// expected = HMAC-SHA256(raw_body, api_key) as lowercase hex, compared
// with a length check first and a constant-time comparison second.
func isValidSignature(rawBody []byte, signature string) bool {
	mac := hmac.New(sha256.New, []byte(apiKey))
	mac.Write(rawBody)
	expected := hex.EncodeToString(mac.Sum(nil))

	expectedBuf := []byte(expected)
	signatureBuf := []byte(signature)
	if len(expectedBuf) != len(signatureBuf) {
		return false
	}
	return hmac.Equal(expectedBuf, signatureBuf)
}

func webhookHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// the exact bytes received — never the parsed/re-stringified body
	var rawBody bytes.Buffer
	if _, err := rawBody.ReadFrom(r.Body); err != nil {
		http.Error(w, "Failed to read body", http.StatusBadRequest)
		return
	}

	signature := r.Header.Get("X-Signature") // Get is case-insensitive
	if signature == "" {
		log.Println("[WEBHOOK REJECTED] No X-Signature header")
		http.Error(w, "Missing X-Signature header", http.StatusBadRequest)
		return
	}

	if !isValidSignature(rawBody.Bytes(), signature) {
		log.Println("[WEBHOOK REJECTED] Invalid signature")
		http.Error(w, "Invalid signature", http.StatusUnauthorized)
		return
	}

	var body any
	if err := json.Unmarshal(rawBody.Bytes(), &body); err != nil {
		log.Println("[WEBHOOK VALIDATED] Signature OK (body is not JSON)")
		body = rawBody.String()
	} else {
		log.Println("[WEBHOOK VALIDATED] Signature OK")
	}

	pretty, err := json.MarshalIndent(body, "", "  ")
	if err != nil {
		pretty = rawBody.Bytes()
	}
	log.Printf("Request body: %s", pretty)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"received": true,
		"message":  "Signature verified, request body logged",
		"body":     body,
	})
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/webhook", webhookHandler)

	srv := &http.Server{
		Addr:              fmt.Sprintf(":%d", port),
		Handler:           mux,
		ReadHeaderTimeout: 10 * time.Second,
	}

	log.Printf("Sandbox webhook receiver (Go) running on http://localhost:%d", port)
	log.Printf("POST /webhook  (expects X-Signature: HMAC-SHA256 of raw body using TEST_ONCE_PAY_API_KEY)")
	log.Fatal(srv.ListenAndServe())
}