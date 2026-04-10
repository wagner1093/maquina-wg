import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, AlertCircle, Sparkles, FileText, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Hospedagem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showAdd, setShowAdd] = useState(false);
  const [nome, setNome] = useState('');
  const [site, setSite] = useState('');
  const [plano, setPlano] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [valor, setValor] = useState('');

  // Proposal State
  const [showProposal, setShowProposal] = useState(false);
  const [pNome, setPNome] = useState('');
  const [pValor, setPValor] = useState('');
  const [creatingProposal, setCreatingProposal] = useState(false);

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

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pNome || !pValor) return;

    setCreatingProposal(true);
    const content = `# Proposta de Infraestrutura e Hospedagem de Elite

Preparado exclusivamente para: **${pNome}**

---

## 🚀 O Diferencial: Infraestrutura de Ultra Alta Performance
Sua presença digital merece mais do que apenas um espaço em disco. Desenvolvemos uma solução focada em **vendas e conversão**, garantindo que seu site carregue instantaneamente.

- **Armazenamento NVMe de Última Geração (50GB):** Até 10x mais rápido que SSDs comuns. Seu site voa, o Google ama e seus clientes ficam satisfeitos.
- **Escalabilidade Ilimitada:** Capacidade para gerenciar até **50 sites** sob o mesmo painel profissional.
- **Ecossistema Node.js Gerenciado:** Suporte para 5 aplicações web avançadas, permitindo ferramentas personalizadas e robôs.

## 🤖 Bônus: Aceleração por Inteligência Artificial (Incluso)
Não apenas hospedamos; entregamos ferramentas para você dominar o mercado em tempo recorde.
- **Construtor de Sites com IA (30 Créditos):** Crie landing pages profissionais em minutos, não semanas.
- **Agente IA para WordPress:** Automação total de conteúdo e otimização SEO dentro do seu site.
- **WordPress Multisite:** Gerenciamento simplificado de redes de sites em um único ambiente.

## 🛡️ Segurança e Paz de Espírito
- **Seguro de Dados:** Backups diários e sob demanda. Nunca perca um byte de informação.
- **Comunicação Profissional:** 5 caixas de e-mail empresariais por site (Grátis por 1 ano).
- **Proteção Total:** Certificado SSL em todos os domínios e CDN global inclusa para velocidade máxima em qualquer lugar do mundo.

---

## 💰 Investimento
Focamos em valor entregue, não apenas em custo de servidor.

**Valor do Plano Premium:** R$ ${parseFloat(pValor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / mês

---

*Esta proposta garante exclusividade de recursos e suporte técnico prioritário para a expansão do seu ecossistema digital.*`;

    const { error } = await supabase.from('maquinawg_propostas').insert([{
      user_id: user.id,
      titulo: `Hospedagem Premium — ${pNome}`,
      conteudo: content,
      valor_total: parseFloat(pValor),
      status: 'Rascunho'
    }]);

    setCreatingProposal(false);
    if (!error) {
      if(confirm('Proposta criada com sucesso! Deseja ver na aba de Propostas?')) {
        navigate('/proposals');
      }
      setShowProposal(false);
      setPNome(''); setPValor('');
    } else {
      alert('Erro ao criar proposta: ' + error.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hospedagem</h1>
          <p className="text-gray-500 text-sm mt-1">Gestão de domínios, servidores e alertas de vencimento.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowProposal(true)} className="btn-secondary w-full md:w-auto flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" /> Criar Proposta
          </button>
          <button onClick={() => setShowAdd(!showAdd)} className="btn-primary w-full md:w-auto flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Novo Cliente
          </button>
        </div>
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

      {showProposal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" /> Nova Proposta Pré-definida
              </h2>
              <button onClick={() => setShowProposal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mb-6">
              Esta ação criará uma proposta com o template <strong>Hospedagem Premium</strong> e todos os itens profissionais inclusos.
            </p>

            <form onSubmit={handleCreateProposal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nome do Cliente</label>
                <input required type="text" className="input-field" value={pNome} onChange={e => setPNome(e.target.value)} placeholder="Ex: João Silva" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Valor da Proposta (R$)</label>
                <input required type="number" step="0.01" className="input-field" value={pValor} onChange={e => setPValor(e.target.value)} placeholder="0.00" />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowProposal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={creatingProposal} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {creatingProposal ? 'Criando...' : <><FileText className="w-4 h-4" /> Criar Proposta</>}
                </button>
              </div>
            </form>
          </div>
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
