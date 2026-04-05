import express from 'express';
import { chromium } from 'playwright';
import fs from 'fs';

const app = express();
app.use(express.json());

const API_KEY = process.env.API_KEY || '';
const BASE_URL = 'https://dashboardcloud.net/';

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'playwright-api',
    timestamp: new Date().toISOString()
  });
});

function checkAuth(req, res) {
  const key = req.headers['x-api-key'];

  if (!API_KEY || key !== API_KEY) {
    res.status(401).json({
      success: false,
      message: 'API key inválida'
    });
    return false;
  }

  return true;
}

function getSessionPath() {
  if (fs.existsSync('/app/session.json')) return '/app/session.json';
  if (fs.existsSync('session.json')) return 'session.json';
  throw new Error('session.json não encontrado');
}

async function startBrowser() {
  const sessionPath = getSessionPath();

  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    storageState: sessionPath
  });

  const page = await context.newPage();

  return { browser, context, page };
}

async function ensureLoggedIn(page) {
  await page.goto(BASE_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await page.waitForTimeout(3000);

  const url = page.url();
  const body = await page.locator('body').innerText().catch(() => '');

  if (/login|entrar|senha|recaptcha/i.test(body) && /login|auth/i.test(url)) {
    throw new Error('Sessão expirada');
  }
}

app.post('/renovar', async (req, res) => {
  if (!checkAuth(req, res)) return;

  const { usuario } = req.body;
  const meses = Number(req.body?.meses || 1);

  if (!usuario) {
    return res.status(400).json({
      success: false,
      message: 'usuario obrigatório'
    });
  }

  let browser;
  let context;

  try {
    const started = await startBrowser();
    browser = started.browser;
    context = started.context;
    const page = started.page;

    await ensureLoggedIn(page);

    await page.goto('https://dashboardcloud.net/iptv/clients', {
      waitUntil: 'domcontentloaded'
    });

    await page.waitForTimeout(3000);

    const search = page.locator('input[type="search"]').first();

    if (await search.count()) {
      await search.fill(usuario);
      await page.waitForTimeout(2000);
    }

    const linha = page.locator(`tr:has-text("${usuario}")`).first();

    if (!(await linha.count())) {
      throw new Error('Cliente não encontrado');
    }

    const btn = linha.locator('button:has-text("Renovar"), a:has-text("Renovar")').first();

    if (!(await btn.count())) {
      throw new Error('Botão renovar não encontrado');
    }

    await btn.click();
    await page.waitForTimeout(1500);

    await page.waitForTimeout(1000);

    const confirmar = page.locator('button:has-text("Confirmar"), button:has-text("Salvar"), button:has-text("Renovar")').first();

    if (!(await confirmar.count())) {
      throw new Error('Botão confirmar não encontrado');
    }

    await confirmar.click();
    await page.waitForTimeout(3000);

    await context.close();
    await browser.close();

    return res.json({
      success: true,
      message: 'Cliente renovado',
      usuario,
      meses
    });
  } catch (error) {
    try {
      if (context) await context.close();
    } catch {}

    try {
      if (browser) await browser.close();
    } catch {}

    return res.status(500).json({
      success: false,
      message: 'Erro ao renovar',
      error: error.message
    });
  }
});

app.post('/run', async (req, res) => {
  return res.json({
    success: true,
    message: 'API funcionando'
  });
});

app.listen(3001, () => {
  console.log('Servidor rodando na porta 3001');
});
