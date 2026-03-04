---
name: add-minimax-mcp
description: Add MiniMax Coding Plan MCP to the container. Provides web_search and understand_image tools for agents inside containers.
---

# Add MiniMax Coding Plan MCP

This skill adds MiniMax Coding Plan MCP to the NanoClaw container, enabling agents to use:
- **web_search**: Network search tool
- **understand_image**: Image understanding and analysis tool

## How it works

1. **.mcp.json** - 配置 MCP 服务器，使用 `__ANTHROPIC_API_KEY__` 占位符
2. **container-runner.ts** - 运行时从 `.env` 读取并注入实际 API key 到容器
3. **Dockerfile** - 安装 uv 并配置国内镜像源

## Pre-flight

### Check if already applied

```bash
grep -i minimax .mcp.json
```

If found, skip to Phase 2.

### Requirements

1. MiniMax API Key in `.env` (ANTHROPIC_API_KEY or MINIMAX_API_KEY)
2. Container rebuilt with new code

## Phase 1: Configure MCP

### Modify .mcp.json

Add MiniMax MCP configuration with `__ANTHROPIC_API_KEY__` placeholder:

```json
{
  "mcpServers": {
    "MiniMax": {
      "command": "uvx",
      "args": ["minimax-coding-plan-mcp", "-y"],
      "env": {
        "MINIMAX_API_KEY": "__ANTHROPIC_API_KEY__",
        "MINIMAX_API_HOST": "https://api.minimaxi.com"
      }
    }
  }
}
```

The placeholder `__ANTHROPIC_API_KEY__` will be automatically replaced with the actual API key from `.env`.

### Ensure API Key in .env

Make sure `.env` contains:

```
ANTHROPIC_API_KEY=your_minimax_api_key
# or
MINIMAX_API_KEY=your_minimax_api_key
```

## Phase 2: Rebuild

```bash
# Rebuild container
docker buildx build --no-cache -t nanoclaw-agent:latest -f container/Dockerfile container/

# Restart NanoClaw
launchctl kickstart -k gui/$(id -u)/com.nanoclaw
```

## Phase 3: Verify

Check settings.json has the API key:

```bash
docker exec <container> cat /home/node/.claude/settings.json
```

Check MCP config:

```bash
docker exec <container> cat /home/node/.claude/.claude.json
```

Test MCP:

```bash
docker exec <container> uvx minimax-coding-plan-mcp --version
```

## Usage

In Claude Code inside container:

```bash
mcp__MiniMax__web_search --query "search query"
mcp__MiniMax__understand_image --image_source "/path/to/image.jpg" --prompt "Describe this image"
```

## Troubleshooting

### Network error

If uv can't download packages, check the mirror configuration in Dockerfile.

### MCP not available

1. Check uvx: `which uvx`
2. Check settings.json: `cat /home/node/.claude/settings.json`
3. Check .claude.json: `cat /home/node/.claude/.claude.json`

## Removal

1. Remove MiniMax entry from `.mcp.json`
2. Rebuild container
3. Restart NanoClaw
