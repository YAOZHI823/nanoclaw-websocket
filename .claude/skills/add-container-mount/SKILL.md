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

## 阶段 1：代码修改

### 1. 修改 `src/types.ts`

在 `AdditionalMount` 接口中添加 `isDefault` 字段：

```typescript
export interface AdditionalMount {
  hostPath: string;
  containerPath?: string;
  readonly?: boolean;
  isDefault?: boolean;  // 新增：标记是否为默认挂载
}
```

### 2. 修改 `src/ipc.ts`

1. 添加导入：
```typescript
import { getRegisteredGroup, setRegisteredGroup } from './db.js';
import { AdditionalMount, ContainerConfig } from './types.js';
```

2. 在 IPC 消息处理中添加 `container_config` 类型处理

3. 添加 `handleContainerConfig` 函数处理以下操作：
- `add_mount`: 添加挂载
- `remove_mount`: 移除挂载
- `list`: 列出挂载
- `clear`: 清除用户挂载（保留默认挂载）

### 3. 添加容器脚本

创建 `container/bin/container-config` 脚本：

```bash
#!/bin/bash
# 用法:
#   container-config --add-mount <hostPath>[:<containerPath>[:<ro|rw>]]
#   container-config --remove-mount <hostPath>
#   container-config --list
#   container-config --clear
```

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

---

## Phase 1: Code Changes

### 1. Modify `src/types.ts`

Add `isDefault` field to `AdditionalMount` interface.

### 2. Modify `src/ipc.ts`

1. Add imports for database functions and types
2. Add `container_config` IPC handler
3. Add `handleContainerConfig` function

### 3. Add Container Script

Create `container/bin/container-config` script.

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

## Notes

- Mounts take effect on **next container restart**
- Host path `~/dotfiles` mounts to `/workspace/extra/dotfiles` in container
- `--clear` only removes user-defined mounts, keeps system defaults
