---
name: add-container-mount
description: Add container-config tool for managing mount points from within containers
---

# Add Container Mount Management

This skill adds a `container-config` tool that allows agents running inside containers to manage their own mount points.

## Trigger

Use this skill when user wants to:
- Add custom mount points from within a container
- Remove mount points
- List current mounts
- Clear user-defined mounts

Keywords: "mount", "挂载", "container config", "container-config"

---

## 功能说明

在容器内部管理挂载点的工具，允许 agent 动态添加/移除挂载。

## 使用场景

- Agent 需要访问宿主机上的特定目录
- 用户想让 agent 使用自己的配置文件
- 动态调整容器挂载配置

## 配置文件格式

`~/.config/nanoclaw/mount-allowlist.json`:

```json
{
  "allowedRoots": [
    "/Users/yao/Downloads",
    "~/projects"
  ],
  "blockedPatterns": [],
  "nonMainReadOnly": false
}
```

支持两种格式：
- 字符串数组：`["/path"]` - 默认 allowReadWrite: true
- 对象数组：`[{"path": "/path", "allowReadWrite": true}]`

## 阶段 1：代码修改

### 1. 修改 `src/types.ts`

在 `AdditionalMount` 接口中添加 `isDefault` 字段：

```typescript
export interface AdditionalMount {
  hostPath: string;
  containerPath?: string;
  readonly?: boolean;
  isDefault?: boolean;
}
```

### 2. 修改 `src/mount-security.ts`

1. 添加空路径处理：
```typescript
function expandPath(p: string): string {
  if (!p) {
    return '';
  }
  // ...
}
```

2. 支持 "group" 特殊值：
```typescript
function isValidContainerPath(containerPath: string): boolean {
  if (containerPath === 'group') {
    return true;
  }
  // ...
}
```

3. 支持字符串格式的 allowedRoots：
```typescript
allowlist.allowedRoots = allowlist.allowedRoots.map((root: any) => {
  if (typeof root === 'string') {
    return { path: root, allowReadWrite: true };
  }
  return root;
});
```

### 3. 修改 `src/ipc.ts`

1. 添加导入：
```typescript
import { getRegisteredGroup, setRegisteredGroup } from './db.js';
import { AdditionalMount, ContainerConfig } from './types.js';
```

2. 添加 IPC 处理和 `handleContainerConfig` 函数

### 4. 修改 `src/container-runner.ts`

添加 NANOCLAW_GROUP_FOLDER 环境变量：
```typescript
if (groupFolder) {
  args.push('-e', `NANOCLAW_GROUP_FOLDER=${groupFolder}`);
}
```

### 5. 添加容器脚本

创建 `container/bin/container-config` 脚本

## 阶段 2：使用

在**容器内**执行：

```bash
# 添加挂载（只读）
container-config --add-mount ~/dotfiles:dotfiles:ro

# 添加挂载（读写）
container-config --add-mount ~/projects:projects:rw

# 列出当前挂载
container-config --list

# 移除挂载
container-config --remove-mount ~/dotfiles

# 清除所有用户自定义挂载（保留默认挂载）
container-config --clear
```

## 挂载说明

- 挂载在**下次容器启动**时生效
- 宿主机的 `~/dotfiles` 会挂载到容器的 `/workspace/extra/dotfiles`
- `--clear` 只清除用户添加的挂载，系统默认挂载会被保留
- 需要在 `~/.config/nanoclaw/mount-allowlist.json` 中配置允许的挂载路径

---

## Phase 1: Code Changes

### 1. Modify `src/types.ts`

Add `isDefault` field to `AdditionalMount` interface.

### 2. Modify `src/mount-security.ts`

1. Add empty path handling in expandPath
2. Support special "group" value for containerPath
3. Support string format for allowedRoots

### 3. Modify `src/ipc.ts`

1. Add imports for database functions
2. Add IPC handler for container_config
3. Add handleContainerConfig function

### 4. Modify `src/container-runner.ts`

Add NANOCLAW_GROUP_FOLDER env var

### 5. Add Container Script

Create `container/bin/container-config`

## Phase 2: Usage

Run inside **container**:

```bash
# Add mount (read-only)
container-config --add-mount ~/dotfiles:dotfiles:ro

# Add mount (read-write)
container-config --add-mount ~/projects:projects:rw

# List current mounts
container-config --list

# Remove mount
container-config --remove-mount ~/dotfiles

# Clear all user-defined mounts (keep defaults)
container-config --clear
```

## Config File Format

`~/.config/nanoclaw/mount-allowlist.json`:

```json
{
  "allowedRoots": ["/Users/yao/Downloads", "~/projects"],
  "blockedPatterns": [],
  "nonMainReadOnly": false
}
```

## Notes

- Mounts take effect on **next container restart**
- Host path `~/dotfiles` mounts to `/workspace/extra/dotfiles` in container
- `--clear` only removes user-defined mounts, keeps system defaults
- Must configure allowed paths in `~/.config/nanoclaw/mount-allowlist.json`
