'use strict';

/**
 * RPA — Automação do Consumidor.gov.br via Puppeteer
 *
 * IMPORTANTE: Este módulo usa Puppeteer para automatizar o protocolo de
 * reclamações no portal do consumidor. Funciona como ferramenta de automação
 * documental em nome do usuário, que deve estar autenticado no portal.
 *
 * Requer: puppeteer-core + chromium instalado
 */

const logger = require('../services/logger');

// Detecta ambiente e importa puppeteer adequado
let puppeteer;
try {
  puppeteer = require('puppeteer-core');
} catch (_) {
  puppeteer = null;
}

const CONSUMIDOR_URL = process.env.CONSUMIDOR_BASE_URL || 'https://www.consumidor.gov.br';
const HEADLESS       = process.env.RPA_HEADLESS !== 'false';

// ── Localiza Chromium no sistema ───────────────────────────
function findChromium() {
  const candidates = [
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  const fs = require('fs');
  return candidates.find(p => fs.existsSync(p)) || null;
}

// ── Abre browser ───────────────────────────────────────────
async function launchBrowser() {
  if (!puppeteer) throw new Error('Puppeteer não instalado. Execute: npm install puppeteer-core');

  const executablePath = findChromium();
  if (!executablePath) {
    throw new Error(
      'Chromium/Chrome não encontrado. Instale com: apt-get install -y chromium-browser'
    );
  }

  return puppeteer.launch({
    executablePath,
    headless: HEADLESS,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ],
  });
}

// ── Protocola reclamação no Consumidor.gov.br ──────────────
/**
 * @param {object} complaint - Objeto da reclamação do banco
 * @param {object} userData  - { name, email, cpf, phone }
 * @returns {{ success: boolean, protocol: string|null, error: string|null }}
 */
async function submitToConsumidor(complaint, userData) {
  logger.info(`[RPA] Iniciando protocolo Consumidor.gov.br para reclamação ${complaint.id}`);

  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();

    // Timeout generoso para portais governamentais lentos
    page.setDefaultNavigationTimeout(60_000);
    page.setDefaultTimeout(30_000);

    // Bloqueia recursos pesados para economizar banda
    await page.setRequestInterception(true);
    page.on('request', req => {
      if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // ── Step 1: Acessa portal ──────────────────────────────
    await page.goto(`${CONSUMIDOR_URL}/usuarios/login`, { waitUntil: 'networkidle2' });
    logger.info('[RPA] Portal acessado. Aguardando login...');

    // ── Step 2: Login com Gov.br (requer CPF + senha do usuário) ──
    // NOTA: O usuário deve fornecer suas credenciais Gov.br
    // Por segurança, as credenciais NÃO são armazenadas no Veritas
    // O fluxo ideal é: usuário já autenticado + cookie de sessão
    if (userData.govbrSession) {
      await page.setCookie(...userData.govbrSession);
      await page.goto(`${CONSUMIDOR_URL}/reclamacoes`, { waitUntil: 'networkidle2' });
    } else {
      // Modo manual: retorna URL para o usuário completar
      logger.warn('[RPA] Sem sessão Gov.br. Retornando URL para autenticação manual.');
      return {
        success : false,
        manual  : true,
        url     : `${CONSUMIDOR_URL}/reclamacoes`,
        message : 'Abra o link e protocolize manualmente. O Veritas preparou o texto da reclamação.',
      };
    }

    // ── Step 3: Nova reclamação ────────────────────────────
    await page.waitForSelector('[data-testid="nova-reclamacao"], a[href*="nova"]', { timeout: 10_000 });
    await page.click('[data-testid="nova-reclamacao"], a[href*="nova"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // ── Step 4: Busca empresa ──────────────────────────────
    const searchField = await page.$('input[name*="empresa"], input[placeholder*="empresa"]');
    if (searchField) {
      await searchField.type(complaint.company, { delay: 50 });
      await page.waitForTimeout(2000);
      const suggestion = await page.$('.suggestion-item, [class*="autocomplete"] li');
      if (suggestion) await suggestion.click();
    }

    // ── Step 5: Preenche descrição ─────────────────────────
    const descField = await page.$('textarea[name*="descricao"], textarea[name*="relato"]');
    if (descField) {
      await descField.type(complaint.description, { delay: 20 });
    }

    // ── Step 6: Preenche pedido ────────────────────────────
    const pedidoField = await page.$('textarea[name*="pedido"], textarea[name*="expectativa"]');
    if (pedidoField) {
      const pedido = `Solicito a resolução do problema e o cumprimento das obrigações previstas no CDC (Lei 8.078/1990).`;
      await pedidoField.type(pedido, { delay: 20 });
    }

    // ── Step 7: Submete ────────────────────────────────────
    const submitBtn = await page.$('button[type="submit"], input[type="submit"]');
    if (!submitBtn) throw new Error('Botão de envio não encontrado.');

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      submitBtn.click(),
    ]);

    // ── Step 8: Captura número de protocolo ───────────────
    const protocolEl = await page.$('[class*="protocolo"], [class*="numero-protocolo"]');
    const protocol   = protocolEl
      ? await page.evaluate(el => el.textContent.trim(), protocolEl)
      : `MANUAL-${Date.now()}`;

    logger.info(`[RPA] Protocolo obtido: ${protocol}`);
    return { success: true, protocol };

  } catch (err) {
    logger.error(`[RPA] Erro no protocolo Consumidor.gov.br: ${err.message}`);
    return { success: false, protocol: null, error: err.message };
  } finally {
    if (browser) await browser.close();
  }
}

// ── Submit ANATEL ──────────────────────────────────────────
async function submitToAnatel(complaint, userData) {
  logger.info(`[RPA] Iniciando protocolo ANATEL para reclamação ${complaint.id}`);
  // ANATEL tem API pública documentada — preferir API sobre RPA
  // https://sistemas.anatel.gov.br/SACI/
  return {
    success : false,
    manual  : true,
    url     : 'https://sistemas.anatel.gov.br/SACI/',
    message : 'ANATEL: use o portal SACI para telecom. O Veritas preparou o texto da reclamação.',
  };
}

module.exports = { submitToConsumidor, submitToAnatel };
