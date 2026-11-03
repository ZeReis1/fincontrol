'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { AiParsedTransaction, TransactionType } from '@/types/finance';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  Sparkles, 
  Upload, 
  FileText, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  ArrowRight, 
  Building2, 
  CreditCard as CardIcon 
} from 'lucide-react';

interface AiImportViewProps {
  onSuccessRedirect?: () => void;
}

export function AiImportView({ onSuccessRedirect }: AiImportViewProps) {
  const { categories, accounts, creditCards, addBatchAiTransactions, userApiKey } = useFinance();

  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedList, setExtractedList] = useState<AiParsedTransaction[]>([]);
  const [sourceEngine, setSourceEngine] = useState<string>('');
  const [targetAccountId, setTargetAccountId] = useState(accounts[0]?.id || '');
  const [targetCardId, setTargetCardId] = useState('');
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setImportSuccessMessage(null);
    }
  };

  const handleProcess = async () => {
    if (!file && !pastedText.trim()) {
      alert('Por favor, selecione um arquivo (PDF, CSV, OFX, Imagem) ou cole o texto do extrato.');
      return;
    }

    setIsProcessing(true);
    setImportSuccessMessage(null);

    try {
      let res;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        if (userApiKey) formData.append('apiKey', userApiKey);
        res = await fetch('/api/ai/parse', {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await fetch('/api/ai/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: pastedText,
            apiKey: userApiKey,
          }),
        });
      }

      const data = await res.json();

      if (data.success && Array.isArray(data.transactions) && data.transactions.length > 0) {
        setExtractedList(data.transactions);
        setSourceEngine(data.source === 'gemini-ai' ? 'Google Gemini AI' : 'Motor NLP Heurístico');
      } else {
        alert(data.error || 'Nenhuma transação foi identificada no conteúdo enviado. Tente novamente.');
      }
    } catch (err: any) {
      console.error('Erro ao processar:', err);
      alert('Ocorreu um erro no processamento. Verifique o arquivo e tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleSelectAll = (checked: boolean) => {
    setExtractedList((prev) => prev.map((item) => ({ ...item, selected: checked })));
  };

  const handleToggleItem = (id: string) => {
    setExtractedList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleCategoryChange = (id: string, newCatId: string) => {
    const cat = categories.find((c) => c.id === newCatId);
    setExtractedList((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              categoryId: newCatId,
              categoryName: cat ? cat.name : item.categoryName,
              type: cat ? cat.type : item.type,
            }
          : item
      )
    );
  };

  const handleTypeChange = (id: string, newType: TransactionType) => {
    setExtractedList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, type: newType } : item))
    );
  };

  const handleConfirmImport = () => {
    const selectedItems = extractedList.filter((item) => item.selected);
    if (selectedItems.length === 0) {
      alert('Selecione pelo menos uma transação para lançar.');
      return;
    }

    addBatchAiTransactions(
      selectedItems,
      targetCardId ? undefined : targetAccountId,
      targetCardId || undefined
    );

    const totalVal = selectedItems.reduce((acc, curr) => acc + curr.amount, 0);
    setImportSuccessMessage(
      `Sucesso! ${selectedItems.length} transações importadas com sucesso (${formatCurrency(totalVal)}).`
    );
    setExtractedList([]);
    setFile(null);
    setPastedText('');

    if (onSuccessRedirect) {
      setTimeout(onSuccessRedirect, 1600);
    }
  };

  const selectedCount = extractedList.filter((i) => i.selected).length;
  const totalAmountSelected = extractedList
    .filter((i) => i.selected)
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      {/* Mensagem de Sucesso */}
      {importSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{importSuccessMessage}</span>
        </div>
      )}

      {/* Caixa de Entrada do Extrato / Fatura */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Importação Inteligente com IA
            </h3>
            <p className="text-xs text-slate-500">
              Envie extratos ou faturas (PDF, CSV, OFX, Imagens) ou cole o texto para lançamento automático categorizado
            </p>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setInputMode('file')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                inputMode === 'file' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600'
              }`}
            >
              Upload de Arquivo
            </button>
            <button
              onClick={() => setInputMode('text')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                inputMode === 'text' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600'
              }`}
            >
              Colar Texto
            </button>
          </div>
        </div>

        {/* MODO ARQUIVO */}
        {inputMode === 'file' ? (
          <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
            <input
              type="file"
              id="file-upload"
              accept=".pdf,.csv,.ofx,.txt,image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                {file ? file.name : 'Clique para selecionar seu extrato ou fatura'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Suporta PDF (faturas e extratos), CSV, OFX de todos os bancos brasileiros e comprovantes em imagem
              </p>
              {file && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-semibold">
                  <FileText className="w-3.5 h-3.5" />
                  {file.name} ({(file.size / 1024).toFixed(0)} KB)
                </div>
              )}
            </label>
          </div>
        ) : (
          /* MODO COLAR TEXTO */
          <div>
            <textarea
              rows={5}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Cole as linhas do extrato do app do banco aqui... Ex:
05/11 Uber Trip R$ 24,90
06/11 Mercado Carrefour R$ 180,50
07/11 Pix Recebido Salario R$ 5.500,00"
              className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
            />
          </div>
        )}

        {/* Botão de Processamento */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Processamento com IA e classificação automática em 80+ categorias</span>
          </div>

          <button
            onClick={handleProcess}
            disabled={isProcessing || (!file && !pastedText.trim())}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processando com IA...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analisar & Extrair Dados
              </>
            )}
          </button>
        </div>
      </div>

      {/* RESULTADO DA EXTRAÇÃO (TELA DE REVISÃO PRÉ-LANÇAMENTO) */}
      {extractedList.length > 0 && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">Revisão de Lançamentos Identificados</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                  {extractedList.length} transações
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700">
                  Via {sourceEngine}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Revise as categorias sugeridas antes de confirmar a importação
              </p>
            </div>

            {/* Destino: Conta ou Cartão */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-600 font-medium">Destino do Lote:</span>
              <select
                value={targetCardId ? `card_${targetCardId}` : `acc_${targetAccountId}`}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.startsWith('card_')) {
                    setTargetCardId(val.replace('card_', ''));
                    setTargetAccountId('');
                  } else {
                    setTargetAccountId(val.replace('acc_', ''));
                    setTargetCardId('');
                  }
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-800 focus:outline-none"
              >
                <optgroup label="Contas Bancárias">
                  {accounts.map((acc) => (
                    <option key={acc.id} value={`acc_${acc.id}`}>
                      {acc.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Cartões de Crédito">
                  {creditCards.map((card) => (
                    <option key={card.id} value={`card_${card.id}`}>
                      {card.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Tabela de Revisão */}
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">
                    <input
                      type="checkbox"
                      checked={extractedList.every((i) => i.selected)}
                      onChange={(e) => handleToggleSelectAll(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-0"
                    />
                  </th>
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Descrição</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Categoria Sugerida</th>
                  <th className="py-2.5 px-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {extractedList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleToggleItem(item.id)}
                        className="rounded text-indigo-600 focus:ring-0"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap font-medium">
                      {formatDate(item.date)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {item.description}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <select
                        value={item.type}
                        onChange={(e) => handleTypeChange(item.id, e.target.value as TransactionType)}
                        className="px-2 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold bg-white"
                      >
                        <option value="expense">Despesa</option>
                        <option value="income">Receita</option>
                        <option value="investment">Investimento</option>
                        <option value="loss">Prejuízo</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <select
                        value={item.categoryId || ''}
                        onChange={(e) => handleCategoryChange(item.id, e.target.value)}
                        className="px-2 py-1 rounded-lg border border-slate-200 text-[11px] bg-white text-slate-800"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.type})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-slate-900">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rodapé com Botão de Confirmação */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-900">{selectedCount}</span> de {extractedList.length} itens selecionados (Total: <span className="font-bold text-indigo-600">{formatCurrency(totalAmountSelected)}</span>)
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setExtractedList([])}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Descartar
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={selectedCount === 0}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                Confirmar e Lançar ({selectedCount})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
