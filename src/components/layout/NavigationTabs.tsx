'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  TrendingDown, 
  CreditCard, 
  Target, 
  Sparkles, 
  Settings 
} from 'lucide-react';

export type TabType = 'dashboard' | 'transactions' | 'investments' | 'cards' | 'budgets' | 'ai-importer' | 'settings';

interface NavigationTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export function NavigationTabs({ activeTab, setActiveTab }: NavigationTabsProps) {
  const tabs = [
    { id: 'dashboard' as TabType, label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'transactions' as TabType, label: 'Lançamentos', icon: ArrowLeftRight },
    { id: 'investments' as TabType, label: 'Investimentos & Prejuízos', icon: TrendingDown },
    { id: 'cards' as TabType, label: 'Contas & Cartões', icon: CreditCard },
    { id: 'budgets' as TabType, label: 'Orçamentos', icon: Target },
    { id: 'ai-importer' as TabType, label: 'Importador IA', icon: Sparkles, badge: 'Smart' },
    { id: 'settings' as TabType, label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? 'bg-indigo-400 text-slate-950'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
