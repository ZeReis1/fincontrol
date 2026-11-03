'use client';

import React, { useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  PiggyBank, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Coins, 
  BarChart3, 
  Flame 
} from 'lucide-react';

export function InvestmentsAndLossesView() {
  const { filteredTransactions, categories } = useFinance();

  const investmentTxs = useMemo(() => {
    return filteredTransactions.filter((tx) => tx.type === 'investment');
  }, [filteredTransactions]);

  const lossTxs = useMemo(() => {
    return filteredTransactions.filter((tx) => tx.type === 'loss');
  }, [filteredTransactions]);

  const totalInvested = useMemo(() => {
    return investmentTxs.reduce((acc, curr) => acc + curr.amount, 0);
  }, [investmentTxs]);

  const totalLosses = useMemo(() => {
    return lossTxs.reduce((acc, curr) => acc + curr.amount, 0);
  }, [lossTxs]);

  // Agrupamento por categoria de investimento
  const investmentByCategory = useMemo(() => {
    const map: Record<string, { name: string; amount: number; color: string }> = {};
    investmentTxs.forEach((tx) => {
      const cat = categories.find((c) => c.id === tx.categoryId);
      const name = cat ? cat.name : 'Outros Investimentos';
      const color = cat ? cat.color : '#6366F1';
      if (!map[name]) map[name] = { name, amount: 0, color };
      map[name].amount += tx.amount;
    });
    return Object.values(map);
  }, [investmentTxs, categories]);

  // Agrupamento por categoria de prejuízo
  const lossByCategory = useMemo(() => {
    const map: Record<string, { name: string; amount: number; color: string }> = {};
    lossTxs.forEach((tx) => {
      const cat = categories.find((c) => c.id === tx.categoryId);
      const name = cat ? cat.name : 'Outros Prejuízos';
      const color = cat ? cat.color : '#EF4444';
      if (!map[name]) map[name] = { name, amount: 0, color };
      map[name].amount += tx.amount;
    });
    return Object.values(map);
  }, [lossTxs, categories]);

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card Investimentos */}
        <div className="p-5 rounded-2xl bg-white border border-indigo-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Aportes Realizados</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalInvested)}</p>
          <p className="text-xs text-slate-500 mt-1">
            {investmentTxs.length} aporte(s) registrados no período
          </p>
        </div>

        {/* Card Prejuízos */}
        <div className="p-5 rounded-2xl bg-white border border-amber-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Prejuízos & Sangrias</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalLosses)}</p>
          <p className="text-xs text-slate-500 mt-1">
            {lossTxs.length} evento(s) de prejuízo no período
          </p>
        </div>

        {/* Balanço Estratégico */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Eficiência de Capital</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {totalInvested > 0 ? `${((totalInvested / (totalInvested + totalLosses)) * 100).toFixed(0)}%` : '100%'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Taxa de capital retido vs perdido</p>
        </div>
      </div>

      {/* Grid de 2 Colunas: Alocação de Investimentos vs Diagnóstico de Prejuízos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lado 1: Investimentos */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Alocação de Investimentos
              </h3>
              <p className="text-xs text-slate-500">Distribuição dos aportes por classe de ativos</p>
            </div>
          </div>

          {investmentByCategory.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Nenhum aporte registrado neste mês.</p>
          ) : (
            <div className="space-y-3">
              {investmentByCategory.map((item, idx) => {
                const percent = totalInvested > 0 ? (item.amount / totalInvested) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="flex items-center gap-2 text-slate-800">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.name}
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(item.amount)} ({percent.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-700 mb-2">Últimos Aportes Realizados</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {investmentTxs.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs">
                  <div>
                    <p className="font-medium text-slate-900">{tx.description}</p>
                    <p className="text-[10px] text-slate-500">{formatDate(tx.date)}</p>
                  </div>
                  <span className="font-bold text-indigo-600">{formatCurrency(tx.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lado 2: Gestão de Prejuízos */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                Painel de Controle de Prejuízos
              </h3>
              <p className="text-xs text-slate-500">Monitoramento e estancamento de sangrias financeiras</p>
            </div>
          </div>

          {lossByCategory.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-xs font-semibold text-slate-700">Parabéns! Nenhuma sangria ou prejuízo.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Seu capital permaneceu protegido neste período.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lossByCategory.map((item, idx) => {
                const percent = totalLosses > 0 ? (item.amount / totalLosses) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="flex items-center gap-2 text-slate-800">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.name}
                      </span>
                      <span className="font-bold text-amber-700">
                        {formatCurrency(item.amount)} ({percent.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300 bg-amber-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-700 mb-2">Histórico de Prejuízos Detalhados</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {lossTxs.map((tx) => (
                <div key={tx.id} className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-100 text-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{tx.description}</p>
                    <span className="font-bold text-rose-600">-{formatCurrency(tx.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                    <span>{formatDate(tx.date)}</span>
                    {tx.notes && <span className="italic text-slate-600">{tx.notes}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
