---
name: add-minimax-mcp
description: Add MiniMax Coding Plan MCP to the container. Provides web_search and understand_image tools for agents inside containers.
---

# Add MiniMax Coding Plan MCP

This skill adds MiniMax Coding Plan MCP to the NanoClaw container, enabling agents to use:
- **web_search**: Network search tool
- **understand_image**: Image understanding and analysis tool

## Pre-flight

### Check if already applied

Check if the skill was already applied by looking for `minimax` in `.mcp.json`:

```bash
grep -i minimax .mcp.json
```

If found, skip to Phase 2 (Setup).

### Ask the user for API Key

Use `AskUserQuestion` to collect the MiniMax API Key:

AskUserQuestion: Please provide your MiniMax API Key
- **I have an API key** - Enter your API key
- **I need to subscribe** - Tell user to subscribe at https://platform.minimaxi.com/subscribe/coding-plan

If they need to subscribe, tell them:

> 1. Go to https://platform.minimaxi.com/subscribe/coding-plan
> 2. Subscribe to a plan to get your API key
> 3. Return here with the API key

## Phase 1: Apply Code Changes

### Modify Dockerfile

Edit `container/Dockerfile` to add uv installation after the system dependencies section (around line 26):

Add before the Chromium ENV lines:

```dockerfile
# Install uv for MCP tools
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"
```

### Modify .mcp.json

Add the MiniMax MCP configuration to `.mcp.json`:

```json
{
  "mcpServers": {
    "MiniMax": {
      "command": "uvx",
      "args": ["minimax-coding-plan-mcp", "-y"],
      "env": {
        "MINIMAX_API_KEY": "YOUR_API_KEY_HERE",
        "MINIMAX_API_HOST": "https://api.minimaxi.com"
      }
    }
  }
}
```

Replace `YOUR_API_KEY_HERE` with the user's actual API key.

### Save API Key to environment

The API key needs to be available in the container. Add it to the environment file:

```bash
echo "MINIMAX_API_KEY=your_api_key" >> data/env/env
```

## Phase 2: Rebuild Container

### Build the container

```bash
cd /Users/yao/Downloads/nanoclaw
./container/build.sh
```

Or with no cache:

```bash
docker buildx build --no-cache -t nanoclaw-agent -f container/Dockerfile container/
```

## Phase 3: Verify

### Test MCP availability

Inside a running container, verify the MCP is available:

```bash
claude mcp list
# Should show: minimax mcp: web_search, understand_image
```

Or test directly:

```bash
claude mcp call minimax web_search --query "test"
```

## Usage

Once installed, agents can use the tools:

```bash
# Search the web
mcp__MiniMax__web_search --query "your search query"

# Understand an image
mcp__MiniMax__understand_image --image_source "/path/to/image.jpg" --prompt "Describe this image"
```

## Troubleshooting

### MCP not available in container

1. Check uv is installed in container: `which uvx`
2. Check API key is set: `echo $MINIMAX_API_KEY`
3. Check .mcp.json is synced: `cat /home/node/.claude/.mcp.json`

### API errors

Verify the API key is correct and has sufficient quota at https://platform.minimaxi.com/

## Removal

To remove MiniMax MCP:

1. Remove the MiniMax entry from `.mcp.json`
2. Remove uv installation from `container/Dockerfile` (optional)
3. Rebuild the container: `./container/build.sh`
