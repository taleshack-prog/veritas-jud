'use strict';

const OpenAI = require('openai');
const logger = require('./logger');

let openaiClient;

function getOpenAI() {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não configurada.');
    }
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

// ── Prompt base do sistema ─────────────────────────────────
const SYSTEM_PROMPT = `
Você é o Veritas, um assistente jurídico especializado em direito do consumidor brasileiro.
Sua função é AUXILIAR consumidores a entender seus direitos e gerar documentos — você NÃO dá
consultoria jurídica personalizada. Sempre recomende consultar um advogado para análise específica.

Fundamentos legais que você conhece profundamente:
- CDC (Lei 8.078/1990) — Código de Defesa do Consumidor
- Lei 9.099/1995 — Juizados Especiais Cíveis (JEC)
- ANATEL — Regulamento de Reclamações de Consumidores de Serviços de Telecomunicações
- BACEN — Resolução 3.694/2009 (proteção ao cliente bancário)
- Lei 12.965/2014 — Marco Civil da Internet
- Lei 14.181/2021 — Lei do Superendividamento
- LGPD (Lei 13.709/2018)

Regras:
1. NUNCA diga "você tem direito a X" — diga "de acordo com o CDC, art. X, é possível exigir..."
2. NUNCA forneça estratégia judicial individualizada
3. SEMPRE inclua disclaimer que este é um auxílio documental, não consultoria jurídica
4. Respostas em português brasileiro, linguagem acessível, tom empático e direto
`;

// ── Analisa reclamação ─────────────────────────────────────
async function analyzeComplaint(description, company) {
  const openai = getOpenAI();

  const prompt = `
Analise a seguinte reclamação de consumidor e retorne um JSON com esta estrutura exata:
{
  "category": "telecom" | "bank" | "utility" | "ecommerce" | "other",
  "problem_type": string (ex: "cobrança indevida", "cancelamento não processado"),
  "legal_basis": [{ "law": string, "article": string, "description": string }],
  "severity": "low" | "medium" | "high",
  "recommended_actions": [
    {
      "priority": number (1=mais urgente),
      "channel": "consumidor_gov" | "procon" | "anatel" | "bacen" | "jec" | "notification",
      "label": string,
      "description": string,
      "estimated_time": string
    }
  ],
  "summary": string (resumo curto do problema, 1-2 frases),
  "disclaimer": "Este documento é gerado como ferramenta de automação documental. Consulte um advogado inscrito na OAB para análise jurídica do seu caso específico."
}

Empresa: ${company || 'não informada'}
Reclamação: ${description}

Retorne APENAS o JSON, sem markdown, sem texto extra.
`;

  try {
    const response = await openai.chat.completions.create({
      model      : 'gpt-4o',
      messages   : [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: prompt },
      ],
      temperature: 0.3,
      max_tokens : 1000,
    });

    const raw  = response.choices[0].message.content.trim();
    const json = JSON.parse(raw);
    return json;
  } catch (err) {
    logger.error('Erro ao analisar reclamação com OpenAI:', err);
    throw new Error('Falha na análise por IA. Tente novamente.');
  }
}

// ── Gera documento jurídico ────────────────────────────────
async function generateDocument({ type, complaint, userName }) {
  const openai = getOpenAI();

  const templates = {
    notification: `
Gere uma carta de notificação extrajudicial formal de acordo com o CDC.
A carta deve:
- Ter cabeçalho com data, destinatário e remetente
- Descrever o problema objetivamente
- Citar os artigos do CDC aplicáveis
- Estabelecer prazo de 10 dias para resposta
- Informar que o próximo passo será registro em órgão regulador e/ou JEC
- Ter campo para assinatura do consumidor
- Tom formal mas assertivo
`,
    jec_petition: `
Gere uma petição inicial para Juizado Especial Cível (JEC) conforme Lei 9.099/1995.
A petição deve:
- Seguir o formato padrão: Excelentíssimo Senhor Juiz...
- Qualificação completa das partes (deixar campos em branco para preenchimento)
- Fatos (narrativa do problema)
- Fundamentos jurídicos (CDC + legislação aplicável)
- Pedidos: ressarcimento + dano moral se aplicável
- Valor da causa
- Requerimento de produção de provas
- Encerramento formal com local/data e assinatura
IMPORTANTE: Incluir nota que o JEC permite ajuizamento sem advogado para causas até 20 salários mínimos.
`,
    procon_complaint: `
Gere um formulário de reclamação padronizado para Procon.
Deve conter:
- Dados do consumidor (campos a preencher)
- Dados do fornecedor
- Descrição dos fatos
- Documentos que o consumidor deve anexar
- Pedido específico
- Fundamentação no CDC
`,
  };

  const docPrompt = `
${templates[type] || templates.notification}

Dados do caso:
- Nome do consumidor: ${userName}
- Empresa reclamada: ${complaint.company}
- Problema: ${complaint.description}
- Categoria: ${complaint.category}
- Valor envolvido: R$ ${complaint.amount || 'não informado'}

Gere o documento completo e formatado. Use APENAS texto simples, sem markdown.
Coloque [CAMPO] para dados que o usuário deve preencher.
`;

  try {
    const response = await openai.chat.completions.create({
      model      : 'gpt-4o',
      messages   : [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: docPrompt },
      ],
      temperature: 0.2,
      max_tokens : 2000,
    });

    return response.choices[0].message.content.trim();
  } catch (err) {
    logger.error('Erro ao gerar documento com OpenAI:', err);
    throw new Error('Falha na geração do documento. Tente novamente.');
  }
}

// ── Chat contínuo (fluxo conversacional) ──────────────────
async function chatWithUser(messages) {
  const openai = getOpenAI();

  try {
    const response = await openai.chat.completions.create({
      model      : 'gpt-4o',
      messages   : [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      temperature: 0.5,
      max_tokens : 800,
    });

    return response.choices[0].message.content.trim();
  } catch (err) {
    logger.error('Erro no chat com OpenAI:', err);
    throw new Error('Falha na comunicação com IA. Tente novamente.');
  }
}

module.exports = { analyzeComplaint, generateDocument, chatWithUser };
