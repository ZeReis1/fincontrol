'use client';

import React, { useState, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Transaction, TransactionType, PaymentMethod } from '@/types/finance';
import { X, Check } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
}

export function TransactionModal({ isOpen, onClose, transactionToEdit }: TransactionModalProps) {
  const { categories, accounts, creditCards, addTransaction, updateTransaction } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState('2026-11-01');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [creditCardId, setCreditCardId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [status, setStatus] = useState<'completed' | 'pending'>('completed');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setDescription(transactionToEdit.description);
      setAmountStr(transactionToEdit.amount.toString());
      setDate(transactionToEdit.date);
      setCategoryId(transactionToEdit.categoryId);
      setAccountId(transactionToEdit.accountId || '');
      setCreditCardId(transactionToEdit.creditCardId || '');
      setPaymentMethod(transactionToEdit.paymentMethod);
      setStatus(transactionToEdit.status);
      setNotes(transactionToEdit.notes || '');
    } else {
      setType('expense');
      setDescription('');
      setAmountStr('');
      setDate(new Date().toISOString().split('T')[0]);
      // Selecionar primeira categoria compatível
      const firstCat = categories.find((c) => c.type === 'expense');
      setCategoryId(firstCat ? firstCat.id : categories[0]?.id || '');
      setAccountId(accounts[0]?.id || '');
      setCreditCardId('');
      setPaymentMethod('pix');
      setStatus('completed');
      setNotes('');
    }
  }, [transactionToEdit, isOpen, categories, accounts]);

  // Ao mudar o tipo, atualizar para uma categoria correspondente
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const compatibleCat = categories.find((c) => c.type === newType);
    if (compatibleCat) {
      setCategoryId(compatibleCat.id);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanAmount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      alert('Por favor, informe um valor válido maior que zero.');
      return;
    }

    if (!description.trim()) {
      alert('Por favor, informe uma descrição.');
      return;
    }

    const payload = {
      type,
      description: description.trim(),
      amount: cleanAmount,
      date,
      categoryId,
      accountId: creditCardId ? undefined : accountId || undefined,
      creditCardId: creditCardId || undefined,
      paymentMethod,
      status,
      notes: notes.trim() || undefined,
    };

    if (transactionToEdit) {
      updateTransaction(transactionToEdit.id, payload);
    } else {
      addTransaction(payload);
    }

    onClose();
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h2 className="font-bold text-slate-900 text-base">
            {transactionToEdit ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seletor de Tipo */}
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 rounded-lg transition-all ${
                type === 'expense' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 rounded-lg transition-all ${
                type === 'income' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('investment')}
              className={`py-2 rounded-lg transition-all ${
                type === 'investment' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Aporte
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('loss')}
              className={`py-2 rounded-lg transition-all ${
                type === 'loss' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Prejuízo
            </button>
          </div>

          {/* Valor & Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Valor (R$)*</label>
              <input
                type="text"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0,00"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Data*</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Descrição*</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado, Aluguel, Proventos..."
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Categoria*</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 cursor-pointer"
            >
              {filteredCategories.length > 0 ? (
                filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              ) : (
                <option value="">Nenhuma categoria deste tipo</option>
              )}
            </select>
          </div>

          {/* Conta ou Cartão de Crédito */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Conta Bancária</label>
              <select
                value={accountId}
                disabled={Boolean(creditCardId)}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:opacity-50"
              >
                <option value="">Selecione a conta...</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Ou Cartão de Crédito</label>
              <select
                value={creditCardId}
                onChange={(e) => setCreditCardId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
              >
                <option value="">Nenhum cartão</option>
                {creditCards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status & Método */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'completed' | 'pending')}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
              >
                <option value="completed">Concluído / Pago</option>
                <option value="pending">Pendente / Agendado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Forma de Pagamento</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
              >
                <option value="pix">Pix</option>
                <option value="credit_card">Cartão de Crédito</option>
                <option value="debit_card">Cartão de Débito</option>
                <option value="bank_slip">Boleto</option>
                <option value="transfer">Transferência / TED</option>
                <option value="cash">Dinheiro</option>
                <option value="other">Outro</option>
              </select>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Observações (opcional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionais..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              {transactionToEdit ? 'Salvar Alterações' : 'Adicionar Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
