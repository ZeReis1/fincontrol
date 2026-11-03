'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  Transaction,
  Account,
  CreditCard,
  Category,
  Budget,
  FinancialSummary,
  AiParsedTransaction,
} from '@/types/finance';
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_CATEGORIES,
  DEFAULT_CREDIT_CARDS,
  SEED_TRANSACTIONS,
} from '@/lib/constants';
import { generateId } from '@/lib/utils';

interface FinanceContextType {
  transactions: Transaction[];
  accounts: Account[];
  creditCards: CreditCard[];
  categories: Category[];
  budgets: Budget[];
  selectedMonth: string; // YYYY-MM ou 'all'
  setSelectedMonth: (month: string) => void;
  filteredTransactions: Transaction[];
  summary: FinancialSummary;
  userApiKey: string;
  setUserApiKey: (key: string) => void;

  // Sincronização em Nuvem (Multi-Dispositivo)
  cloudVaultId: string;
  cloudPin: string;
  isCloudConnected: boolean;
  lastSyncTime: string | null;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  connectCloudVault: (vaultId: string, pin?: string) => Promise<{ success: boolean; message?: string }>;
  disconnectCloudVault: () => void;
  syncWithCloud: () => Promise<void>;

  // Ações de Transações
  addTransaction: (data: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addBatchAiTransactions: (
    items: AiParsedTransaction[],
    targetAccountId?: string,
    targetCardId?: string
  ) => void;

  // Ações de Contas & Cartões
  addAccount: (data: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, data: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  addCreditCard: (data: Omit<CreditCard, 'id'>) => void;
  updateCreditCard: (id: string, data: Partial<CreditCard>) => void;
  deleteCreditCard: (id: string) => void;

  // Ações de Categorias & Orçamentos
  addCategory: (data: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, data: Partial<Category>) => void;
  setCategoryBudget: (categoryId: string, limit: number) => void;

  // Backup & Restauração
  exportDataJson: () => void;
  importDataJson: (jsonData: string) => boolean;
  resetToSeedData: () => void;
  clearAllData: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEY = 'fincontrol_data_v1';
const API_KEY_STORAGE = 'fincontrol_gemini_key';
const CLOUD_VAULT_KEY = 'fincontrol_cloud_vault_id';
const CLOUD_PIN_KEY = 'fincontrol_cloud_pin';
const CLOUD_LAST_SYNC_KEY = 'fincontrol_last_sync_time';

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');
  const [userApiKey, setUserApiKeyState] = useState<string>('');

  // Nuvem Multi-Dispositivo
  const [cloudVaultId, setCloudVaultId] = useState<string>('');
  const [cloudPin, setCloudPin] = useState<string>('');
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar dados salvos ou inicializar com SEED
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const storedKey = localStorage.getItem(API_KEY_STORAGE);
      const storedVaultId = localStorage.getItem(CLOUD_VAULT_KEY);
      const storedPin = localStorage.getItem(CLOUD_PIN_KEY);
      const storedLastSync = localStorage.getItem(CLOUD_LAST_SYNC_KEY);

      if (storedKey) {
        setUserApiKeyState(storedKey);
      }

      if (storedVaultId) {
        setCloudVaultId(storedVaultId);
        setCloudPin(storedPin || '');
        setIsCloudConnected(true);
        setLastSyncTime(storedLastSync);
      }

      if (stored) {
        const parsed = JSON.parse(stored);
        setTransactions(parsed.transactions || []);
        setAccounts(parsed.accounts || DEFAULT_ACCOUNTS);
        setCreditCards(parsed.creditCards || DEFAULT_CREDIT_CARDS);
        setCategories(parsed.categories || DEFAULT_CATEGORIES);
        setBudgets(parsed.budgets || []);
      } else {
        // Inicializar com dados ricos de demonstração
        setTransactions(SEED_TRANSACTIONS);
        setAccounts(DEFAULT_ACCOUNTS);
        setCreditCards(DEFAULT_CREDIT_CARDS);
        setCategories(DEFAULT_CATEGORIES);
      }

      // Se já possui cofre na nuvem configurado, puxar a versão mais recente da nuvem imediatamente
      if (storedVaultId) {
        fetch('/api/cloud/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'pull',
            vaultId: storedVaultId,
            pin: storedPin || '',
          }),
        })
          .then((res) => res.json())
          .then((cloudData) => {
            if (cloudData.success && cloudData.data) {
              const d = cloudData.data;
              if (Array.isArray(d.transactions)) setTransactions(d.transactions);
              if (Array.isArray(d.accounts)) setAccounts(d.accounts);
              if (Array.isArray(d.creditCards)) setCreditCards(d.creditCards);
              if (Array.isArray(d.categories)) setCategories(d.categories);
              if (Array.isArray(d.budgets)) setBudgets(d.budgets);
              setLastSyncTime(cloudData.updatedAt || new Date().toISOString());
              setSyncStatus('synced');
            }
          })
          .catch((err) => {
            console.warn('Falha no auto-pull da nuvem:', err);
          });
      }
    } catch (e) {
      console.error('Erro ao ler dados do localStorage:', e);
      setTransactions(SEED_TRANSACTIONS);
      setAccounts(DEFAULT_ACCOUNTS);
      setCreditCards(DEFAULT_CREDIT_CARDS);
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setIsLoaded(true);
      if (typeof window !== 'undefined' && navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().catch(() => {});
      }
    }
  }, []);

  // Salvar no localStorage sempre que houver alteração
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const dataToSave = {
        transactions,
        accounts,
        creditCards,
        categories,
        budgets,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));

      // Se a nuvem estiver conectada, sincronizar automaticamente (debounced)
      if (isCloudConnected && cloudVaultId) {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        setSyncStatus('syncing');

        syncTimeoutRef.current = setTimeout(() => {
          fetch('/api/cloud/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'push',
              vaultId: cloudVaultId,
              pin: cloudPin,
              data: dataToSave,
            }),
          })
            .then((res) => res.json())
            .then((resData) => {
              if (resData.success) {
                const now = resData.updatedAt || new Date().toISOString();
                setLastSyncTime(now);
                setSyncStatus('synced');
                localStorage.setItem(CLOUD_LAST_SYNC_KEY, now);
              } else {
                setSyncStatus('error');
              }
            })
            .catch(() => setSyncStatus('error'));
        }, 1500);
      }
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
    }
  }, [transactions, accounts, creditCards, categories, budgets, isLoaded, isCloudConnected, cloudVaultId, cloudPin]);

  const setUserApiKey = (key: string) => {
    setUserApiKeyState(key);
    try {
      localStorage.setItem(API_KEY_STORAGE, key);
    } catch (e) {
      console.error(e);
    }
  };

  // Conectar a um cofre na nuvem existente ou criar novo
  const connectCloudVault = async (vaultId: string, pin: string = ''): Promise<{ success: boolean; message?: string }> => {
    try {
      setSyncStatus('syncing');
      const cleanId = vaultId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');

      // Tenta fazer pull
      const pullRes = await fetch('/api/cloud/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pull', vaultId: cleanId, pin }),
      });

      const pullJson = await pullRes.json();

      if (pullJson.success && pullJson.data) {
        // Encontrou cofre na nuvem: carregar dados
        const d = pullJson.data;
        if (Array.isArray(d.transactions)) setTransactions(d.transactions);
        if (Array.isArray(d.accounts)) setAccounts(d.accounts);
        if (Array.isArray(d.creditCards)) setCreditCards(d.creditCards);
        if (Array.isArray(d.categories)) setCategories(d.categories);
        if (Array.isArray(d.budgets)) setBudgets(d.budgets);

        setCloudVaultId(cleanId);
        setCloudPin(pin);
        setIsCloudConnected(true);
        setLastSyncTime(pullJson.updatedAt);
        setSyncStatus('synced');

        localStorage.setItem(CLOUD_VAULT_KEY, cleanId);
        localStorage.setItem(CLOUD_PIN_KEY, pin);
        localStorage.setItem(CLOUD_LAST_SYNC_KEY, pullJson.updatedAt);

        return { success: true, message: 'Cofre conectado e dados sincronizados com sucesso!' };
      }

      if (pullJson.invalidPin) {
        setSyncStatus('error');
        return { success: false, message: 'Senha/PIN incorreto para este cofre.' };
      }

      // Se não encontrou, cria o cofre na nuvem com os dados atuais
      const currentData = {
        transactions,
        accounts,
        creditCards,
        categories,
        budgets,
      };

      const pushRes = await fetch('/api/cloud/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'push', vaultId: cleanId, pin, data: currentData }),
      });

      const pushJson = await pushRes.json();

      if (pushJson.success) {
        setCloudVaultId(cleanId);
        setCloudPin(pin);
        setIsCloudConnected(true);
        setLastSyncTime(pushJson.updatedAt);
        setSyncStatus('synced');

        localStorage.setItem(CLOUD_VAULT_KEY, cleanId);
        localStorage.setItem(CLOUD_PIN_KEY, pin);
        localStorage.setItem(CLOUD_LAST_SYNC_KEY, pushJson.updatedAt);

        return { success: true, message: 'Novo cofre em nuvem criado e sincronizado com sucesso!' };
      }

      setSyncStatus('error');
      return { success: false, message: pushJson.error || 'Falha ao conectar cofre.' };
    } catch (err: any) {
      setSyncStatus('error');
      return { success: false, message: err.message || 'Erro de conexão.' };
    }
  };

  const disconnectCloudVault = () => {
    setIsCloudConnected(false);
    setCloudVaultId('');
    setCloudPin('');
    setSyncStatus('idle');
    localStorage.removeItem(CLOUD_VAULT_KEY);
    localStorage.removeItem(CLOUD_PIN_KEY);
    localStorage.removeItem(CLOUD_LAST_SYNC_KEY);
  };

  const syncWithCloud = async () => {
    if (!cloudVaultId) return;
    setSyncStatus('syncing');
    try {
      const dataToSave = {
        transactions,
        accounts,
        creditCards,
        categories,
        budgets,
      };

      const res = await fetch('/api/cloud/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'push',
          vaultId: cloudVaultId,
          pin: cloudPin,
          data: dataToSave,
        }),
      });

      const resJson = await res.json();
      if (resJson.success) {
        const now = resJson.updatedAt || new Date().toISOString();
        setLastSyncTime(now);
        setSyncStatus('synced');
        localStorage.setItem(CLOUD_LAST_SYNC_KEY, now);
      } else {
        setSyncStatus('error');
      }
    } catch (e) {
      setSyncStatus('error');
    }
  };

  // Filtrar transações pelo mês selecionado
  const filteredTransactions = useMemo(() => {
    if (selectedMonth === 'all') {
      return [...transactions].sort((a, b) => b.date.localeCompare(a.date));
    }
    return transactions
      .filter((tx) => tx.date.startsWith(selectedMonth))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, selectedMonth]);

  // Cálculo de resumo financeiro do período
  const summary: FinancialSummary = useMemo(() => {
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    let monthlyInvestments = 0;
    let monthlyLosses = 0;

    filteredTransactions.forEach((tx) => {
      if (tx.status === 'completed') {
        if (tx.type === 'income') monthlyIncome += tx.amount;
        else if (tx.type === 'expense') monthlyExpense += tx.amount;
        else if (tx.type === 'investment') monthlyInvestments += tx.amount;
        else if (tx.type === 'loss') monthlyLosses += tx.amount;
      }
    });

    const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
    const netSavings = monthlyIncome - (monthlyExpense + monthlyLosses);
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpense - monthlyLosses) / monthlyIncome) * 100 : 0;

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      monthlyInvestments,
      monthlyLosses,
      netSavings,
      savingsRate: Math.max(0, savingsRate),
    };
  }, [filteredTransactions, accounts]);

  // Transações CRUD
  const addTransaction = (data: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...data,
      id: generateId(),
    };

    setTransactions((prev) => [newTx, ...prev]);

    if (newTx.status === 'completed') {
      if (newTx.accountId) {
        setAccounts((prev) =>
          prev.map((acc) => {
            if (acc.id !== newTx.accountId) return acc;
            let diff = 0;
            if (newTx.type === 'income') diff = newTx.amount;
            else if (newTx.type === 'expense' || newTx.type === 'investment' || newTx.type === 'loss') diff = -newTx.amount;
            return { ...acc, balance: acc.balance + diff };
          })
        );
      }
      if (newTx.creditCardId) {
        setCreditCards((prev) =>
          prev.map((card) => {
            if (card.id !== newTx.creditCardId) return card;
            return { ...card, availableLimit: Math.max(0, card.availableLimit - newTx.amount) };
          })
        );
      }
    }
  };

  const updateTransaction = (id: string, data: Partial<Transaction>) => {
    setTransactions((prev) => prev.map((tx) => (tx.id === id ? { ...tx, ...data } : tx)));
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  const addBatchAiTransactions = (
    items: AiParsedTransaction[],
    targetAccountId?: string,
    targetCardId?: string
  ) => {
    const newTransactions: Transaction[] = items
      .filter((item) => item.selected)
      .map((item) => ({
        id: generateId(),
        date: item.date,
        description: item.description,
        amount: item.amount,
        type: item.type,
        categoryId: item.categoryId || 'cat_outros_gastos',
        accountId: targetAccountId || (targetCardId ? undefined : accounts[0]?.id),
        creditCardId: targetCardId,
        paymentMethod: targetCardId ? 'credit_card' : 'pix',
        status: 'completed',
        aiExtracted: true,
      }));

    if (newTransactions.length === 0) return;

    setTransactions((prev) => [...newTransactions, ...prev]);

    if (targetAccountId) {
      const netAmount = newTransactions.reduce((acc, tx) => {
        if (tx.type === 'income') return acc + tx.amount;
        return acc - tx.amount;
      }, 0);

      setAccounts((prev) =>
        prev.map((a) => (a.id === targetAccountId ? { ...a, balance: a.balance + netAmount } : a))
      );
    }
  };

  // Contas & Cartões CRUD
  const addAccount = (data: Omit<Account, 'id'>) => {
    setAccounts((prev) => [...prev, { ...data, id: generateId() }]);
  };

  const updateAccount = (id: string, data: Partial<Account>) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
  };

  const deleteAccount = (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  const addCreditCard = (data: Omit<CreditCard, 'id'>) => {
    setCreditCards((prev) => [...prev, { ...data, id: generateId() }]);
  };

  const updateCreditCard = (id: string, data: Partial<CreditCard>) => {
    setCreditCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  };

  const deleteCreditCard = (id: string) => {
    setCreditCards((prev) => prev.filter((c) => c.id !== id));
  };

  // Categorias & Orçamentos
  const addCategory = (data: Omit<Category, 'id'>) => {
    setCategories((prev) => [...prev, { ...data, id: generateId() }]);
  };

  const updateCategory = (id: string, data: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  };

  const setCategoryBudget = (categoryId: string, limit: number) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, budgetLimit: limit } : c))
    );
  };

  // Backup & Restauração
  const exportDataJson = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      transactions,
      accounts,
      creditCards,
      categories,
      budgets,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fincontrol_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDataJson = (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      if (Array.isArray(data.transactions)) setTransactions(data.transactions);
      if (Array.isArray(data.accounts)) setAccounts(data.accounts);
      if (Array.isArray(data.creditCards)) setCreditCards(data.creditCards);
      if (Array.isArray(data.categories)) setCategories(data.categories);
      if (Array.isArray(data.budgets)) setBudgets(data.budgets);
      return true;
    } catch (e) {
      console.error('Erro ao importar JSON:', e);
      return false;
    }
  };

  const resetToSeedData = () => {
    setTransactions(SEED_TRANSACTIONS);
    setAccounts(DEFAULT_ACCOUNTS);
    setCreditCards(DEFAULT_CREDIT_CARDS);
    setCategories(DEFAULT_CATEGORIES);
  };

  const clearAllData = () => {
    setTransactions([]);
    setAccounts([]);
    setCreditCards([]);
    setCategories(DEFAULT_CATEGORIES);
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        accounts,
        creditCards,
        categories,
        budgets,
        selectedMonth,
        setSelectedMonth,
        filteredTransactions,
        summary,
        userApiKey,
        setUserApiKey,
        cloudVaultId,
        cloudPin,
        isCloudConnected,
        lastSyncTime,
        syncStatus,
        connectCloudVault,
        disconnectCloudVault,
        syncWithCloud,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addBatchAiTransactions,
        addAccount,
        updateAccount,
        deleteAccount,
        addCreditCard,
        updateCreditCard,
        deleteCreditCard,
        addCategory,
        updateCategory,
        setCategoryBudget,
        exportDataJson,
        importDataJson,
        resetToSeedData,
        clearAllData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance deve ser usado dentro de um FinanceProvider');
  }
  return context;
}
