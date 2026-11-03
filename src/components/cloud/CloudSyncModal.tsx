'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { 
  Cloud, 
  CloudCheck, 
  RefreshCw, 
  Lock, 
  Smartphone, 
  Monitor, 
  X, 
  Check, 
  AlertCircle 
} from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CloudSyncModal({ isOpen, onClose }: CloudSyncModalProps) {
  const { 
    isCloudConnected, 
    cloudVaultId, 
    cloudPin, 
    lastSyncTime, 
    syncStatus, 
    connectCloudVault, 
    disconnectCloudVault, 
    syncWithCloud 
  } = useFinance();

  const [vaultInput, setVaultInput] = useState(cloudVaultId || '');
  const [pinInput, setPinInput] = useState(cloudPin || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultInput.trim()) return;

    setLoading(true);
    setMessage(null);

    const res = await connectCloudVault(vaultInput.trim(), pinInput.trim());
    setLoading(false);

    if (res.success) {
      setMessage({ text: res.message || 'Cofre conectado e sincronizado com sucesso!' });
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setMessage({ text: res.message || 'Erro ao conectar.', error: true });
    }
  };

  const handleForceSync = async () => {
    setLoading(true);
    await syncWithCloud();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">Sincronização em Nuvem</h2>
              <p className="text-[11px] text-slate-500">Conecte todos os seus dispositivos (PC, celular e tablet)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensagem de Feedback */}
        {message && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 ${
              message.error
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {message.error ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
        )}

        {isCloudConnected ? (
          /* MODO CONECTADO */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  Cofre Conectado & Ativo
                </div>
                <span className="text-[11px] text-emerald-700 font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                  {cloudVaultId}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-2">
                Qualquer transação que você lançar aqui é salva automaticamente na nuvem instantaneamente.
              </p>
              {lastSyncTime && (
                <p className="text-[10px] text-slate-400 mt-1">
                  Última sincronização: {new Date(lastSyncTime).toLocaleTimeString('pt-BR')}
                </p>
              )}
            </div>

            {/* Como abrir em outro computador ou celular */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Monitor className="w-4 h-4 text-slate-600" />
                <Smartphone className="w-4 h-4 text-slate-600" />
                <span>Como acessar de outro computador ou celular:</span>
              </div>
              <ol className="list-decimal list-inside text-[11px] text-slate-600 space-y-1">
                <li>Abra o site no outro aparelho.</li>
                <li>Clique em <strong>Nuvem</strong> no topo da tela.</li>
                <li>Digite o nome do seu cofre: <strong className="font-mono text-indigo-700">{cloudVaultId}</strong></li>
                {cloudPin && <li>Digite a sua senha/PIN cadastrada.</li>}
                <li>Pronto! Todos os seus dados serão carregados no mesmo segundo.</li>
              </ol>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Desconectar a nuvem deste computador? Seus dados locais não serão apagados.')) {
                    disconnectCloudVault();
                    onClose();
                  }
                }}
                className="text-xs text-rose-600 hover:underline font-medium"
              >
                Desconectar da Nuvem
              </button>

              <button
                type="button"
                onClick={handleForceSync}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Sincronizando...' : 'Sincronizar Agora'}
              </button>
            </div>
          </div>
        ) : (
          /* MODO DESCONECTADO (CRIAR OU CONECTAR COFRE) */
          <form onSubmit={handleConnect} className="space-y-4">
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-slate-700 space-y-1">
              <p className="font-bold text-indigo-950 flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-indigo-600" />
                Acesse suas finanças de qualquer lugar!
              </p>
              <p className="text-[11px] text-slate-600">
                Escolha um <strong>Identificador do seu Cofre</strong> (ex: seu nome ou apelido). Ao abrir em qualquer outro computador ou celular, basta digitar este mesmo código para ver todos os seus dados.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome / Código do seu Cofre*
              </label>
              <input
                type="text"
                value={vaultInput}
                onChange={(e) => setVaultInput(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="Ex: jhowzeh-financas"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">Apenas letras, números e traços.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Senha ou PIN do Cofre (Opcional)
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Ex: 1234"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Para proteger seu cofre em outros aparelhos.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !vaultInput.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5" />
                    Ativar Sincronização em Nuvem
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
