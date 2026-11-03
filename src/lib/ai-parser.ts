import Papa from 'papaparse';
import { AiParsedTransaction, TransactionType } from '@/types/finance';
import { DEFAULT_CATEGORIES, KEYWORD_CATEGORY_RULES } from './constants';
import { generateId } from './utils';

/**
 * Normaliza e busca a melhor categoria baseada na descrição (NLP Heurístico Local)
 */
export function guessCategoryAndType(description: string, rawAmount: number): { categoryId: string; categoryName: string; type: TransactionType; confidence: number } {
  const normalized = description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

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

  // Heurística de tipo baseada no sinal do valor
  if (rawAmount > 0 && (normalized.includes('receb') || normalized.includes('pix receb') || normalized.includes('deposito') || normalized.includes('ted rec'))) {
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

    // Extrair campos do OFX
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
    // Detectar colunas dinamicamente
    const dateKey = Object.keys(row).find(k => /data|date/i.test(k));
    const descKey = Object.keys(row).find(k => /descri|titulo|title|memo|estabelecimento/i.test(k));
    const amountKey = Object.keys(row).find(k => /valor|amount|val/i.test(k));

    if (!dateKey || !amountKey) continue;

    const rawDate = row[dateKey]?.trim();
    const rawDesc = descKey ? row[descKey]?.trim() : 'Compra / Lançamento';
    const rawAmountStr = row[amountKey]?.toString().replace('R$', '').replace(/\s/g, '').replace('.', '').replace(',', '.');
    const rawAmount = parseFloat(rawAmountStr || '0');

    if (isNaN(rawAmount) || rawAmount === 0) continue;

    // Tratar data (DD/MM/YYYY ou YYYY-MM-DD)
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
 * Parser de Texto Livre ou Copiado de Extrato / App de Banco
 * Exemplo: "05/11 Mercado Livre R$ 149,90" ou "12/11/2026 Pix Enviado Jose R$ 80,00"
 */
export function parseRawText(text: string): AiParsedTransaction[] {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  const transactions: AiParsedTransaction[] = [];

  const datePattern = /(\d{1,2}[\/\.-]\d{1,2}(?:[\/\.-]\d{2,4})?)/;
  const currencyPattern = /(?:R\$\s*)?(-?\d+[\.,]\d{2})/i;

  for (const line of lines) {
    const dateMatch = line.match(datePattern);
    const currencyMatch = line.match(currencyPattern);

    if (currencyMatch) {
      const rawAmountStr = currencyMatch[1].replace('.', '').replace(',', '.');
      const amount = Math.abs(parseFloat(rawAmountStr));

      let formattedDate = new Date().toISOString().split('T')[0];
      if (dateMatch) {
        const dateParts = dateMatch[1].split(/[\/\.-]/);
        const day = dateParts[0].padStart(2, '0');
        const month = dateParts[1].padStart(2, '0');
        let year = dateParts[2] || new Date().getFullYear().toString();
        if (year.length === 2) year = `20${year}`;
        formattedDate = `${year}-${month}-${day}`;
      }

      // Descrição limpa removendo a data e o valor da linha
      let description = line
        .replace(datePattern, '')
        .replace(currencyPattern, '')
        .replace(/[•\-\|\*]/g, '')
        .trim();

      if (!description) description = 'Transação Identificada';

      const guess = guessCategoryAndType(description, amount);

      transactions.push({
        id: generateId(),
        date: formattedDate,
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
