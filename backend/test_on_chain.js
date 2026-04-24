import fetch from 'node-fetch';
import { createHmac } from 'crypto';

const API = 'http://localhost:3001';

async function req(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  const data = await res.json();
  return { status: res.status, data };
}

async function test() {
  console.log('=== Testing On-Chain with Retry ===\n');

  // 1. Create user
  console.log('1. Creating user...');
  const createRes = await req('POST', '/api/auth/register', {
    email: `test-${Date.now()}@example.com`,
    password: 'test123'
  });
  console.log('Status:', createRes.status);
  console.log('Response:', JSON.stringify(createRes.data, null, 2).substring(0, 300));

  if (!createRes.data.uid) {
    console.error('Failed to create user');
    process.exit(1);
  }

  const uid = createRes.data.uid;
  const apiKey = createRes.data.apiKey;
  console.log(`✓ User created: ${uid}`);
  console.log(`✓ API Key: ${apiKey}\n`);

  // 2. Check user balance
  console.log('2. Checking user wallet balance...');
  const authRes = await req('GET', '/api/auth/me', null);
  authRes.data.token = apiKey; // will use this for auth
  console.log('User wallet:', JSON.stringify(authRes.data, null, 2).substring(0, 500));

  // 3. Create a task
  console.log('\n3. Creating task...');
  const headers = { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };
  
  const taskRes = await fetch(`${API}/api/tasks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      input: 'Summarize the benefits of on-chain settlement',
      taskType: 'summarize',
      selectionStrategy: 'balanced'
    })
  });
  
  const taskData = await taskRes.json();
  console.log('Task status:', taskRes.status);
  console.log('Task response:', JSON.stringify(taskData, null, 2).substring(0, 1000));

  if (taskData.status === 'funding_retry_pending') {
    console.log('\n⚠ Task is in FUNDING_RETRY_PENDING state');
    console.log('This means the RPC was busy (txpool full)');
    console.log('Retry info:', taskData.retryInfo);
  } else if (taskData.status === 'completed') {
    console.log('\n✓ Task completed successfully!');
  } else if (taskData.status === 'failed') {
    console.log('\n✗ Task failed');
    console.log('Error:', taskData.error);
  }
}

test().catch(console.error);
