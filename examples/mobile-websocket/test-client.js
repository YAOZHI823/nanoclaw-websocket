#!/usr/bin/env node

/**
 * Simple Node.js WebSocket client for testing NanoClaw
 * Usage:
 *   node test-client.js                    # Interactive mode
 *   node test-client.js PAIRING_CODE       # Auto-verify with code
 *   node test-client.js ws://url CODE     # Custom URL + code
 */

import WebSocket from 'ws';
import readline from 'readline';

// Usage parsing
const serverUrl = process.argv[2]?.startsWith('ws://') ? process.argv[2] : 'ws://localhost:9876';
const pairingCode = process.argv[2]?.startsWith('ws://') ? process.argv[3] : process.argv[2];

// Device ID - always generate new one to avoid stale sessions
const deviceId = `test-device-${Date.now()}`;
console.log(`Device ID: ${deviceId}`);

const ws = new WebSocket(serverUrl);

// UseYNC mode for readline to prevent multiple simultaneous prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});

let waitingForInput = false;

function send(obj) {
  ws.send(JSON.stringify(obj));
  console.log('→', JSON.stringify(obj));
}

function promptForInput() {
  // Prevent multiple simultaneous prompts
  if (waitingForInput) return;
  waitingForInput = true;

  rl.question('You: ', (input) => {
    waitingForInput = false;

    if (input.trim().toLowerCase() === 'exit') {
      console.log('Goodbye!');
      ws.close();
      rl.close();
      process.exit(0);
    }

    if (input.trim()) {
      send({ type: 'message', content: input });
    } else {
      // Empty input, prompt again
      promptForInput();
    }
  });
}

function handleMessage(data) {
  const msg = JSON.parse(data);
  console.log('←', JSON.stringify(msg));

  switch (msg.type) {
    case 'pairing_challenge':
      console.log(`\n📱 PAIRING CODE: ${msg.pairingCode}\n`);
      console.log('Enter the pairing code above (or press Enter to exit):');

      rl.question('> ', (code) => {
        if (code && code.trim()) {
          console.log('Verifying pairing...');
          send({
            type: 'pairing_verify',
            deviceId,
            pairingCode: code.trim().toUpperCase(),
          });
        } else {
          ws.close();
          process.exit(0);
        }
      });
      break;

    case 'pairing_success':
      console.log('\n✅ Paired successfully' + (msg.message ? ` (${msg.message})` : '') + '!\n');
      console.log('Now you can send messages. Type and press Enter:\n');
      promptForInput();
      break;

    case 'pairing_failed':
      console.error('\n❌ Pairing failed:', msg.message);
      ws.close();
      process.exit(1);
      break;

    case 'message':
      console.log(`\n🤖 Assistant: ${msg.content}\n`);
      promptForInput();
      break;

    case 'error':
      console.error('❌ Error:', msg.message);
      promptForInput();
      break;

    case 'pong':
      // Heartbeat response, ignore
      break;

    default:
      break;
  }
}

ws.on('open', () => {
  console.log(`Connected to ${serverUrl}\n`);

  if (pairingCode && pairingCode.length === 6) {
    console.log('Verifying pairing with code:', pairingCode);
    send({
      type: 'pairing_verify',
      deviceId,
      pairingCode: pairingCode.toUpperCase(),
    });
  } else {
    console.log('Requesting pairing...\n');
    send({
      type: 'pairing_request',
      deviceId,
    });
  }
});

ws.on('message', handleMessage);

ws.on('close', () => {
  console.log('\nDisconnected');
  try {
    rl.close();
  } catch {}
  process.exit(0);
});

ws.on('error', (err) => {
  console.error('Error:', err.message);
  process.exit(1);
});

// Send ping every 30 seconds to keep connection alive
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    send({ type: 'ping' });
  }
}, 30000);
