# Intent for src/index.ts

## Changes

### 1. Imports (top of file)

Add:
```typescript
import Database from 'better-sqlite3';
```
To the imports from 'fs' and 'path' section.

Add to config imports:
```typescript
DATA_DIR,
STORE_DIR,
```
(These should already exist, just add if not present)

Add channel import:
```typescript
import { WebSocketChannel } from './channels/websocket.js';
```

Add db import:
```typescript
import {
  db,  // Add this
  getAllChats,
  ...
};
```

### 2. Module variables

Add:
```typescript
let websocket: WebSocketChannel;
```

### 3. registerGroup function

Add after folder creation:
```typescript
// Create CLAUDE.md for device chats if it doesn't exist
if (group.folder.startsWith('device-')) {
  const claudeMdPath = path.join(groupDir, 'CLAUDE.md');
  if (!fs.existsSync(claudeMdPath)) {
    const deviceClaudeMd = `# Device Chat

You are chatting with a user via WebSocket.

## Important
- Do NOT use \`mcp__nanoclaw__send_message\` tool
- Just output your text response directly
- NanoClaw will automatically send via the correct channel
`;
    fs.writeFileSync(claudeMdPath, deviceClaudeMd);
    logger.info({ folder: group.folder }, 'Created device CLAUDE.md');
  }
}
```

### 4. processGroupMessages function

Add auto-registration for device chats:
```typescript
// Auto-create a virtual group for WebSocket device chats
if (!group && /^device-[^@]+@nanoclaw$/.test(chatJid)) {
  const deviceId = chatJid.replace(/^device-/, '').replace(/@nanoclaw$/, '');
  group = {
    name: `Device: ${deviceId}`,
    folder: `device-${deviceId}`,
    trigger: '',
    added_at: new Date().toISOString(),
    requiresTrigger: false,
  };
  registerGroup(chatJid, group);
  logger.info({ chatJid, deviceId }, 'Auto-registered device chat');
}
```

### 5. startMessageLoop function

Add query for device chats in recent messages:
```typescript
// Get all registered group JIDs plus any WebSocket device JIDs from recent messages
let jids = Object.keys(registeredGroups);

// Also check for device chats in recent messages
try {
  const recentDeviceChats = db
    .prepare(
      `SELECT DISTINCT chat_jid FROM messages WHERE chat_jid LIKE 'device-%@nanoclaw' AND timestamp > ?`,
    )
    .all(lastTimestamp) as { chat_jid: string }[];

  if (recentDeviceChats && recentDeviceChats.length > 0) {
    logger.debug({ recentDeviceChats, lastTimestamp }, 'Found device chats in messages');
    for (const row of recentDeviceChats) {
      if (!jids.includes(row.chat_jid)) {
        jids.push(row.chat_jid);
      }
    }
  }
} catch (err) {
  logger.warn({ err }, 'Failed to query device chats');
}
```

Also add the auto-registration in the message processing loop (similar to step 4).

## Invariants

- Existing WhatsApp channel must continue to work
- The skills engine will handle the three-way merge
- Database queries use parameterized queries to prevent SQL injection
