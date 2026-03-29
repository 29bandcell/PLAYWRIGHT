const express = require('express');
const { chromium } = require('playwright');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Health checks
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Nova rota /run
app.post('/run', async (req, res) => {
  try {
    const { clientId, password, username, email, phone } = req.body;
    
    // Aqui voc? implementa a l?gica do Playwright
    console.log('Recebido:', { clientId, username, email, phone });
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('https://example.com');
    const title = await page.title();
    await browser.close();
    
    res.json({ 
      success: true, 
      message: 'Executado com sucesso',
      data: { title, received: { clientId, username, email, phone } }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota original de scrape
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
