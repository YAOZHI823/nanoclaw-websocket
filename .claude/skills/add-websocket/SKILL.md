---
name: add-websocket
description: Add WebSocket channel for custom mobile/web apps. Perfect for regions where WhatsApp/Telegram are blocked (e.g., China). Works with NAT/内网穿透 to bypass firewall restrictions. Supports bidirectional file transfer and offline message queue.
---

# Add WebSocket Channel

This skill adds WebSocket channel support to NanoClaw, enabling custom mobile and web applications to connect and communicate with the AI assistant.

## Why WebSocket?

- **Bypass restrictions**: Works in regions where WhatsApp/Telegram are blocked
- **内网穿透 friendly**: Works with frp, cloudflare tunnel, etc.
- **Custom clients**: Build your own mobile app or web interface
- **Bidirectional file transfer**: Send and receive files between AI and client
- **Offline message queue**: Messages are queued when offline and delivered on reconnect

## Phase 1: Pre-flight

### Check if already applied

Read `.nanoclaw/state.yaml`. If `websocket` is in `applied_skills`, skip to Phase 3 (Setup). The code changes are already in place.

### Ask the user

Use `AskUserQuestion` to collect configuration:

AskUserQuestion: What port should the WebSocket server listen on?
- **9876 (default)** - Standard port
- **Custom port** - Enter a different port number

## Phase 2: Apply Code Changes

Run the skills engine to apply this skill's code package. The package files are in this directory alongside this SKILL.md.

### Initialize skills system (if needed)

If `.nanoclaw/` directory doesn't exist yet:

```bash
npx tsx scripts/apply-skill.ts --init
```

Or call `initSkillsSystem()` from `skills-engine/migrate.ts`.

### Apply the skill

```bash
npx tsx scripts/apply-skill.ts .claude/skills/add-websocket
```

This deterministically:
- Adds `src/channels/websocket.ts` (WebSocketChannel class implementing Channel interface)
- Adds WebSocket configuration to `src/config.ts` (WEBSOCKET_PORT, WEBSOCKET_PAIRING_CODE_LENGTH, WEBSOCKET_PAIRING_EXPIRY_MS)
- Adds Channel interface extension in `src/types.ts` (sendFile method, Attachment type)
- Adds IPC handler for `send_file` in `src/ipc.ts`
- Adds `routeOutboundFile` function in `src/router.ts`
- Three-way merges WebSocket support into `src/index.ts`
- Adds `examples/mobile-websocket/` with web, iOS, Android examples
- Adds `container/bin/send-file-to-client` script for AI to send files
- Adds `container/skills/send-file-to-client/` skill
- Records the application in `.nanoclaw/state.yaml`

If the apply reports merge conflicts, read the intent files:
- `modify/src/index.ts.intent.md` — what changed and invariants for index.ts
- `modify/src/config.ts.intent.md` — what changed for config.ts
- `modify/src/types.ts.intent.md` — what changed for types.ts
- `modify/src/ipc.ts.intent.md` — what changed for ipc.ts
- `modify/src/router.ts.intent.md` — what changed for router.ts

### Validate code changes

```bash
npm test
npm run build
```

All tests must pass and build must be clean before proceeding.

## Phase 3: Setup

### Configure port (if custom)

If the user chose a custom port, update `.env`:

```bash
WEBSOCKET_PORT=<custom-port>
```

### Build container

Rebuild the container to include the send-file-to-client script:

```bash
./container/build.sh
```

### Test the connection

1. Start NanoClaw: `npm run dev`
2. Open `examples/mobile-websocket/web/index.html` in a browser
3. Or use the test client: `node examples/mobile-websocket/test-client.js`
4. Request pairing and complete the pairing process

## Usage

### Web Client

Open `examples/mobile-websocket/web/index.html` in a web browser. The page will:
1. Generate a unique device ID
2. Request pairing with NanoClaw
3. Enter the pairing code shown in NanoClaw logs
4. Start chatting!

### Sending Files

AI can send files using the `/send-file-to-client` skill or the `send-file-to-client` command:

```bash
send-file-to-client --file document.pdf --target-device device-xxx
```

### Protocol

The WebSocket protocol supports:
- Pairing (pairing_request, pairing_verify)
- Messages (message)
- Ping/pong for keep-alive
- File transfer (file_start, file_chunk, file_end)
- Offline message queue (automatic)
