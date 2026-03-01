#!/usr/bin/env node

/**
 * Simple Node.js WebSocket client for testing NanoClaw
 * Usage: node test-client.js [ws://localhost:9876]
 */

import WebSocket from 'ws';

const serverUrl = process.argv[2] || 'ws://localhost:9876';
const deviceId = `test-device-${Date.now()}`;

const ws = new WebSocket(serverUrl);

function send(obj) {
  ws.send(JSON.stringify(obj));
  console.log('→', JSON.stringify(obj));
}

function handleMessage(data) {
  const msg = JSON.parse(data);
  console.log('←', JSON.stringify(msg));

  switch (msg.type) {
    case 'pairing_challenge':
      console.log(`\n📱 PAIRING CODE: ${msg.pairingCode}\n`);
      console.log('Enter the pairing code above in NanoClaw logs, then run:');
      console.log(`  node test-client.js ${serverUrl} ${msg.pairingCode}\n`);
      break;

    case 'pairing_success':
      console.log('✅ Paired successfully!');
      console.log('Now you can send messages. Type and press Enter:\n');
      break;

    case 'pairing_failed':
      console.error('❌ Pairing failed:', msg.message);
      process.exit(1);
      break;

    case 'message':
      console.log(`\n🤖 Assistant: ${msg.content}\n`);
      break;

    case 'error':
      console.error('❌ Error:', msg.message);
      break;

    default:
      break;
  }
}

ws.on('open', () => {
  console.log(`Connected to ${serverUrl}`);
  console.log(`Device ID: ${deviceId}\n`);

  // Check if a pairing code was provided as argument
  const pairingCode = process.argv[3];
  if (pairingCode) {
    console.log('Verifying pairing...');
    send({
      type: 'pairing_verify',
      deviceId,
      pairingCode: pairingCode.toUpperCase(),
    });
  } else {
    console.log('Requesting pairing...');
    send({
      type: 'pairing_request',
      deviceId,
    });
  }
});

ws.on('message', handleMessage);

ws.on('close', () => {
  console.log('Disconnected');
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

// Interactive input
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

let isPaired = false;

ws.on('open', () => {
  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.type === 'pairing_success') {
      isPaired = true;
      promptInput();
    }
  });
});

function promptInput() {
  readline.question('You: ', (input) => {
    if (input.trim().toLowerCase() === 'exit') {
      ws.close();
      readline.close();
      return;
    }

    if (isPaired && input.trim()) {
      send({
        type: 'message',
        content: input,
      });
    }
    promptInput();
  });
}

// Handle stdin for immediate input
process.stdin.setEncoding('utf8');
