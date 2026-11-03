# 💎 FinControl • Gestão Financeira Pessoal com IA

Sistema moderno, robusto e visual de alta precisão para controle financeiro pessoal, gestão de investimentos, monitoramento de prejuízos e automação inteligente de extratos e faturas de cartão com IA.

Desenvolvido especialmente para hospedagem no **Vercel** e versionamento no **GitHub**.

---

## 🚀 Principais Funcionalidades

### 1. 📊 Central Visual & Dashboard Executivo
- **Visão 360° em Tempo Real**: Saldo total em contas, receitas mensais, despesas correntes, aportes em investimentos, prejuízos/perdas e taxa líquida de poupança.
- **Gráfico de Fluxo de Caixa**: Comparativo visual interativo (Receitas vs Despesas vs Investimentos vs Prejuízos) ao longo dos meses.
- **Distribuição por Categoria**: Gráfico donut interativo com percentuais de gastos por categoria.
- **Vencimentos & Contas Pendentes**: Alertas inteligentes com botão rápido "Marcar como Pago" direto no dashboard.

### 2. 🤖 Importação de Extratos & Faturas com IA de Fundo
- **Suporte Multiformato**: Aceita **PDF** (faturas e extratos de bancos como Nubank, Itaú, Bradesco, Inter, C6, Santander), arquivos **CSV**, **OFX** bancários e **imagens/comprovantes**.
- **Colar Texto Direto**: Permite copiar o extrato no app do banco e colar diretamente.
- **Motor Dual de Inteligência**:
  - Integração nativa com **Google Gemini AI** (leitura multimodal de PDFs e fotos de recibos com categorização automática contextual).
  - **Motor NLP Heurístico de Fallback**: Caso não tenha configurado chave de API, o sistema conta com mais de 80 regras inteligentes pré-programadas para o ecossistema bancário brasileiro (Pix, boletos, IOF, Uber, iFood, supermercados, etc.).
- **Tela de Revisão Pré-Lançamento**: Visualize todas as transações extraídas, ajuste categorias ou tipos caso deseje e confirme em lote com 1 clique.

### 3. 📈 Gestão Dedicada de Investimentos & Prejuízos
- **Aportes e Patrimônio**: Alocação por classe de ativos (Renda Fixa / Tesouro / CDB, Ações & FIIs, Criptomoedas, Reserva de Emergência).
- **Controle de Prejuízos & Sangrias**: Aba exclusiva para monitorar perdas operacionais em trades, juros/multas por atraso, taxas abusivas e despesas emergenciais imprevistas, calculando a eficiência de retenção de capital.

### 4. 💳 Gestão de Bancos & Cartões de Crédito
- Monitoramento de limite total, limite consumido e limite disponível com barras visuais.
- Datas de fechamento e vencimento de fatura.
- Gestão de contas correntes, contas de investimento e carteira física.

### 5. 🎯 Tetos Orçamentários & Metas por Categoria
- Definição de limite de gastos mensais por categoria.
- Indicador visual dinâmico (Verde <75%, Amarelo 75-99%, Vermelho >100% com alerta de teto estourado).

### 6. 🔒 Portabilidade & Segurança Total
- Seus dados ficam armazenados com persistência no navegador.
- **Exportação de Backup**: Baixe um arquivo JSON com todas as suas informações em 1 clique.
- **Restauração de Backup**: Importe seu backup em qualquer computador ou dispositivo.

---

## 🛠️ Tecnologias Utilizadas

- **Framework**: [Next.js](https://nextjs.org/) (App Router & Turbopack)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/)
- **Componentes & Ícones**: [Lucide React](https://lucide.dev/)
- **Visualização de Dados**: [Recharts](https://recharts.org/)
- **Processamento de IA**: Google GenAI SDK (`gemini-2.5-flash`) + Parsers OFX/CSV locais
- **Hospedagem Recomendada**: [Vercel](https://vercel.com/)

---

## 💻 Como Rodar Localmente

1. Entre na pasta do projeto:
   ```bash
   cd fincontrol
   ```

2. Instale as dependências (já instaladas):
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Acesse no navegador:
   `http://localhost:3000`

---

## ☁️ Como Subir no GitHub e Hospedar na Vercel

### Passo 1: Subir no GitHub

1. Crie um novo repositório vazio no seu [GitHub](https://github.com/new) chamado `fincontrol` (ou o nome que preferir).
2. No terminal, dentro da pasta `fincontrol`, execute:
   ```bash
   git init
   git add .
   git commit -m "feat: FinControl - Sistema Financeiro Inteligente com IA"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/fincontrol.git
   git push -u origin main
   ```

### Passo 2: Hospedar na Vercel

1. Acesse [vercel.com](https://vercel.com) e conecte sua conta do GitHub.
2. Clique em **"Add New..."** > **"Project"**.
3. Selecione o repositório `fincontrol`.
4. (Opcional) Em **Environment Variables**, adicione:
   - `GEMINI_API_KEY`: sua chave gratuita do Google AI Studio (ou você pode adicioná-la direto na aba de Configurações do site depois).
5. Clique em **"Deploy"**.
6. Em menos de 1 minuto, seu site estará no ar com link seguro HTTPS (ex: `fincontrol.vercel.app`)!
