'use client';

import React, { useMemo, useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function CategoryBreakdownChart() {
  const { filteredTransactions, categories } = useFinance();
  const [filterType, setFilterType] = useState<'expense' | 'investment' | 'loss'>('expense');

  // Agrupar gastos por categoria
  const categoryData = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string }> = {};

    filteredTransactions
      .filter((tx) => tx.type === filterType && tx.status === 'completed')
      .forEach((tx) => {
        const cat = categories.find((c) => c.id === tx.categoryId);
        const catName = cat ? cat.name : 'Outros';
        const catColor = cat ? cat.color : '#94A3B8';

        if (!map[catName]) {
          map[catName] = { name: catName, value: 0, color: catColor };
        }
        map[catName].value += tx.amount;
      });

    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [filteredTransactions, categories, filterType]);

  const totalValue = useMemo(() => {
    return categoryData.reduce((acc, curr) => acc + curr.value, 0);
  }, [categoryData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percent = totalValue > 0 ? ((data.value / totalValue) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-200 shadow-lg text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            <span className="font-bold text-slate-800">{data.name}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-slate-600">
            <span>{formatCurrency(data.value)}</span>
            <span className="font-semibold text-slate-900">({percent}%)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Distribuição por Categoria</h3>
            <p className="text-xs text-slate-500">Onde seu capital está sendo alocado</p>
          </div>

          {/* Toggle de Tipo */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs">
            <button
              onClick={() => setFilterType('expense')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterType === 'expense' ? 'bg-white shadow-xs text-rose-600 font-semibold' : 'text-slate-600'
              }`}
            >
              Despesas
            </button>
            <button
              onClick={() => setFilterType('investment')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterType === 'investment' ? 'bg-white shadow-xs text-indigo-600 font-semibold' : 'text-slate-600'
              }`}
            >
              Aportes
            </button>
            <button
              onClick={() => setFilterType('loss')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterType === 'loss' ? 'bg-white shadow-xs text-amber-600 font-semibold' : 'text-slate-600'
              }`}
            >
              Prejuízos
            </button>
          </div>
        </div>

        {categoryData.length === 0 ? (
          <div className="h-[230px] flex flex-col items-center justify-center text-center text-slate-400">
            <p className="text-xs">Nenhum lançamento encontrado para este filtro.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
            <div className="h-[210px] w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Total</span>
                <span className="text-xs font-bold text-slate-800">{formatCurrency(totalValue)}</span>
              </div>
            </div>

            {/* Lista com as 5 principais categorias */}
            <div className="space-y-2 max-h-[210px] overflow-y-auto pr-1">
              {categoryData.slice(0, 5).map((item, idx) => {
                const percent = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(0) : 0;
                return (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-none">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate text-slate-700 font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold text-slate-900">{formatCurrency(item.value)}</span>
                      <span className="text-slate-400 text-[10px] w-8 text-right font-medium">{percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
