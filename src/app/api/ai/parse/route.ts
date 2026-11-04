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

        // 1. Arquivos OFX bancários
        if (file.name.endsWith('.ofx')) {
          const text = new TextDecoder('iso-8859-1').decode(buffer);
          const parsed = parseOfx(text);
          return NextResponse.json({ success: true, transactions: parsed, source: 'ofx-parser' });
        }

        // 2. Arquivos CSV
        if (file.name.endsWith('.csv')) {
          const text = new TextDecoder('utf-8').decode(buffer);
          const parsed = parseCsv(text);
          return NextResponse.json({ success: true, transactions: parsed, source: 'csv-parser' });
        }

        // 3. Arquivos PDF (Faturas C6, Nubank, Itaú, Inter, etc)
        if (file.name.endsWith('.pdf') || mimeType.includes('pdf')) {
          try {
            const { extractText } = await import('unpdf');
            const pdfResult = await extractText(new Uint8Array(buffer));
            const pages = pdfResult.text;
            textContent = Array.isArray(pages) ? pages.join('\n') : pages || '';
          } catch (pdfErr) {
            console.warn('Falha no unpdf, prosseguindo com base64:', pdfErr);
          }
          fileBase64 = Buffer.from(buffer).toString('base64');
        } else if (mimeType.includes('text') || file.name.endsWith('.txt')) {
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
Você é um especialista em finanças pessoais e processamento de faturas e extratos bancários brasileiros (Nubank, C6 Bank, Itaú, Inter, Bradesco, etc).
Analise com precisão cirúrgica o documento fornecido e extraia TODAS as transações financeiras de compras e pagamentos.

Categorias disponíveis no sistema:
${DEFAULT_CATEGORIES.map(c => `- ${c.name} (tipo: ${c.type}, id: ${c.id})`).join('\n')}

Para cada transação identificada, retorne um objeto JSON contendo:
- "date": string no formato "YYYY-MM-DD".
- "description": string com o nome limpo e amigável do estabelecimento (ex: "SUPERMERCAD DO JANIO", "AUTO POSTO INDUSTRIAL", "PADARIA MORRO CHIC", "GOL LINHAS").
- "amount": número positivo (float, ex: 47.26).
- "type": exatamente um destes: "expense" (despesa), "income" (receita/estorno), "investment" (aporte), ou "loss" (prejuízo/multa).
- "categoryName": o nome de uma das categorias listadas acima que melhor se encaixe.
- "categoryId": o id correspondente da categoria listada acima.

Retorne APENAS um array JSON puro:
[
  {
    "date": "2026-09-06",
    "description": "SUPERMERCAD DO JANIO",
    "amount": 47.26,
    "type": "expense",
    "categoryName": "Supermercado & Feira",
    "categoryId": "cat_supermercado"
  }
]
`;

        let contents: any = prompt;

        if (textContent && textContent.length > 50) {
          contents = `${prompt}\n\nTEXTO EXTRAÍDO DA FATURA:\n${textContent}`;
        } else if (fileBase64) {
          contents = [
            {
              inlineData: {
                data: fileBase64,
                mimeType: mimeType || 'application/pdf',
              },
            },
            prompt,
          ];
        }

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
        });

        const rawReply = response.text || '';
        const cleanedJson = rawReply.replace(/```json/gi, '').replace(/```/gi, '').trim();

        const jsonArray = JSON.parse(cleanedJson);
        if (Array.isArray(jsonArray) && jsonArray.length > 0) {
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

    // Fallback: Se não tem chave ou a IA falhou, aplicar o parser nativo local no texto extraído
    if (textContent && textContent.length > 5) {
      const parsed = parseRawText(textContent);
      if (parsed.length > 0) {
        return NextResponse.json({
          success: true,
          transactions: parsed,
          source: 'motor-c6-faturas',
        });
      }
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
