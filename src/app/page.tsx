'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { NavigationTabs, TabType } from '@/components/layout/NavigationTabs';
import { OverviewCards } from '@/components/dashboard/OverviewCards';
import { CashFlowChart } from '@/components/dashboard/CashFlowChart';
import { CategoryBreakdownChart } from '@/components/dashboard/CategoryBreakdownChart';
import { UpcomingBills } from '@/components/dashboard/UpcomingBills';
import { TransactionList } from '@/components/transactions/TransactionList';
import { TransactionModal } from '@/components/transactions/TransactionModal';
import { InvestmentsAndLossesView } from '@/components/investments/InvestmentsAndLossesView';
import { CardsAndAccountsView } from '@/components/cards/CardsAndAccountsView';
import { BudgetsView } from '@/components/budgets/BudgetsView';
import { AiImportView } from '@/components/ai/AiImportView';
import { SettingsView } from '@/components/settings/SettingsView';
import { CloudSyncModal } from '@/components/cloud/CloudSyncModal';
import { Transaction } from '@/types/finance';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleOpenNewTransaction = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  const handleOpenAiImport = () => {
    setActiveTab('ai-importer');
  };

  const handleOpenCloudSync = () => {
    setIsCloudModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70">
      {/* Top Header */}
      <Header
        onOpenNewTransaction={handleOpenNewTransaction}
        onOpenAiImport={handleOpenAiImport}
        onOpenCloudSync={handleOpenCloudSync}
      />

      {/* Navegação por Abas */}
      <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* ABA 1: VISÃO GERAL (DASHBOARD) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Banner Rápido de IA */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-indigo-300 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold">Importação Automática com IA Ativa</h2>
                  <p className="text-xs text-slate-300">
                    Basta enviar o PDF da fatura ou extrato bancário para classificar gastos em segundos.
                  </p>
                </div>
              </div>
              <button
                onClick={handleOpenAiImport}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 shadow-xs transition-colors shrink-0"
              >
                <span>Importar Extrato</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Indicadores Principais */}
            <OverviewCards />

            {/* Gráficos em Duas Colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CashFlowChart />
              <CategoryBreakdownChart />
            </div>

            {/* Contas a Vencer & Últimos Lançamentos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <UpcomingBills />
              </div>
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">Últimos Lançamentos</h3>
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Ver extrato completo →
                  </button>
                </div>
                <TransactionList onEditTransaction={handleEditTransaction} />
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: LANÇAMENTOS E EXTRATO */}
        {activeTab === 'transactions' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Extrato & Lançamentos</h2>
                <p className="text-xs text-slate-500">Histórico completo de receitas, despesas, investimentos e perdas</p>
              </div>
              <button
                onClick={handleOpenNewTransaction}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all w-fit"
              >
                + Adicionar Lançamento
              </button>
            </div>
            <TransactionList onEditTransaction={handleEditTransaction} />
          </div>
        )}

        {/* ABA 3: INVESTIMENTOS & PREJUÍZOS */}
        {activeTab === 'investments' && (
          <div className="animate-in fade-in duration-150">
            <InvestmentsAndLossesView />
          </div>
        )}

        {/* ABA 4: CONTAS & CARTÕES */}
        {activeTab === 'cards' && (
          <div className="animate-in fade-in duration-150">
            <CardsAndAccountsView />
          </div>
        )}

        {/* ABA 5: ORÇAMENTOS & METAS */}
        {activeTab === 'budgets' && (
          <div className="animate-in fade-in duration-150">
            <BudgetsView />
          </div>
        )}

        {/* ABA 6: IMPORTADOR INTELIGENTE IA */}
        {activeTab === 'ai-importer' && (
          <div className="animate-in fade-in duration-150">
            <AiImportView onSuccessRedirect={() => setActiveTab('transactions')} />
          </div>
        )}

        {/* ABA 7: CONFIGURAÇÕES & BACKUP */}
        {activeTab === 'settings' && (
          <div className="animate-in fade-in duration-150">
            <SettingsView />
          </div>
        )}
      </main>

      {/* Modal de Nova/Editar Transação */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transactionToEdit={editingTransaction}
      />

      {/* Modal de Sincronização em Nuvem (Multi-Dispositivo) */}
      <CloudSyncModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
      />
    </div>
  );
}
