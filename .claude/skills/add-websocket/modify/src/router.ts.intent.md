# Intent for src/router.ts

## Changes

### 1. Import

Add at the top:
```typescript
import { logger } from './logger.js';
```

### 2. New function

Add at the end of the file:
```typescript
export function routeOutboundFile(
  channels: Channel[],
  jid: string,
  fileName: string,
  filePath: string,
  mimeType: string,
): Promise<void> {
  const channel = channels.find((c) => c.ownsJid(jid) && c.isConnected());
  if (!channel) throw new Error(`No channel for JID: ${jid}`);

  if (!channel.sendFile) {
    logger.warn({ channel: channel.name, jid }, 'Channel does not support file transfer');
    return Promise.resolve();
  }

  return channel.sendFile(jid, fileName, filePath, mimeType);
}
```

## Invariants

- Existing routing functions must remain unchanged
- The function should check if channel supports sendFile before calling
