#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────
# VERITAS — setup.sh
# Configura o ambiente de desenvolvimento completo
# Uso: bash setup.sh
# ────────────────────────────────────────────────────────────────

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════╗"
echo "║  🏛️  VERITAS — Setup do Ambiente          ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# ── Verifica Node.js ──────────────────────────────────────
NODE_VER=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [ -z "$NODE_VER" ] || [ "$NODE_VER" -lt 18 ]; then
  echo -e "${RED}❌ Node.js 18+ é obrigatório. Instale em https://nodejs.org${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v) detectado${NC}"

# ── Backend ───────────────────────────────────────────────
echo -e "\n${YELLOW}📦 Instalando dependências do backend...${NC}"
cd backend
npm install --ignore-scripts

# Configura .env se não existir
if [ ! -f .env ]; then
  cp .env.example .env
  # Gera JWT_SECRET aleatório
  SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/TROQUE_POR_UM_SECRET_FORTE_E_ALEATORIO/$SECRET/" .env
  else
    sed -i "s/TROQUE_POR_UM_SECRET_FORTE_E_ALEATORIO/$SECRET/" .env
  fi
  echo -e "${GREEN}✅ backend/.env criado com JWT_SECRET aleatório${NC}"
  echo -e "${YELLOW}⚠️  OBRIGATÓRIO: edite backend/.env e adicione sua OPENAI_API_KEY${NC}"
else
  echo -e "${GREEN}✅ backend/.env já existe${NC}"
fi

cd ..

# ── Frontend ──────────────────────────────────────────────
echo -e "\n${YELLOW}📦 Instalando dependências do frontend...${NC}"
cd frontend

if [ ! -f .env ]; then
  echo "EXPO_PUBLIC_API_URL=http://localhost:3000/api" > .env
  echo -e "${GREEN}✅ frontend/.env criado${NC}"
fi

# Verifica se expo-cli está instalado
if ! command -v expo &> /dev/null; then
  echo -e "${YELLOW}⚠️  Expo CLI não encontrado. Instalando...${NC}"
  npm install -g expo-cli
fi

npm install --ignore-scripts
cd ..

# ── Instruções finais ─────────────────────────────────────
echo -e "\n${GREEN}"
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ Setup concluído!                                  ║"
echo "╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "📋 ${YELLOW}Próximos passos:${NC}"
echo ""
echo "  1. Adicione sua OpenAI API key:"
echo "     ${BLUE}nano backend/.env${NC}  →  OPENAI_API_KEY=sk-sua-chave"
echo ""
echo "  2. Inicie o backend (terminal 1):"
echo "     ${BLUE}cd backend && npm run dev${NC}"
echo ""
echo "  3. Inicie o frontend (terminal 2):"
echo "     ${BLUE}cd frontend && npm start${NC}"
echo "     Escolha [w] para web, [a] Android, [i] iOS"
echo ""
echo "  4. Health check:"
echo "     ${BLUE}curl http://localhost:3000/health${NC}"
echo ""
echo -e "${YELLOW}📚 Documentação completa: README.md${NC}"
