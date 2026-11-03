'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  AlertOctagon, 
  Percent 
} from 'lucide-react';

export function OverviewCards() {
  const { summary } = useFinance();

  const cards = [
    {
      title: 'Saldo em Contas',
      value: formatCurrency(summary.totalBalance),
      subtitle: 'Disponível em bancos & carteira',
      icon: Wallet,
      color: 'emerald',
      bgLight: 'bg-emerald-500/10',
      textColor: 'text-emerald-700',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-200/60',
    },
    {
      title: 'Receitas no Mês',
      value: formatCurrency(summary.monthlyIncome),
      subtitle: 'Salários, freelances & rendas',
      icon: TrendingUp,
      color: 'teal',
      bgLight: 'bg-teal-500/10',
      textColor: 'text-teal-700',
      iconColor: 'text-teal-600',
      borderColor: 'border-teal-200/60',
    },
    {
      title: 'Despesas no Mês',
      value: formatCurrency(summary.monthlyExpense),
      subtitle: 'Gastos fixos & variáveis',
      icon: TrendingDown,
      color: 'rose',
      bgLight: 'bg-rose-500/10',
      textColor: 'text-rose-700',
      iconColor: 'text-rose-600',
      borderColor: 'border-rose-200/60',
    },
    {
      title: 'Investimentos Aportados',
      value: formatCurrency(summary.monthlyInvestments),
      subtitle: 'Renda fixa, ações, reserva & cripto',
      icon: PiggyBank,
      color: 'indigo',
      bgLight: 'bg-indigo-500/10',
      textColor: 'text-indigo-700',
      iconColor: 'text-indigo-600',
      borderColor: 'border-indigo-200/60',
    },
    {
      title: 'Prejuízos & Perdas',
      value: formatCurrency(summary.monthlyLosses),
      subtitle: summary.monthlyLosses > 0 ? 'Trades, juros, multas & imprevistos' : 'Nenhum prejuízo registrado!',
      icon: AlertOctagon,
      color: 'amber',
      bgLight: 'bg-amber-500/10',
      textColor: 'text-amber-700',
      iconColor: 'text-amber-600',
      borderColor: 'border-amber-200/60',
    },
    {
      title: 'Taxa de Poupança',
      value: `${summary.savingsRate.toFixed(1)}%`,
      subtitle: `Sobra líquida: ${formatCurrency(summary.netSavings)}`,
      icon: Percent,
      color: 'blue',
      bgLight: 'bg-blue-500/10',
      textColor: 'text-blue-700',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200/60',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-2xl bg-white border ${card.borderColor} shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500">{card.title}</span>
              <div className={`p-2 rounded-xl ${card.bgLight} ${card.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className={`text-xl sm:text-2xl font-bold tracking-tight text-slate-900`}>
                {card.value}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{card.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
