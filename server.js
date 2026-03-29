const express = require('express');
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 80;

// health
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'playwright-api',
    timestamp: new Date().toISOString()
  });
});

// run
app.post('/run', async (req, res) => {
  try {
    const { tipo, numero, nome } = req.body;

    // validação básica
    if (!tipo) {
      return res.status(400).json({
        success: false,
        message: 'Campo "tipo" é obrigatório'
      });
    }

    // EXEMPLO:
    // aqui entra sua lógica real do Playwright
    // const resultado = await executarAutomacao({ tipo, numero, nome });

    return res.json({
      success: true,
      message: 'Automação executada com sucesso',
      data: {
        tipo,
        numero: numero || null,
        nome: nome || null
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao executar automação',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Playwright API running on port ${PORT}`);
});
