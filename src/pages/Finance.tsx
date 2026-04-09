import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Plus, Wallet, Search, CheckCircle, Download } from 'lucide-react';
import AIContextPanel from '../components/AIContextPanel';
import { exportFinancePDF } from '../utils/pdfExport';

type Projeto = {
  id: string;
  nome_projeto: string;
  tipo_servico: string;
  valor_mensal: number;
  status_pagamento: string;
  competencia: string;
};

export default function Finance() {
  const { user } = useAuth();
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showAdd, setShowAdd] = useState(false);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('');
  const [valor, setValor] = useState('');
  const [dia, setDia] = useState('');
  const [competencia, setCompetencia] = useState('');

  const fetchProjetos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('maquinawg_financeiro_projetos')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setProjetos(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjetos();
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const { error } = await supabase.from('maquinawg_financeiro_projetos').insert([
      {
        user_id: user.id,
        nome_projeto: nome,
        tipo_servico: tipo,
        valor_mensal: parseFloat(valor),
        dia_vencimento: parseInt(dia, 10),
        competencia: competencia,
        status_pagamento: 'Aguardando'
      }
    ]);

    if (!error) {
      setShowAdd(false);
      setNome(''); setTipo(''); setValor(''); setDia(''); setCompetencia('');
      fetchProjetos();
    } else {
      alert('Failed to add project: ' + error.message);
    }
  };

  const totalReceita = projetos.reduce((acc, p) => acc + Number(p.valor_mensal), 0);
  const totalConfirmado = projetos.filter(p => p.status_pagamento === 'Recebido').reduce((acc, p) => acc + Number(p.valor_mensal), 0);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('maquinawg_financeiro_projetos').update({ status_pagamento: status }).eq('id', id);
    fetchProjetos();
  };

  const handleExportPDF = () => {
    const mes = projetos[0]?.competencia ?? new Date().toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });
    exportFinancePDF(projetos, [], mes);
  };

  const aiContexto = projetos.map(p =>
    `Projeto: ${p.nome_projeto} | Serviço: ${p.tipo_servico} | Valor: R$ ${Number(p.valor_mensal).toFixed(2)} | Status: ${p.status_pagamento}`
  ).join('\n');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-gray-500 text-sm mt-1">Gestão de Receitas e Despesas de Projetos.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportPDF} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" /> Exportar PDF
          </button>
          <button onClick={() => setShowAdd(!showAdd)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Novo Projeto
          </button>
        </div>
      </header>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 border-l-4 border-l-green-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">Receita Mensal Esperada</p>
              <h2 className="text-2xl font-semibold mt-0.5">R$ {totalReceita.toFixed(2).replace('.', ',')}</h2>
            </div>
          </div>
        </div>
        <div className="glass-card p-5 border-l-4 border-l-appleBlue">
           <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-appleBlue" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">Receita Confirmada</p>
              <h2 className="text-2xl font-semibold mt-0.5">R$ {totalConfirmado.toFixed(2).replace('.', ',')}</h2>
            </div>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="glass-card p-6 animate-in slide-in-from-top-4">
          <h2 className="text-lg font-semibold mb-4">Adicionar Novo Projeto</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nome do Cliente/Projeto</label>
              <input required type="text" className="input-field" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Acme Corp" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de Serviço</label>
              <input required type="text" className="input-field" value={tipo} onChange={e => setTipo(e.target.value)} placeholder="Ex: Tráfego Pago" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Valor Mensal (R$)</label>
              <input required type="number" step="0.01" className="input-field" value={valor} onChange={e => setValor(e.target.value)} placeholder="0.00" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Vencimento (Dia)</label>
                  <input required type="number" max="31" min="1" className="input-field" value={dia} onChange={e => setDia(e.target.value)} placeholder="10" />
               </div>
               <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Competência</label>
                  <input required type="text" className="input-field" value={competencia} onChange={e => setCompetencia(e.target.value)} placeholder="04/2026" />
               </div>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancelar</button>
              <button type="submit" className="btn-primary">Registrar</button>
            </div>
          </form>
        </div>
      )}

      {/* Projects List */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/40">
          <h3 className="font-semibold text-appleDark">Meus Projetos</h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar..." className="pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-appleBlue text-sm w-48 transition-all" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Projeto</th>
                <th className="px-6 py-4 font-medium">Serviço</th>
                <th className="px-6 py-4 font-medium">Valor Mensal</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">Carregando...</td></tr>
              ) : projetos.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">Nenhum projeto registrado.</td></tr>
              ) : (
                projetos.map((p) => (
                  <tr key={p.id} className="hover:bg-black/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium text-appleDark">{p.nome_projeto}</td>
                    <td className="px-6 py-4 text-gray-500">{p.tipo_servico}</td>
                    <td className="px-6 py-4 font-medium">R$ {Number(p.valor_mensal).toFixed(2).replace('.', ',')}</td>
                    <td className="px-6 py-4">
                      <select
                        value={p.status_pagamento}
                        onChange={e => updateStatus(p.id, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-appleBlue/30 ${
                          p.status_pagamento === 'Recebido' ? 'bg-green-100 text-green-700' :
                          p.status_pagamento === 'Atrasado' ? 'bg-red-100 text-red-700' :
                          'bg-orange-100 text-orange-700'
                        }`}
                      >
                        <option>Aguardando</option>
                        <option>Recebido</option>
                        <option>Atrasado</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <AIContextPanel
        modulo="Financeiro"
        contextoTexto={`Projetos:\n${aiContexto}\n\nReceita Total Esperada: R$ ${totalReceita.toFixed(2)}\nReceita Confirmada: R$ ${totalConfirmado.toFixed(2)}`}
        promptsSugeridos={[
          'Qual meu lucro líquido estimado para este mês?',
          'Quais clientes estão com pagamento em atraso?',
          'Como posso melhorar meu fluxo de caixa?',
        ]}
      />
    </div>
  );
}
