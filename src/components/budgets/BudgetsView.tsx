'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { Target, AlertCircle, CheckCircle2, Edit2, Check } from 'lucide-react';
import { DynamicIcon } from '../icons/DynamicIcon';

export function BudgetsView() {
  const { categories, filteredTransactions, setCategoryBudget } = useFinance();
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [newLimitStr, setNewLimitStr] = useState<string>('');

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Calcular gasto real deste mês por categoria
  const spentMap = expenseCategories.map((cat) => {
    const spent = filteredTransactions
      .filter((tx) => tx.categoryId === cat.id && tx.status === 'completed' && tx.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const limit = cat.budgetLimit || 0;
    const percent = limit > 0 ? (spent / limit) * 100 : 0;
    const remaining = limit - spent;

    return {
      category: cat,
      spent,
      limit,
      percent,
      remaining,
    };
  });

  const totalBudget = spentMap.reduce((acc, curr) => acc + curr.limit, 0);
  const totalSpent = spentMap.reduce((acc, curr) => acc + curr.spent, 0);
  const overallPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const startEdit = (catId: string, currentLimit: number) => {
    setEditingCatId(catId);
    setNewLimitStr(currentLimit.toString());
  };

  const saveEdit = (catId: string) => {
    const parsed = parseFloat(newLimitStr.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      setCategoryBudget(catId, parsed);
    }
    setEditingCatId(null);
  };

  return (
    <div className="space-y-6">
      {/* Resumo do Teto Orçamentário */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              Metas & Tetos de Gastos Mensais
            </h3>
            <p className="text-xs text-slate-500">Defina limites para cada categoria e mantenha suas contas sob controle</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500">Gasto Total / Teto Planejado:</span>
            <div className="text-base sm:text-lg font-extrabold text-slate-900">
              {formatCurrency(totalSpent)} <span className="text-xs font-normal text-slate-400">de</span> {formatCurrency(totalBudget)}
            </div>
          </div>
        </div>

        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              overallPercent > 100 ? 'bg-rose-500' : overallPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, overallPercent)}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1.5">
          <span>{overallPercent.toFixed(1)}% do orçamento total consumido</span>
          <span>{totalBudget - totalSpent >= 0 ? `Restam ${formatCurrency(totalBudget - totalSpent)}` : `Estourado em ${formatCurrency(Math.abs(totalBudget - totalSpent))}`}</span>
        </div>
      </div>

      {/* Grid de Categorias com Orçamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {spentMap.map(({ category, spent, limit, percent, remaining }) => {
          const isOver = percent > 100;
          const isWarning = percent >= 75 && percent <= 100;

          return (
            <div
              key={category.id}
              className={`p-5 rounded-2xl bg-white border ${
                isOver
                  ? 'border-rose-300 shadow-rose-100/50 shadow-sm'
                  : isWarning
                  ? 'border-amber-300'
                  : 'border-slate-200/80'
              } shadow-xs flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${category.color}15`, color: category.color }}
                    >
                      <DynamicIcon name={category.icon} className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{category.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {isOver ? '⚠️ Teto Ultrapassado' : isWarning ? '⚡ Atenção ao limite' : '✅ Dentro da meta'}
                      </p>
                    </div>
                  </div>

                  {editingCatId === category.id ? (
                    <button
                      onClick={() => saveEdit(category.id)}
                      className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => startEdit(category.id, limit)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      title="Editar Teto Orçamentário"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Valores */}
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-lg font-bold text-slate-900">{formatCurrency(spent)}</span>
                  {editingCatId === category.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">R$</span>
                      <input
                        type="text"
                        value={newLimitStr}
                        onChange={(e) => setNewLimitStr(e.target.value)}
                        className="w-20 px-2 py-0.5 rounded border border-slate-300 text-xs font-bold"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 font-medium">Meta: {formatCurrency(limit)}</span>
                  )}
                </div>

                {/* Barra de Progresso */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, percent)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] mt-3 pt-2 border-t border-slate-100">
                <span className={`font-semibold ${isOver ? 'text-rose-600' : 'text-slate-600'}`}>
                  {percent.toFixed(0)}% utilizado
                </span>
                <span className="text-slate-500">
                  {remaining >= 0 ? `Resta ${formatCurrency(remaining)}` : `Excedeu ${formatCurrency(Math.abs(remaining))}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
