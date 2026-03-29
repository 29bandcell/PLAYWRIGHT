const express = require('express');
const { chromium } = require('playwright');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rota /run para automação
app.post('/run', async (req, res) => {
  try {
    console.log('Requisição recebida em /run:', req.body);
    
    const { clientId, password, username, email, phone } = req.body;
    
    // Inicia o navegador
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Exemplo: navegar para um site
    await page.goto('https://example.com');
    const title = await page.title();
    
    await browser.close();
    
    res.json({ 
      success: true, 
      message: 'Executado com sucesso',
      title: title,
      received: { clientId, username, email, phone }
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota original
app.post('/api/scrape', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url);
    const title = await page.title();
    await browser.close();
    res.json({ title, url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Playwright API running on port ${PORT}`);
});