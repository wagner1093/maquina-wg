import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, AlertCircle } from 'lucide-react';

type Hospedagem = {
  id: string;
  nome_cliente: string;
  site_dominio: string;
  plano_hospedagem: string;
  data_vencimento: string;
  valor_cobrado: number;
  status: string;
};

export default function Hosting() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Hospedagem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showAdd, setShowAdd] = useState(false);
  const [nome, setNome] = useState('');
  const [site, setSite] = useState('');
  const [plano, setPlano] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [valor, setValor] = useState('');

  const fetchClientes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('maquinawg_hospedagem_clientes')
      .select('*')
      .eq('user_id', user?.id)
      .order('data_vencimento', { ascending: true });
    
    if (!error && data) {
      setClientes(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClientes();
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const { error } = await supabase.from('maquinawg_hospedagem_clientes').insert([
      {
        user_id: user.id,
        nome_cliente: nome,
        site_dominio: site,
        plano_hospedagem: plano,
        data_inicio: new Date().toISOString().split('T')[0],
        data_vencimento: vencimento,
        valor_cobrado: parseFloat(valor),
        status: 'Ativo'
      }
    ]);

    if (!error) {
      setShowAdd(false);
      setNome(''); setSite(''); setPlano(''); setVencimento(''); setValor('');
      fetchClientes();
    } else {
      alert('Failed to add client: ' + error.message);
    }
  };

  const getStatusColor = (vencimentoDate: string) => {
    const today = new Date();
    const dueDate = new Date(vencimentoDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { color: 'bg-red-100 text-red-700 border-red-200', label: 'Vencido', alert: true };
    if (diffDays <= 7) return { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Crítico', alert: true };
    if (diffDays <= 30) return { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Atenção', alert: false };
    return { color: 'bg-green-100 text-green-700 border-green-200', label: 'OK', alert: false };
  };

  const renovarHospedagem = async (id: string, currentVencimento: string) => {
    // Basic auto-renewal logic for 1 year
    const nextDate = new Date(currentVencimento);
    nextDate.setFullYear(nextDate.getFullYear() + 1);
    const formatted = nextDate.toISOString().split('T')[0];

    const { error } = await supabase.from('maquinawg_hospedagem_clientes')
      .update({ data_vencimento: formatted })
      .eq('id', id);

    if (!error) {
       // Ideally we also log in maquinawg_hospedagem_cobrancas
       fetchClientes();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hospedagem</h1>
          <p className="text-gray-500 text-sm mt-1">Gestão de domínios, servidores e alertas de vencimento.</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary w-full md:w-auto flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Novo Cliente
        </button>
      </header>

      {showAdd && (
        <div className="glass-card p-6 animate-in slide-in-from-top-4">
          <h2 className="text-lg font-semibold mb-4">Adicionar Cliente de Hospedagem</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nome do Cliente</label>
              <input required type="text" className="input-field" value={nome} onChange={e => setNome(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Site / Domínio</label>
              <input required type="text" className="input-field" value={site} onChange={e => setSite(e.target.value)} placeholder="www.site.com.br" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Plano ou Servidor</label>
              <input required type="text" className="input-field" value={plano} onChange={e => setPlano(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Próx. Vencimento</label>
                  <input required type="date" className="input-field" value={vencimento} onChange={e => setVencimento(e.target.value)} />
               </div>
               <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Valor Anual (R$)</label>
                  <input required type="number" step="0.01" className="input-field" value={valor} onChange={e => setValor(e.target.value)} placeholder="0.00" />
               </div>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancelar</button>
              <button type="submit" className="btn-primary">Registrar</button>
            </div>
          </form>
        </div>
      )}

      {/* Hosting List */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/40">
          <h3 className="font-semibold text-appleDark text-sm uppercase tracking-wider">Lista de Vencimentos</h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar domínio..." className="pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-appleBlue text-sm w-48 transition-all" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Cliente / Domínio</th>
                <th className="px-6 py-4 font-medium">Plano</th>
                <th className="px-6 py-4 font-medium">Vencimento</th>
                <th className="px-6 py-4 font-medium">Status do Prazo</th>
                <th className="px-6 py-4 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Carregando...</td></tr>
              ) : clientes.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Nenhuma hospedagem encontrada.</td></tr>
              ) : (
                clientes.map((c) => {
                  const status = getStatusColor(c.data_vencimento);
                  return (
                    <tr key={c.id} className="hover:bg-black/[0.02] transition-colors">
                      <td className="px-6 py-4">
                         <div className="font-medium text-appleDark">[{c.nome_cliente}]</div>
                         <div className="text-appleBlue text-xs">{c.site_dominio}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{c.plano_hospedagem}</td>
                      <td className="px-6 py-4 font-medium">
                        {new Date(c.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold ${status.color}`}>
                          {status.alert && <AlertCircle className="w-3.5 h-3.5"/>}
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                            onClick={() => { if(confirm('Renovar para mais 1 ano?')) renovarHospedagem(c.id, c.data_vencimento) }}
                            className="text-xs font-medium text-appleBlue hover:underline bg-blue-50 px-3 py-1.5 rounded"
                        >
                            Renovar Anuidade +
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
