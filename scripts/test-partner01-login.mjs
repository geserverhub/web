const res = await fetch('http://127.0.0.1:3005/api/user/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'partner01',
    password: '898989',
    pageName: '/energy-dashboard',
  }),
});
console.log('status', res.status);
console.log('body', await res.text());
