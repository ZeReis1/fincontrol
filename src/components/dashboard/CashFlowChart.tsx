'use client';

import React, { useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export function CashFlowChart() {
  const { transactions } = useFinance();

  // Agrupar dados por mês dos últimos 5 meses
  const chartData = useMemo(() => {
    const monthsMap: Record<string, { month: string; receitas: number; despesas: number; investimentos: number; prejuizos: number }> = {};

    // Inicializar meses recentes
    const monthsOrder = ['2026-07', '2026-08', '2026-09', '2026-10', '2026-11'];
    const monthNames: Record<string, string> = {
      '2026-07': 'Jul',
      '2026-08': 'Ago',
      '2026-09': 'Set',
      '2026-10': 'Out',
      '2026-11': 'Nov',
    };

    monthsOrder.forEach((m) => {
      monthsMap[m] = {
        month: monthNames[m] || m,
        receitas: 0,
        despesas: 0,
        investimentos: 0,
        prejuizos: 0,
      };
    });

    // Somar transações
    transactions.forEach((tx) => {
      const txMonth = tx.date.substring(0, 7);
      if (monthsMap[txMonth] && tx.status === 'completed') {
        if (tx.type === 'income') monthsMap[txMonth].receitas += tx.amount;
        else if (tx.type === 'expense') monthsMap[txMonth].despesas += tx.amount;
        else if (tx.type === 'investment') monthsMap[txMonth].investimentos += tx.amount;
        else if (tx.type === 'loss') monthsMap[txMonth].prejuizos += tx.amount;
      }
    });

    return monthsOrder.map((m) => monthsMap[m]);
  }, [transactions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-lg text-xs">
          <p className="font-bold text-slate-800 mb-1.5">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-semibold text-slate-900">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">Evolução de Fluxo Financeiro</h3>
          <p className="text-xs text-slate-500">Comparativo mensal de entradas, saídas, aportes e prejuízos</p>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
            <YAxis
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
              iconSize={8}
            />
            <Bar dataKey="receitas" name="Receitas" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="despesas" name="Despesas" fill="#F43F5E" radius={[4, 4, 0, 0]} />
            <Bar dataKey="investimentos" name="Investimentos" fill="#6366F1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="prejuizos" name="Prejuízos" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
