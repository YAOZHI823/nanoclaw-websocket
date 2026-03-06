# Intent for src/ipc.ts

Add IPC handler for container configuration (mount management).

## Changes

1. **Import changes**:
   - Add `getRegisteredGroup` and `setRegisteredGroup` to imports from `./db.js`
   - Add `AdditionalMount` and `ContainerConfig` to imports from `./types.js`

2. **Add IPC handler in `startIpcWatcher`** (around line 148, after send_file handling):
   - Add `else if (data.type === 'container_config')` block
   - Call `handleContainerConfig()` function
   - Include authorization check (only allow from own group's IPC directory or main)

3. **Add new function `handleContainerConfig`** (at end of file):
   - Handles `add_mount`, `remove_mount`, `list`, `clear` actions
   - For `add_mount`: adds mount to containerConfig.additionalMounts, marks as `isDefault: false`
   - For `remove_mount`: removes mount by hostPath
   - For `clear`: removes only non-default mounts (keeps mounts where `isDefault === true`)
   - For `list`: logs current mounts
   - Updates SQLite database via `setRegisteredGroup()`

## IPC Message Format

```json
{
  "type": "container_config",
  "action": "add_mount|remove_mount|list|clear",
  "sourceGroup": "main",
  "mount": {
    "hostPath": "~/dotfiles",
    "containerPath": "dotfiles",
    "readonly": true,
    "isDefault": false
  }
}
```

## Invariants

- Keep existing IPC handlers.
- Authorization: only allow from the group's own IPC directory.
- `clear` action must preserve default mounts.
