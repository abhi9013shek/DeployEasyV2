import crypto from 'crypto';

async function testWebhook() {
  const secret = 'whsec_test_secret_demo';
  const payload = {
    ref: 'refs/heads/main',
    before: '0000000000000000000000000000000000000000',
    after: 'e92f1b8a4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f',
    repository: {
      id: 123456789,
      name: 'test1',
      full_name: 'abhi9013shek/test1',
      owner: {
        login: 'abhi9013shek',
      },
      clone_url: 'https://github.com/abhi9013shek/test1.git',
    },
    head_commit: {
      id: 'e92f1b8a4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f',
      message: 'feat: Phase 4 webhook automated trigger demo commit',
    },
  };

  const rawBody = JSON.stringify(payload);
  const signature = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const deliveryId = 'deliv_demo_' + Date.now();

  console.log('Sending mock GitHub push webhook event to http://localhost:3001/api/webhooks/github ...');

  const res = await fetch('http://localhost:3001/api/webhooks/github', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-GitHub-Event': 'push',
      'X-GitHub-Delivery': deliveryId,
      'X-Hub-Signature-256': signature,
    },
    body: rawBody,
  });

  const json = await res.json();
  console.log('Webhook Response:', res.status, json);
}

testWebhook().catch(console.error);
