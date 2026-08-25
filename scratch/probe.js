import http from 'http';

const req = http.get('http://localhost:5173', (res) => {
  console.log('STATUS:', res.statusCode);
  process.exit(0);
});

req.on('error', (e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
