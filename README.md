# 🏛️ VERITAS — Defesa do Consumidor com IA

> **App mobile + web (PWA) que automatiza reclamações e gera documentos jurídicos para consumidores brasileiros.**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org)
[![React Native](https://img.shields.io/badge/React%20Native-Expo%2052-blue)](https://expo.dev)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 🎯 O que é o Veritas?

O Veritas é uma plataforma de **automação documental** para defesa do consumidor brasileiro. Com IA especializada em CDC, ANATEL e direito bancário, o app:

- 🤖 **Analisa** reclamações em linguagem natural (texto)
- ⚖️ **Identifica** a fundamentação legal aplicável (CDC, ANATEL, BACEN)
- 📄 **Gera** documentos prontos: notificação extrajudicial, petição JEC, reclamação Procon
- 🏛️ **Orienta** sobre os melhores canais (Consumidor.gov.br, Procon, JEC)
- 👨‍⚖️ **Conecta** com advogados parceiros (marketplace) quando necessário

> **Disclaimer legal:** O Veritas é uma ferramenta de automação documental, não substitui consultoria jurídica. Consulte um advogado inscrito na OAB para análise individualizada.

---

## 🏗️ Arquitetura

```
veritas-jud/
├── backend/                    # API Node.js + Express
│   ├── src/
│   │   ├── server.js           # Entry point + middleware
│   │   ├── routes/
│   │   │   ├── auth.js         # Registro e login (JWT)
│   │   │   ├── complaints.js   # Reclamações + análise IA
│   │   │   ├── documents.js    # Geração de docs + PDF
│   │   │   ├── cases.js        # Dashboard de casos
│   │   │   └── marketplace.js  # Marketplace de advogados
│   │   ├── models/
│   │   │   └── database.js     # SQLite (better-sqlite3)
│   │   ├── services/
│   │   │   ├── openaiService.js # GPT-4o para análise jurídica
│   │   │   ├── rpaService.js   # Puppeteer (Consumidor.gov.br)
│   │   │   └── logger.js       # Winston logger
│   │   └── middleware/
│   │       └── auth.js         # JWT middleware
│   ├── database/               # veritas.db (gerado automaticamente)
│   ├── logs/                   # Logs (gerado automaticamente)
│   └── .env.example            # Template de variáveis de ambiente
│
├── frontend/                   # React Native (Expo)
│   ├── App.js                  # Navegação + AuthProvider
│   └── src/
│       ├── screens/
│       │   ├── LoginScreen.js
│       │   ├── RegisterScreen.js
│       │   ├── ChatScreen.js       # Chat principal com IA
│       │   ├── CasesScreen.js      # Lista de casos
│       │   ├── CaseDetailScreen.js # Detalhe + geração de docs
│       │   ├── DocumentsScreen.js  # Documentos gerados
│       │   ├── MarketplaceScreen.js # Advogados
│       │   └── ProfileScreen.js
│       ├── services/
│       │   └── api.js          # Axios + interceptors JWT
│       └── hooks/
│           └── useAuth.js      # AuthContext
```

---

## ⚙️ Stack Tecnológica

| Camada       | Tecnologia                          |
|--------------|-------------------------------------|
| Frontend     | React Native + Expo 52 (iOS/Android/Web PWA) |
| Backend      | Node.js 18+ + Express 4             |
| IA           | OpenAI GPT-4o                       |
| Banco        | SQLite via better-sqlite3           |
| Auth         | JWT (jsonwebtoken + bcryptjs)       |
| PDF          | pdf-lib                             |
| RPA          | Puppeteer-core (Consumidor.gov.br)  |
| Segurança    | helmet + express-rate-limit + cors  |
| Logs         | Winston + Morgan                    |

---

## 🚀 Instalação e Setup

### Pré-requisitos

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **npm** ou **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **Conta OpenAI** com chave de API — [platform.openai.com](https://platform.openai.com)

---

### 1. Clone o repositório

```bash
git clone https://github.com/taleshack-prog/veritas-jud.git
cd veritas-jud
```

### 2. Configure o Backend

```bash
cd backend
npm install

# Copie o template de variáveis de ambiente
cp .env.example .env
```

Edite `backend/.env` e preencha **obrigatoriamente**:

```env
JWT_SECRET=cole_aqui_um_secret_longo_e_aleatorio
OPENAI_API_KEY=sk-sua-chave-openai-aqui
```

Gere um JWT_SECRET seguro com:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Inicie o Backend

```bash
# Em backend/
npm run dev
# ➜ Rodando em http://localhost:3000
```

### 4. Configure o Frontend

```bash
cd ../frontend
npm install

# Crie o .env do frontend
echo "EXPO_PUBLIC_API_URL=http://localhost:3000/api" > .env
```

### 5. Inicie o Frontend

```bash
# Em frontend/
npm start

# Escolha:
# [a] Android emulator
# [i] iOS simulator
# [w] Navegador web (PWA)
```

---

## 📡 API — Endpoints

### Auth
| Método | Endpoint             | Descrição              |
|--------|----------------------|------------------------|
| POST   | `/api/auth/register` | Cadastro de usuário    |
| POST   | `/api/auth/login`    | Login → retorna JWT    |
| GET    | `/api/auth/me`       | Dados do usuário logado|

### Reclamações
| Método | Endpoint                        | Descrição                        |
|--------|---------------------------------|----------------------------------|
| POST   | `/api/complaints`               | Cria reclamação + análise IA     |
| GET    | `/api/complaints`               | Lista reclamações do usuário     |
| GET    | `/api/complaints/:id`           | Detalhe de uma reclamação        |
| PATCH  | `/api/complaints/:id/status`    | Atualiza status                  |
| POST   | `/api/complaints/chat`          | Chat contínuo com IA             |

### Documentos
| Método | Endpoint                      | Descrição                      |
|--------|-------------------------------|--------------------------------|
| POST   | `/api/documents/generate`     | Gera documento via IA          |
| GET    | `/api/documents`              | Lista documentos do usuário    |
| GET    | `/api/documents/:id`          | Conteúdo de um documento       |
| GET    | `/api/documents/:id/pdf`      | Baixa documento como PDF       |

### Casos
| Método | Endpoint        | Descrição                            |
|--------|-----------------|--------------------------------------|
| GET    | `/api/cases`    | Dashboard de casos + estatísticas    |
| GET    | `/api/cases/:id`| Caso completo com docs e submissões  |

### Marketplace
| Método | Endpoint                          | Descrição                |
|--------|-----------------------------------|--------------------------|
| GET    | `/api/marketplace/lawyers`        | Lista advogados          |
| POST   | `/api/marketplace/register-lawyer`| Cadastra advogado        |
| POST   | `/api/marketplace/leads`          | Envia lead               |

---

## 🔐 Segurança

- Autenticação **JWT** em todas as rotas privadas
- **bcrypt** com 12 rounds para senhas
- **helmet** — headers de segurança HTTP
- **rate-limit** — 100 req/15min por IP
- **CORS** configurado por allowlist
- **WAL mode** no SQLite — proteção contra corrupção
- **Validação de input** com express-validator em todas as rotas
- `.env` nunca no git (`.gitignore` configurado)

---

## ⚖️ Posicionamento Legal

O Veritas opera como **ferramenta de automação documental**, amparado por:

- **REsp 1.793.767/SP (STJ, 2020)**: automação documental sem análise jurídica individualizada não configura exercício ilegal da advocacia
- **Provimento 205/2021 (CFOAB)**: admite captação via plataformas digitais com advogado responsável
- **Art. 36, Lei 9.099/95**: JEC permite ajuizamento pessoal sem advogado até 20 salários mínimos

**O app nunca diz "você tem direito a X"** — sempre referencia a lei e orienta o usuário a verificar com um advogado.

---

## 🗺️ Roadmap

- [x] MVP: chat IA + geração de docs + marketplace
- [ ] RPA completo para Consumidor.gov.br (requer sessão Gov.br do usuário)
- [ ] OCR de faturas com Vision API
- [ ] Notificações push (status de casos)
- [ ] Assinatura digital de petições (estrutura Veritas Advocacia)
- [ ] Integração ANATEL via API SACI
- [ ] Testes automatizados (Jest + Supertest + Detox)
- [ ] CI/CD com GitHub Actions
- [ ] Docker para deploy

---

## 📝 Licença

MIT — veja [LICENSE](LICENSE) para detalhes.

---

**Desenvolvido com ⚖️ para defender consumidores brasileiros.**
