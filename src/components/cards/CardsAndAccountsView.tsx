'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { Account, CreditCard } from '@/types/finance';
import { 
  Building2, 
  CreditCard as CardIcon, 
  Plus, 
  Trash2, 
  Calendar, 
  Percent, 
  Wallet 
} from 'lucide-react';

export function CardsAndAccountsView() {
  const { accounts, creditCards, addAccount, deleteAccount, addCreditCard, deleteCreditCard } = useFinance();

  // Modais de Criação
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // Estados Novo Banco
  const [newAccName, setNewAccName] = useState('');
  const [newAccInst, setNewAccInst] = useState('');
  const [newAccType, setNewAccType] = useState<Account['type']>('checking');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newAccColor, setNewAccColor] = useState('#3B82F6');

  // Estados Novo Cartão
  const [newCardName, setNewCardName] = useState('');
  const [newCardInst, setNewCardInst] = useState('');
  const [newCardLimit, setNewCardLimit] = useState('');
  const [newCardClosing, setNewCardClosing] = useState('25');
  const [newCardDue, setNewCardDue] = useState('5');
  const [newCardColor, setNewCardColor] = useState('#8B5CF6');

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const bal = parseFloat(newAccBalance.replace(',', '.'));
    if (!newAccName.trim() || isNaN(bal)) return;

    addAccount({
      name: newAccName.trim(),
      institution: newAccInst.trim() || 'Outro',
      type: newAccType,
      balance: bal,
      color: newAccColor,
    });

    setNewAccName('');
    setNewAccInst('');
    setNewAccBalance('');
    setIsAccountModalOpen(false);
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    const lim = parseFloat(newCardLimit.replace(',', '.'));
    if (!newCardName.trim() || isNaN(lim)) return;

    addCreditCard({
      name: newCardName.trim(),
      institution: newCardInst.trim() || 'Outro',
      limit: lim,
      availableLimit: lim,
      closingDay: parseInt(newCardClosing) || 25,
      dueDay: parseInt(newCardDue) || 5,
      color: newCardColor,
    });

    setNewCardName('');
    setNewCardInst('');
    setNewCardLimit('');
    setIsCardModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* SEÇÃO 1: CONTAS BANCÁRIAS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              Contas & Instituições Financeiras
            </h3>
            <p className="text-xs text-slate-500">Saldos em bancos, corretoras e carteira física</p>
          </div>
          <button
            onClick={() => setIsAccountModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Conta
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: acc.color }} />
                  <span className="text-xs font-semibold text-slate-800">{acc.institution}</span>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Remover conta ${acc.name}?`)) deleteAccount(acc.id);
                  }}
                  className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <p className="text-sm font-bold text-slate-900 mb-0.5">{acc.name}</p>
                <p className="text-xl font-extrabold text-slate-900">{formatCurrency(acc.balance)}</p>
                <span className="inline-block mt-2 text-[10px] uppercase font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {acc.type === 'checking'
                    ? 'Conta Corrente'
                    : acc.type === 'investment'
                    ? 'Corretora / Investimento'
                    : acc.type === 'savings'
                    ? 'Poupança'
                    : 'Dinheiro'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEÇÃO 2: CARTÕES DE CRÉDITO */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <CardIcon className="w-5 h-5 text-purple-600" />
              Cartões de Crédito & Faturas
            </h3>
            <p className="text-xs text-slate-500">Gestão de limites, melhor dia de compra e vencimento</p>
          </div>
          <button
            onClick={() => setIsCardModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Cartão
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {creditCards.map((card) => {
            const usedAmount = Math.max(0, card.limit - card.availableLimit);
            const usagePercent = card.limit > 0 ? (usedAmount / card.limit) * 100 : 0;

            return (
              <div
                key={card.id}
                className="p-5 rounded-2xl bg-white border border-purple-200/70 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: card.color }}
                    >
                      <CardIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{card.name}</p>
                      <p className="text-[10px] text-slate-500">{card.institution}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Remover cartão ${card.name}?`)) deleteCreditCard(card.id);
                    }}
                    className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Limite Utilizado e Disponível */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">Fatura Atual:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(usedAmount)}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        usagePercent > 85 ? 'bg-rose-500' : usagePercent > 60 ? 'bg-amber-500' : 'bg-purple-600'
                      }`}
                      style={{ width: `${Math.min(100, usagePercent)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                    <span>Limite: {formatCurrency(card.limit)}</span>
                    <span className="font-medium text-emerald-600">
                      Disponível: {formatCurrency(card.availableLimit)}
                    </span>
                  </div>
                </div>

                {/* Datas de Fechamento e Vencimento */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <p className="text-[10px] text-slate-400">Melhor Dia / Fecha</p>
                    <p className="font-bold text-slate-800">Dia {card.closingDay}</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <p className="text-[10px] text-slate-400">Vencimento</p>
                    <p className="font-bold text-slate-800">Dia {card.dueDay}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL ADICIONAR CONTA */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-4">Adicionar Nova Conta</h3>
            <form onSubmit={handleAddAccount} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Nome da Conta*</label>
                <input
                  type="text"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  placeholder="Ex: Nubank Principal"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Instituição</label>
                <input
                  type="text"
                  value={newAccInst}
                  onChange={(e) => setNewAccInst(e.target.value)}
                  placeholder="Ex: Nubank, Itaú, XP"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Saldo Atual (R$)*</label>
                <input
                  type="text"
                  value={newAccBalance}
                  onChange={(e) => setNewAccBalance(e.target.value)}
                  placeholder="0,00"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-xl"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR CARTÃO */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-4">Adicionar Novo Cartão</h3>
            <form onSubmit={handleAddCard} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Nome do Cartão*</label>
                <input
                  type="text"
                  value={newCardName}
                  onChange={(e) => setNewCardName(e.target.value)}
                  placeholder="Ex: Mastercard Black"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Limite Total (R$)*</label>
                <input
                  type="text"
                  value={newCardLimit}
                  onChange={(e) => setNewCardLimit(e.target.value)}
                  placeholder="10000,00"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700">Dia Fechamento</label>
                  <input
                    type="number"
                    value={newCardClosing}
                    onChange={(e) => setNewCardClosing(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Dia Vencimento</label>
                  <input
                    type="number"
                    value={newCardDue}
                    onChange={(e) => setNewCardDue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCardModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-purple-600 text-white rounded-xl"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
