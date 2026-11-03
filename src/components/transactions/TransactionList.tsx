'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Transaction, TransactionType } from '@/types/finance';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DynamicIcon } from '../icons/DynamicIcon';
import { 
  Search, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  Clock, 
  Sparkles, 
  CreditCard as CardIcon, 
  Building2 
} from 'lucide-react';

interface TransactionListProps {
  onEditTransaction?: (tx: Transaction) => void;
}

export function TransactionList({ onEditTransaction }: TransactionListProps) {
  const { filteredTransactions, categories, accounts, creditCards, deleteTransaction, updateTransaction } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filtered = useMemo(() => {
    return filteredTransactions.filter((tx) => {
      const matchesSearch =
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = selectedType === 'all' || tx.type === selectedType;
      const matchesCategory = selectedCategory === 'all' || tx.categoryId === selectedCategory;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [filteredTransactions, searchTerm, selectedType, selectedCategory]);

  const toggleStatus = (tx: Transaction) => {
    updateTransaction(tx.id, {
      status: tx.status === 'completed' ? 'pending' : 'completed',
    });
  };

  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'income':
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Receita</span>;
      case 'expense':
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-200">Despesa</span>;
      case 'investment':
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">Investimento</span>;
      case 'loss':
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200">Prejuízo</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Barra de Filtros e Busca */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50/50">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por descrição..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Filtro por Tipo */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">Todos os Tipos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
            <option value="investment">Investimentos</option>
            <option value="loss">Prejuízos</option>
          </select>

          {/* Filtro por Categoria */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none cursor-pointer max-w-[180px]"
          >
            <option value="all">Todas Categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de Transações */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <p className="text-sm font-medium text-slate-600">Nenhum lançamento encontrado</p>
          <p className="text-xs text-slate-400 mt-1">Tente ajustar os filtros ou adicione uma nova transação.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Conta / Cartão</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((tx) => {
                const cat = categories.find((c) => c.id === tx.categoryId);
                const acc = accounts.find((a) => a.id === tx.accountId);
                const card = creditCards.find((c) => c.id === tx.creditCardId);

                return (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{tx.description}</span>
                        {tx.aiExtracted && (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200"
                            title="Extraído e categorizado por Inteligência Artificial"
                          >
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                            IA
                          </span>
                        )}
                      </div>
                      {tx.notes && <p className="text-[11px] text-slate-400 truncate max-w-xs">{tx.notes}</p>}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: cat?.color || '#94A3B8' }}
                        />
                        {cat?.name || 'Geral'}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      {card ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                          <CardIcon className="w-3 h-3" />
                          {card.name}
                        </span>
                      ) : acc ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Building2 className="w-3 h-3 text-slate-500" />
                          {acc.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">{getTypeBadge(tx.type)}</td>

                    <td className="py-3 px-4 text-right whitespace-nowrap font-bold">
                      <span
                        className={
                          tx.type === 'income'
                            ? 'text-emerald-600'
                            : tx.type === 'expense'
                            ? 'text-rose-600'
                            : tx.type === 'investment'
                            ? 'text-indigo-600'
                            : 'text-amber-600'
                        }
                      >
                        {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => toggleStatus(tx)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                          tx.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        }`}
                        title="Clique para alternar status"
                      >
                        {tx.status === 'completed' ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Pago
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            Pendente
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {onEditTransaction && (
                          <button
                            onClick={() => onEditTransaction(tx)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Excluir lançamento "${tx.description}"?`)) {
                              deleteTransaction(tx.id);
                            }
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
