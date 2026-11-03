'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { DynamicIcon } from '../icons/DynamicIcon';

export function UpcomingBills() {
  const { filteredTransactions, categories, updateTransaction } = useFinance();

  const pendingBills = filteredTransactions
    .filter((tx) => tx.status === 'pending')
    .slice(0, 5);

  const handleMarkAsDone = (id: string) => {
    updateTransaction(id, { status: 'completed' });
  };

  return (
    <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Contas & Vencimentos Pendentes
          </h3>
          <p className="text-xs text-slate-500">Lançamentos a pagar ou receber neste mês</p>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          {pendingBills.length} pendente(s)
        </span>
      </div>

      {pendingBills.length === 0 ? (
        <div className="py-8 text-center text-slate-400">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
          <p className="text-xs font-medium text-slate-600">Tudo em dia!</p>
          <p className="text-[11px] text-slate-400">Nenhuma conta pendente para este mês.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {pendingBills.map((bill) => {
            const cat = categories.find((c) => c.id === bill.categoryId);
            const isExpense = bill.type === 'expense' || bill.type === 'loss';

            return (
              <div
                key={bill.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cat?.color || '#64748B'}15`, color: cat?.color || '#64748B' }}
                  >
                    <DynamicIcon name={cat?.icon || 'HelpCircle'} className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 line-clamp-1">{bill.description}</p>
                    <p className="text-[11px] text-slate-500">
                      Vencimento: <span className="font-medium text-slate-700">{formatDate(bill.date)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`font-bold ${isExpense ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {isExpense ? '-' : '+'} {formatCurrency(bill.amount)}
                    </p>
                    <span className="text-[10px] text-amber-600 font-medium">Pendente</span>
                  </div>

                  <button
                    onClick={() => handleMarkAsDone(bill.id)}
                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                    title="Marcar como Pago / Concluído"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
