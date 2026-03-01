# WebSocket Mobile Examples

This directory contains example code for connecting mobile apps to NanoClaw via WebSocket.

## Protocol

### Connection Flow

1. **Connect** to `ws://<nanoclaw-ip>:9876`
2. **Send pairing request**:
   ```json
   {
     "type": "pairing_request",
     "deviceId": "your-device-unique-id"
   }
   ```
3. **Receive pairing code** from server (check NanoClaw logs)
4. **Verify pairing**:
   ```json
   {
     "type": "pairing_verify",
     "deviceId": "your-device-unique-id",
     "pairingCode": "ABCD12"
   }
   ```
5. **On success**, start sending/receiving messages

### Message Format

**Send message** (client → server):
```json
{
  "type": "message",
  "content": "Hello, ask Claude something"
}
```

**Receive message** (server → client):
```json
{
  "type": "message",
  "from": "assistant",
  "content": "Hello! How can I help you?",
  "timestamp": 1234567890
}
```

### Keep-alive

Send periodic ping/pong to maintain connection:
```json
{"type": "ping"}
// Response: {"type": "pong"}
```

## Examples

| Platform | File |
|----------|------|
| iOS (Swift) | `ios/NanoClawClient.swift` |
| Android (Kotlin) | `android/MainActivity.kt` |
| Node.js test | `test-client.js` |
