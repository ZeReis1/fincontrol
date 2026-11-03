'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { 
  Sparkles, 
  Plus, 
  Wallet, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Cloud,
  RefreshCw
} from 'lucide-react';

interface HeaderProps {
  onOpenNewTransaction: () => void;
  onOpenAiImport: () => void;
  onOpenCloudSync: () => void;
}

export function Header({ onOpenNewTransaction, onOpenAiImport, onOpenCloudSync }: HeaderProps) {
  const { selectedMonth, setSelectedMonth, summary, isCloudConnected, cloudVaultId, syncStatus } = useFinance();

  const months = [
    { value: '2026-11', label: 'Novembro 2026' },
    { value: '2026-10', label: 'Outubro 2026' },
    { value: '2026-09', label: 'Setembro 2026' },
    { value: '2026-08', label: 'Agosto 2026' },
    { value: 'all', label: 'Todos os Meses' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Logo & Marca */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/10">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">FinControl</span>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full border border-emerald-200">
                  IA & Cloud
                </span>
              </div>
              <p className="text-xs text-slate-500">Gestão Financeira & Controle Patrimonial</p>
            </div>
          </div>

          {/* Botões Mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onOpenCloudSync}
              className={`p-2 rounded-lg border ${
                isCloudConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}
              title="Sincronização em Nuvem"
            >
              <Cloud className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenAiImport}
              className="p-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
              title="Importar com IA"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </button>
            <button
              onClick={onOpenNewTransaction}
              className="p-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
              title="Novo Lançamento"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Centro / Direita: Seletor de Período & Ações Rápidas */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3">
          {/* Botão de Nuvem (Desktop) */}
          <button
            onClick={onOpenCloudSync}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isCloudConnected
                ? 'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 border-emerald-200/80 shadow-xs'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200/80'
            }`}
          >
            {isCloudConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span className="max-w-[120px] truncate">{cloudVaultId}</span>
                {syncStatus === 'syncing' && <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />}
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5 text-indigo-600" />
                <span>Conectar Nuvem (Multi-Dispositivo)</span>
              </>
            )}
          </button>

          {/* Seletor de Mês */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs text-slate-700 hover:border-slate-300 transition-colors">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Mini Indicador de Saldo Líquido do Mês */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
            <span className="text-slate-500">Saldo no Mês:</span>
            <span
              className={`font-semibold flex items-center gap-0.5 ${
                summary.netSavings >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {summary.netSavings >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              {formatCurrency(summary.netSavings)}
            </span>
          </div>

          {/* Botões de Ação Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={onOpenAiImport}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200/80 hover:border-indigo-300 hover:shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
              Importar com IA
            </button>

            <button
              onClick={onOpenNewTransaction}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-sm hover:shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              Nova Transação
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
