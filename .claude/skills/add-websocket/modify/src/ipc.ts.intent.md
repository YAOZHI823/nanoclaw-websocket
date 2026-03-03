# Intent for src/ipc.ts

## Changes

### 1. Import

Add to group-folder imports:
```typescript
import { isValidGroupFolder, resolveGroupFolderPath } from './group-folder.js';
```

### 2. IpcDeps interface

Add to the interface:
```typescript
sendFile: (jid: string, fileName: string, filePath: string, mimeType: string) => Promise<void>;
```

### 3. IPC handler

Add in the message processing block (after the regular message handling):
```typescript
} else if (data.type === 'send_file' && data.chatJid && data.fileName && data.filePath) {
  // Send file to client
  // Allow if:
  // 1. isMain (main group can send to anyone)
  // 2. Target is in registeredGroups and matches source group
  // 3. Target is a WebSocket device (device-*@nanoclaw pattern) - always allow
  const targetGroup = registeredGroups[data.chatJid];
  const isWebSocketDevice = /^device-[^@]+@nanoclaw$/.test(data.chatJid);

  if (
    isMain ||
    (targetGroup && targetGroup.folder === sourceGroup) ||
    isWebSocketDevice
  ) {
    const mimeType = data.mimeType || 'application/octet-stream';

    // Convert container path to host path
    // Container path: /workspace/group/xxx.md
    // Host path: {DATA_DIR}/sessions/{groupFolder}/xxx.md
    let hostFilePath = data.filePath;
    if (data.filePath.startsWith('/workspace/group/')) {
      const relativePath = data.filePath.replace('/workspace/group/', '');
      const groupHostDir = resolveGroupFolderPath(sourceGroup);
      hostFilePath = path.join(groupHostDir, relativePath);
    }

    logger.info({ hostFilePath, exists: fs.existsSync(hostFilePath) }, 'Sending file to client');
    await deps.sendFile(data.chatJid, data.fileName, hostFilePath, mimeType);
    logger.info(
      { chatJid: data.chatJid, fileName: data.fileName, sourceGroup },
      'IPC file sent',
    );
  } else {
    logger.warn(
      { chatJid: data.chatJid, sourceGroup },
      'Unauthorized IPC file send attempt blocked',
    );
  }
}
```

## Invariants

- Existing IPC message handling must continue to work
- Security checks must remain: isMain, targetGroup check, etc.
- Path translation from container to host must be correct
