import mysql from 'mysql2/promise';

const attempts = [
  { label: 'geserverhub (env)', user: 'geserverhub', password: '2350400018644' },
  { label: 'root empty', user: 'root', password: '' },
  { label: 'root same pwd', user: 'root', password: '2350400018644' },
];

for (const a of attempts) {
  try {
    const c = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: a.user,
      password: a.password,
    });
    await c.ping();
    console.log('OK', a.label);
    await c.end();
  } catch (e) {
    console.log('FAIL', a.label, e.code || e.message);
  }
}
