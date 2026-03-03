# Intent for src/types.ts

## Changes

### 1. NewMessage interface

Add after `is_bot_message`:
```typescript
attachments?: Attachment[];
```

### 2. New Attachment interface

Add before ScheduledTask:
```typescript
export interface Attachment {
  filename: string;
  path: string;
  mimeType: string;
  size: number;
}
```

### 3. Channel interface

Add after setTyping:
```typescript
// Optional: send file to client. Channels that support it implement it.
sendFile?(jid: string, fileName: string, filePath: string, mimeType: string): Promise<void>;
```

## Invariants

- Existing Channel interface must remain unchanged for other channels
- The sendFile method is optional - only WebSocket channel implements it
