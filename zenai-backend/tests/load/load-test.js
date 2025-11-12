// tests/load/load-test.js
const autocannon = require('autocannon');

async function runLoadTest() {
  const result = await autocannon({
    url: 'http://localhost:5000',
    connections: 100,
    duration: 30,
    pipelining: 10,
    requests: [
      {
        method: 'POST',
        path: '/api/v1/auth/login',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      },
      {
        method: 'GET',
        path: '/api/v1/projects',
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN'
        }
      }
    ]
  });

  console.log('Load Test Results:');
  console.log(`Requests: ${result.requests.total}`);
  console.log(`Throughput: ${result.throughput.average} req/sec`);
  console.log(`Latency: ${result.latency.mean}ms`);
  console.log(`Errors: ${result.errors}`);
}

runLoadTest();