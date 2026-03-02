---
name: send-file-to-client
description: Send files to the WebSocket client (mobile/web app). Use this when you want to deliver a document or file to the user as a downloadable file instead of just showing its contents.
allowed-tools: Bash(send-file-to-client:*)
---

# Send File to Client

## When to Use

Use this skill when:
- You have created or modified a file (document, report, summary, etc.)
- The user asks for a file download
- You want to deliver a formatted document instead of plain text

## How It Works

The skill provides a `send-file-to-client` command that automatically sends a file to the WebSocket device that triggered this conversation. The target device is determined from `NANOCLAW_CHAT_JID` environment variable.

## Usage

```bash
# Simple usage - sends to the current conversation device
send-file-to-client /workspace/group/报告.md

# With custom display name
send-file-to-client /workspace/group/报告.md "分析报告.md"
```

## Example

After creating a report:

```bash
# Send the report to the user
send-file-to-client /workspace/group/军事深度解析.md
```

The user will see a download button in their WebSocket chat.

## Notes

- The file must exist and be readable
- Large files will be sent in chunks
- The user must be connected via WebSocket to receive the file
- Works with any file type: markdown, PDF, text, images, etc.
- The target device is automatically determined from the current conversation
