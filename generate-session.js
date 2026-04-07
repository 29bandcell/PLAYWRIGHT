import { chromium } from 'playwright';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const LOGIN_URL = process.env.LOGIN_URL;

if (!LOGIN_URL) {
  console.error('Falta LOGIN_URL no .env');
  process.exit(1);
}

function waitForEnter(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(message, () => {
      rl.close();
      resolve();
    });
  });
}

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 200
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Abrindo página de login...');
    await page.goto(LOGIN_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    console.log('\n=== LOGIN ASSISTIDO ===');
    console.log('1) Faça o login manualmente no navegador');
    console.log('2) Resolva o CAPTCHA manualmente');
    console.log('3) Espere entrar na área logada');
    console.log('4) Volte aqui no terminal e pressione ENTER\n');

    await waitForEnter('Quando estiver logado, pressione ENTER para continuar... ');

    console.log('Verificando se o login realmente concluiu...');

    // Espera a navegação estabilizar
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    const title = await page.title();

    console.log(`URL atual: ${currentUrl}`);
    console.log(`Título atual: ${title}`);

    // Heurísticas simples para detectar se ainda está na tela de login
    const pageText = await page.locator('body').innerText().catch(() => '');
    const stillOnLogin =
      /login|entrar|sign in|não sou robô|recaptcha|senha/i.test(pageText) &&
      /login|entrar|sign in/i.test(currentUrl);

    if (stillOnLogin) {
      console.error('❌ Parece que você ainda está na tela de login. Sessão não foi salva.');
      await browser.close();
      process.exit(1);
    }

    console.log('Confirmando presença de cookies/sessão...');
    const cookies = await context.cookies();

    if (!cookies || cookies.length === 0) {
      console.error('❌ Nenhum cookie encontrado. Sessão não foi salva.');
      await browser.close();
      process.exit(1);
    }

    await context.storageState({ path: 'session.json' });

    console.log('✅ session.json gerado com sucesso!');
    console.log(`✅ Total de cookies salvos: ${cookies.length}`);
  } catch (error) {
    console.error('❌ Erro ao gerar session.json:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
