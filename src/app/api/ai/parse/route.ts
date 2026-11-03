import { NextRequest, NextResponse } from 'next/server';
import { parseCsv, parseOfx, parseRawText } from '@/lib/ai-parser';
import { DEFAULT_CATEGORIES } from '@/lib/constants';
import { GoogleGenAI } from '@google/genai';
import { generateId } from '@/lib/utils';
import { AiParsedTransaction } from '@/types/finance';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let textContent = '';
    let fileBase64 = '';
    let mimeType = '';
    let clientApiKey = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const rawText = formData.get('text') as string | null;
      clientApiKey = (formData.get('apiKey') as string) || '';

      if (rawText) {
        textContent = rawText;
      }

      if (file) {
        mimeType = file.type || 'application/octet-stream';
        const buffer = await file.arrayBuffer();

        if (file.name.endsWith('.ofx')) {
          const text = new TextDecoder('iso-8859-1').decode(buffer);
          const parsed = parseOfx(text);
          return NextResponse.json({ success: true, transactions: parsed, source: 'ofx-parser' });
        }

        if (file.name.endsWith('.csv')) {
          const text = new TextDecoder('utf-8').decode(buffer);
          const parsed = parseCsv(text);
          return NextResponse.json({ success: true, transactions: parsed, source: 'csv-parser' });
        }

        // Se for imagem ou PDF ou texto TXT
        if (mimeType.includes('text') || file.name.endsWith('.txt')) {
          textContent = new TextDecoder('utf-8').decode(buffer);
        } else {
          fileBase64 = Buffer.from(buffer).toString('base64');
        }
      }
    } else {
      const body = await req.json();
      textContent = body.text || '';
      fileBase64 = body.base64 || '';
      mimeType = body.mimeType || '';
      clientApiKey = body.apiKey || '';
    }

    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;

    // Se temos chave de API do Gemini e temos dados para enviar ao modelo
    if (apiKey && (fileBase64 || (textContent && textContent.length > 10))) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
Você é um especialista em finanças pessoais e processamento de faturas e extratos bancários brasileiros (Nubank, Itaú, Inter, Bradesco, C6, etc).
Analise com precisão cirúrgica o arquivo ou texto fornecido e extraia TODAS as transações financeiras.

Categorias disponíveis no sistema:
${DEFAULT_CATEGORIES.map(c => `- ${c.name} (tipo: ${c.type}, id: ${c.id})`).join('\n')}

Para cada transação identificada, retorne um objeto JSON contendo:
- "date": string no formato "YYYY-MM-DD" (se o ano não estiver especificado, assuma o ano corrente 2026).
- "description": string com o nome limpo e amigável do estabelecimento ou descrição (ex: transforme "PAG*Uber BR" em "Uber", "IOF DEBITO" em "IOF").
- "amount": número positivo (float, ex: 45.90) com ponto como separador decimal.
- "type": exatamente um destes: "expense" (despesa), "income" (receita/salário/pix recebido), "investment" (aporte/investimento/tesouro/ações), ou "loss" (prejuízo/perda em trade/multa pesada/juros por atraso).
- "categoryName": o nome de uma das categorias listadas acima que melhor se encaixe.
- "categoryId": o id correspondente da categoria listada acima.

Retorne APENAS um array JSON puro no formato:
[
  {
    "date": "2026-11-05",
    "description": "Supermercado Pão de Açúcar",
    "amount": 142.50,
    "type": "expense",
    "categoryName": "Supermercado & Feira",
    "categoryId": "cat_supermercado"
  }
]
Não inclua explicações ou markdown com três crases se puder evitar, apenas o JSON puro.
`;

        let contents: any = prompt;

        if (fileBase64) {
          contents = [
            {
              inlineData: {
                data: fileBase64,
                mimeType: mimeType || 'application/pdf',
              },
            },
            prompt,
          ];
        } else if (textContent) {
          contents = `${prompt}\n\nTEXTO DO EXTRATO:\n${textContent}`;
        }

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
        });

        const rawReply = response.text || '';
        // Limpar possíveis crases de markdown
        const cleanedJson = rawReply.replace(/```json/gi, '').replace(/```/gi, '').trim();

        const jsonArray = JSON.parse(cleanedJson);
        if (Array.isArray(jsonArray)) {
          const mapped: AiParsedTransaction[] = jsonArray.map((item: any) => ({
            id: generateId(),
            date: item.date || new Date().toISOString().split('T')[0],
            description: item.description || 'Lançamento',
            amount: typeof item.amount === 'number' ? Math.abs(item.amount) : parseFloat(String(item.amount).replace(',', '.')),
            type: ['expense', 'income', 'investment', 'loss'].includes(item.type) ? item.type : 'expense',
            categoryId: item.categoryId || 'cat_outros_gastos',
            categoryName: item.categoryName || 'Outras Despesas',
            confidence: 0.98,
            selected: true,
          }));

          return NextResponse.json({
            success: true,
            transactions: mapped,
            source: 'gemini-ai',
          });
        }
      } catch (aiError) {
        console.warn('Erro na chamada Gemini AI, aplicando fallback heurístico:', aiError);
      }
    }

    // Fallback: Se não tem chave ou a IA falhou, aplicar os parsers heurísticos locais
    if (textContent) {
      const parsed = parseRawText(textContent);
      return NextResponse.json({
        success: true,
        transactions: parsed,
        source: 'heuristic-nlp',
        note: !apiKey ? 'Processado localmente por IA heurística. Adicione sua chave Gemini para leitura de faturas em PDF/imagem complexas.' : undefined,
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Não foi possível extrair dados do documento fornecido.',
      transactions: [],
    }, { status: 400 });

  } catch (error: any) {
    console.error('Erro na rota de extração:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Falha ao processar arquivo.',
      transactions: [],
    }, { status: 500 });
  }
}
