import Papa from 'papaparse';
import { AiParsedTransaction, TransactionType } from '@/types/finance';
import { DEFAULT_CATEGORIES, KEYWORD_CATEGORY_RULES } from './constants';
import { generateId } from './utils';

const PORTUGUESE_MONTHS: Record<string, string> = {
  jan: '01', fev: '02', mar: '03', abr: '04', mai: '05', jun: '06',
  jul: '07', ago: '08', set: '09', out: '10', nov: '11', dez: '12',
};

/**
 * Normaliza e busca a melhor categoria baseada na descrição (NLP Heurístico Local)
 */
export function guessCategoryAndType(description: string, rawAmount: number): { categoryId: string; categoryName: string; type: TransactionType; confidence: number } {
  const normalized = description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Tratar estornos
  if (normalized.includes('estorno')) {
    return {
      categoryId: 'cat_outras_receitas',
      categoryName: 'Outros Recebimentos',
      type: 'income',
      confidence: 0.95,
    };
  }

  // Tratar inclusão de pagamento de fatura
  if (normalized.includes('inclusao de pagamento') || normalized.includes('pagamento efetuado') || normalized.includes('pgto fatura')) {
    return {
      categoryId: 'cat_contas',
      categoryName: 'Contas Fixas (Luz, Net, Água)',
      type: 'expense',
      confidence: 0.90,
    };
  }

  for (const rule of KEYWORD_CATEGORY_RULES) {
    for (const keyword of rule.keywords) {
      if (normalized.includes(keyword)) {
        const cat = DEFAULT_CATEGORIES.find(c => c.id === rule.categoryId);
        return {
          categoryId: rule.categoryId,
          categoryName: cat ? cat.name : 'Outras Despesas',
          type: rule.type,
          confidence: 0.92,
        };
      }
    }
  }

  // Heurística de tipo baseada no sinal do valor ou termos de recebimento
  if (rawAmount > 0 && (normalized.includes('receb') || normalized.includes('pix receb') || normalized.includes('deposito') || normalized.includes('ted rec') || normalized.includes('salario'))) {
    return {
      categoryId: 'cat_outras_receitas',
      categoryName: 'Outros Recebimentos',
      type: 'income',
      confidence: 0.85,
    };
  }

  // Padrão geral
  return {
    categoryId: 'cat_outros_gastos',
    categoryName: 'Outras Despesas',
    type: 'expense',
    confidence: 0.60,
  };
}

/**
 * Parser de arquivos OFX (Extratos bancários de qualquer banco brasileiro)
 */
export function parseOfx(ofxContent: string): AiParsedTransaction[] {
  const transactions: AiParsedTransaction[] = [];
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;

  while ((match = stmtTrnRegex.exec(ofxContent)) !== null) {
    const block = match[1];

    const trnTypeMatch = /<TRNTYPE>([^\r\n<]+)/i.exec(block);
    const dtPostedMatch = /<DTPOSTED>([0-9]{8})/i.exec(block);
    const trnAmtMatch = /<TRNAMT>([^\r\n<]+)/i.exec(block);
    const memoMatch = /<MEMO>([^\r\n<]+)/i.exec(block);

    if (dtPostedMatch && trnAmtMatch) {
      const rawDate = dtPostedMatch[1];
      const year = rawDate.substring(0, 4);
      const month = rawDate.substring(4, 6);
      const day = rawDate.substring(6, 8);
      const formattedDate = `${year}-${month}-${day}`;

      const rawAmount = parseFloat(trnAmtMatch[1].replace(',', '.'));
      const absAmount = Math.abs(rawAmount);
      const description = memoMatch ? memoMatch[1].trim() : 'Transação Bancária';

      const guess = guessCategoryAndType(description, rawAmount);
      const finalType = rawAmount > 0 ? (guess.type === 'expense' ? 'income' : guess.type) : guess.type;

      transactions.push({
        id: generateId(),
        date: formattedDate,
        description,
        amount: absAmount,
        type: finalType,
        categoryId: guess.categoryId,
        categoryName: guess.categoryName,
        confidence: guess.confidence,
        selected: true,
      });
    }
  }

  return transactions;
}

/**
 * Parser de arquivos CSV (Nubank, Inter, Itaú, etc)
 */
export function parseCsv(csvContent: string): AiParsedTransaction[] {
  const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
  const results: AiParsedTransaction[] = [];

  const data = parsed.data as Record<string, string>[];
  if (!data || data.length === 0) return [];

  for (const row of data) {
    const dateKey = Object.keys(row).find(k => /data|date/i.test(k));
    const descKey = Object.keys(row).find(k => /descri|titulo|title|memo|estabelecimento/i.test(k));
    const amountKey = Object.keys(row).find(k => /valor|amount|val/i.test(k));

    if (!dateKey || !amountKey) continue;

    const rawDate = row[dateKey]?.trim();
    const rawDesc = descKey ? row[descKey]?.trim() : 'Compra / Lançamento';
    const rawAmountStr = row[amountKey]?.toString().replace('R$', '').replace(/\s/g, '').replace('.', '').replace(',', '.');
    const rawAmount = parseFloat(rawAmountStr || '0');

    if (isNaN(rawAmount) || rawAmount === 0) continue;

    let formattedDate = new Date().toISOString().split('T')[0];
    if (rawDate) {
      if (rawDate.includes('/')) {
        const parts = rawDate.split('/');
        if (parts.length === 3) {
          const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          formattedDate = `${y}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      } else if (rawDate.includes('-')) {
        formattedDate = rawDate;
      }
    }

    const absAmount = Math.abs(rawAmount);
    const guess = guessCategoryAndType(rawDesc, rawAmount);
    const finalType = rawAmount > 0 && !descKey?.toLowerCase().includes('fatura') ? (guess.type === 'expense' ? 'income' : guess.type) : guess.type;

    results.push({
      id: generateId(),
      date: formattedDate,
      description: rawDesc,
      amount: absAmount,
      type: finalType,
      categoryId: guess.categoryId,
      categoryName: guess.categoryName,
      confidence: guess.confidence,
      selected: true,
    });
  }

  return results;
}

/**
 * Parser de Texto Livre ou Extraído de Faturas em PDF / Extratos bancários
 * Suporta:
 * 1. Padrão C6 Bank / Nubank: "06 set SUPERMERCAD DO JANIO 47,26"
 * 2. Padrão com barras: "06/09/2026 AUTO POSTO R$ 150,00"
 * 3. Parcelamentos: "GOL LINHAS A*HBDGAM015 - Parcela 1/4 386,90"
 */
export function parseRawText(text: string): AiParsedTransaction[] {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  const transactions: AiParsedTransaction[] = [];

  // Detectar ano da fatura no documento se presente (ex: "02/10/26", "2026", "Outubro 2026")
  let docYear = '2026';
  const yearMatch = text.match(/\b(202[4-9])\b/) || text.match(/\/\d{2}\/([2-3][0-9])\b/);
  if (yearMatch) {
    docYear = yearMatch[1].length === 2 ? `20${yearMatch[1]}` : yearMatch[1];
  }

  // Padrão 1: "06 set DESCRIÇÃO DA COMPRA 47,26" (Padrão de Faturas C6 Bank, Santander, etc)
  const textualDateRegex = /^(?:[•\-\*\s]*)(\d{1,2})\s+(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\w*\s+(.+?)\s+(-?R?\$?\s*[\d\.]*,\d{2})$/i;

  // Padrão 2: "06/09/2026 DESCRIÇÃO 47,26" ou "06/09 DESCRIÇÃO R$ 47,26"
  const slashDateRegex = /^(?:[•\-\*\s]*)(\d{1,2})[\/\.-](\d{1,2})(?:[\/\.-](\d{2,4}))?\s+(.+?)\s+(-?R?\$?\s*[\d\.]*,\d{2})$/i;

  // Padrão 3: Genérico para linhas soltas com data e moeda
  const genericDatePattern = /(\d{1,2}[\/\.-]\d{1,2}(?:[\/\.-]\d{2,4})?)/;
  const genericCurrencyPattern = /(?:R\$\s*)?(-?\d{1,3}(?:\.\d{3})*,\d{2})/i;

  for (const line of lines) {
    // Ignorar cabeçalhos e linhas informativas conhecidas
    if (
      line.includes('Subtotal deste cartão') ||
      line.includes('Transações do cartão') ||
      line.includes('Valores em reais') ||
      line.includes('Data do vencimento') ||
      line.includes('Total a pagar') ||
      line.includes('Limite de cartão') ||
      line.includes('Opções de pagamento') ||
      line.includes('Saldo obrigações')
    ) {
      continue;
    }

    // Tentar Padrão 1 (Textual: 06 set DESCRIÇÃO 47,26)
    const match1 = line.match(textualDateRegex);
    if (match1) {
      const day = match1[1].padStart(2, '0');
      const monthKey = match1[2].toLowerCase().substring(0, 3);
      const month = PORTUGUESE_MONTHS[monthKey] || '01';
      const description = match1[3].trim();
      const rawAmtStr = match1[4].replace(/[R\$\s\.]/g, '').replace(',', '.');
      const amount = Math.abs(parseFloat(rawAmtStr));

      if (!isNaN(amount) && amount > 0) {
        const guess = guessCategoryAndType(description, amount);
        transactions.push({
          id: generateId(),
          date: `${docYear}-${month}-${day}`,
          description,
          amount,
          type: guess.type,
          categoryId: guess.categoryId,
          categoryName: guess.categoryName,
          confidence: guess.confidence,
          selected: true,
        });
        continue;
      }
    }

    // Tentar Padrão 2 (Numérico: 06/09/2026 DESCRIÇÃO 47,26)
    const match2 = line.match(slashDateRegex);
    if (match2) {
      const day = match2[1].padStart(2, '0');
      const month = match2[2].padStart(2, '0');
      let year = match2[3] || docYear;
      if (year.length === 2) year = `20${year}`;
      const description = match2[4].trim();
      const rawAmtStr = match2[5].replace(/[R\$\s\.]/g, '').replace(',', '.');
      const amount = Math.abs(parseFloat(rawAmtStr));

      if (!isNaN(amount) && amount > 0) {
        const guess = guessCategoryAndType(description, amount);
        transactions.push({
          id: generateId(),
          date: `${year}-${month}-${day}`,
          description,
          amount,
          type: guess.type,
          categoryId: guess.categoryId,
          categoryName: guess.categoryName,
          confidence: guess.confidence,
          selected: true,
        });
        continue;
      }
    }

    // Tentar Padrão 3 (Genérico fallback)
    const dateMatch = line.match(genericDatePattern);
    const currencyMatch = line.match(genericCurrencyPattern);

    if (dateMatch && currencyMatch) {
      const rawAmountStr = currencyMatch[1].replace(/[R\$\s\.]/g, '').replace(',', '.');
      const amount = Math.abs(parseFloat(rawAmountStr));

      if (isNaN(amount) || amount === 0) continue;

      const dateParts = dateMatch[1].split(/[\/\.-]/);
      const day = dateParts[0].padStart(2, '0');
      const month = dateParts[1].padStart(2, '0');
      let year = dateParts[2] || docYear;
      if (year.length === 2) year = `20${year}`;

      let description = line
        .replace(genericDatePattern, '')
        .replace(genericCurrencyPattern, '')
        .replace(/[•\-\|\*]/g, '')
        .trim();

      if (description.length < 2) description = 'Compra / Lançamento';

      const guess = guessCategoryAndType(description, amount);
      transactions.push({
        id: generateId(),
        date: `${year}-${month}-${day}`,
        description,
        amount,
        type: guess.type,
        categoryId: guess.categoryId,
        categoryName: guess.categoryName,
        confidence: guess.confidence,
        selected: true,
      });
    }
  }

  return transactions;
}
