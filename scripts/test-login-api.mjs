const res = await fetch('http://localhost:3005/api/user/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'goeun', password: '23504000' }),
});
const text = await res.text();
console.log('status', res.status);
console.log('body', text);
