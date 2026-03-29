const express = require('express');

const app = express();
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
  res.send('Playwright API rodando');
});

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, service: 'playwright-api' });
});

app.post('/run', async (req, res) => {
  return res.status(200).json({
    ok: true,
    status: 'ok',
    recebido: req.body
  });
});

const PORT = Number(process.env.PORT || 3001);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('Playwright API running on port ' + PORT);
});

process.on('SIGTERM', () => {
  console.log('Recebido SIGTERM, encerrando com segurança...');
  server.close(() => process.exit(0));
});