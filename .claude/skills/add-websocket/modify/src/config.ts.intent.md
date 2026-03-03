# Intent for src/config.ts

## Changes

Add WebSocket channel configuration at the end of the file:

```typescript
// WebSocket channel configuration
export const WEBSOCKET_PORT = parseInt(process.env.WEBSOCKET_PORT || '9876', 10);
export const WEBSOCKET_PAIRING_CODE_LENGTH = 6;
export const WEBSOCKET_PAIRING_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
```

## Invariants

- Add after existing exports (line 62)
- Keep existing exports unchanged
- Use environment variable WEBSOCKET_PORT with default 9876
