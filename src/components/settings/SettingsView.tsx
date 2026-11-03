'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { 
  Key, 
  Download, 
  Upload, 
  RotateCcw, 
  Trash2, 
  Check, 
  GitBranch, 
  Globe, 
  ShieldCheck, 
  Cloud,
  Smartphone,
  Monitor,
  RefreshCw
} from 'lucide-react';

export function SettingsView() {
  const { 
    userApiKey, 
    setUserApiKey, 
    exportDataJson, 
    importDataJson, 
    resetToSeedData, 
    clearAllData,
    cloudVaultId,
    cloudPin,
    isCloudConnected,
    connectCloudVault,
    disconnectCloudVault,
    syncWithCloud
  } = useFinance();

  const [apiKeyInput, setApiKeyInput] = useState(userApiKey || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Cloud settings state
  const [vaultNameInput, setVaultNameInput] = useState(cloudVaultId || '');
  const [vaultPinInput, setVaultPinInput] = useState(cloudPin || '');
  const [cloudMsg, setCloudMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [syncing, setSyncing] = useState(false);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    setUserApiKey(apiKeyInput.trim());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleConnectCloud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultNameInput.trim()) return;

    setSyncing(true);
    setCloudMsg(null);
    const res = await connectCloudVault(vaultNameInput.trim(), vaultPinInput.trim());
    setSyncing(false);

    if (res.success) {
      setCloudMsg({ text: res.message || 'Cofre conectado com sucesso!' });
    } else {
      setCloudMsg({ text: res.message || 'Erro ao conectar.', error: true });
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importDataJson(content);
        if (ok) {
          alert('Backup restaurado com sucesso!');
        } else {
          alert('Arquivo de backup inválido.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. SINCRONIZAÇÃO EM NUVEM (MULTI-DISPOSITIVO) */}
      <div className="p-6 bg-white rounded-2xl border border-indigo-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Sincronização em Nuvem (Multi-Dispositivo)</h3>
            <p className="text-xs text-slate-500">
              Mantenha seus dados 100% conectados e atualizados em tempo real entre computadores, celulares e tablets
            </p>
          </div>
        </div>

        {cloudMsg && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold ${
              cloudMsg.error ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {cloudMsg.text}
          </div>
        )}

        {isCloudConnected ? (
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Cofre Ativo e Conectado: <strong className="font-mono text-emerald-700">{cloudVaultId}</strong>
                </span>
                <p className="text-[11px] text-slate-600 mt-1">
                  Para abrir em outro computador ou no celular: basta acessar o site, clicar em &quot;Nuvem&quot; e digitar <strong>{cloudVaultId}</strong>.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setSyncing(true);
                    await syncWithCloud();
                    setSyncing(false);
                    alert('Sincronizado com a nuvem com sucesso!');
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  Sincronizar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Desconectar a nuvem deste computador?')) disconnectCloudVault();
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  Desconectar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConnectCloud} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Identificador / Nome do Cofre
                </label>
                <input
                  type="text"
                  value={vaultNameInput}
                  onChange={(e) => setVaultNameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="Ex: jhowzeh"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Senha / PIN (Opcional)
                </label>
                <input
                  type="password"
                  value={vaultPinInput}
                  onChange={(e) => setVaultPinInput(e.target.value)}
                  placeholder="Ex: 1234"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={syncing || !vaultNameInput.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Cloud className="w-4 h-4" />
              {syncing ? 'Conectando...' : 'Conectar e Ativar Nuvem'}
            </button>
          </form>
        )}
      </div>

      {/* 2. CHAVE DE INTELIGÊNCIA ARTIFICIAL */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Inteligência Artificial (Google Gemini)</h3>
            <p className="text-xs text-slate-500">
              Chave de API para processamento avançado de faturas complexas em PDF e fotos de comprovantes
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveKey} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Gemini API Key (Opcional - caso queira usar chave própria)
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
              >
                {saveSuccess ? <Check className="w-4 h-4" /> : 'Salvar Chave'}
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Privacidade & Robustez
            </p>
            <p>
              Sua chave fica gravada apenas no seu navegador. Caso não possua chave, o FinControl utiliza o motor de processamento heurístico local integrado sem custos.
            </p>
            <p>
              Obtenha uma chave gratuita em:{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 underline font-semibold"
              >
                Google AI Studio (aistudio.google.com)
              </a>
            </p>
          </div>
        </form>
      </div>

      {/* 3. BACKUP E RESTAURAÇÃO DE DADOS */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Backup & Portabilidade de Dados</h3>
          <p className="text-xs text-slate-500">
            Você é o único dono dos seus dados financeiros. Exporte ou restaure suas informações a qualquer momento.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
            <div>
              <p className="text-xs font-bold text-slate-800">Exportar Backup Completo</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Baixa um arquivo JSON seguro com todos os seus lançamentos, contas, cartões e categorias.
              </p>
            </div>
            <button
              onClick={exportDataJson}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-xs transition-colors"
            >
              <Download className="w-4 h-4 text-slate-600" />
              Baixar Arquivo JSON
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
            <div>
              <p className="text-xs font-bold text-slate-800">Restaurar Backup</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Carregue um arquivo JSON gerado anteriormente para restaurar todas as informações.
              </p>
            </div>
            <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-xs transition-colors cursor-pointer">
              <Upload className="w-4 h-4 text-slate-600" />
              Selecionar Arquivo JSON
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* 4. GERENCIAMENTO DE DADOS */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Ações do Sistema</h3>
          <p className="text-xs text-slate-500">Restauração de exemplos ou reinicialização</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              if (confirm('Deseja recarregar os dados de demonstração?')) {
                resetToSeedData();
                alert('Dados de exemplo restaurados.');
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar Dados de Demonstração
          </button>

          <button
            onClick={() => {
              if (confirm('Tem certeza que deseja zerar todos os seus dados? Esta ação não pode ser desfeita sem backup.')) {
                clearAllData();
                alert('Todos os dados foram apagados.');
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Zerar Todos os Dados
          </button>
        </div>
      </div>
    </div>
  );
}
