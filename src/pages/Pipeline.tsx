import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp, Plus, X, ChevronDown, ChevronRight, Trash2,
  DollarSign, Calendar, ArrowRight, User
} from 'lucide-react';

type Lead = {
  id: string;
  nome_lead: string;
  empresa: string | null;
  contato: string | null;
  email: string | null;
  estagio: string;
  valor_estimado: number | null;
  servicos: string[] | null;
  observacoes: string | null;
  proxima_acao: string | null;
  data_proxima_acao: string | null;
  created_at: string;
};

const ESTAGIOS = ['Lead', 'Contato Feito', 'Proposta Enviada', 'Negociacao', 'Fechado', 'Perdido'];

const ESTAGIO_COLORS: Record<string, string> = {
  'Lead': 'bg-gray-100 border-gray-200',
  'Contato Feito': 'bg-blue-50 border-blue-200',
  'Proposta Enviada': 'bg-amber-50 border-amber-200',
  'Negociacao': 'bg-purple-50 border-purple-200',
  'Fechado': 'bg-green-50 border-green-200',
  'Perdido': 'bg-red-50 border-red-200',
};

const ESTAGIO_DOT: Record<string, string> = {
  'Lead': 'bg-gray-400',
  'Contato Feito': 'bg-blue-500',
  'Proposta Enviada': 'bg-amber-500',
  'Negociacao': 'bg-purple-500',
  'Fechado': 'bg-green-500',
  'Perdido': 'bg-red-400',
};

const ESTAGIO_HEADER: Record<string, string> = {
  'Lead': 'bg-gray-200 text-gray-700',
  'Contato Feito': 'bg-blue-100 text-blue-700',
  'Proposta Enviada': 'bg-amber-100 text-amber-700',
  'Negociacao': 'bg-purple-100 text-purple-700',
  'Fechado': 'bg-green-100 text-green-700',
  'Perdido': 'bg-red-100 text-red-700',
};

const SERVICOS_OPCOES = ['Social Media', 'Tráfego Pago', 'Hospedagem', 'Site / Landing Page', 'Consultoria'];

export default function Pipeline() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Form
  const [fNome, setFNome] = useState('');
  const [fEmpresa, setFEmpresa] = useState('');
  const [fContato, setFContato] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fEstagio, setFEstagio] = useState('Lead');
  const [fValor, setFValor] = useState('');
  const [fServicos, setFServicos] = useState<string[]>([]);
  const [fObs, setFObs] = useState('');
  const [fProxAcao, setFProxAcao] = useState('');
  const [fDataAcao, setFDataAcao] = useState('');

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('maquinawg_pipeline').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setLeads(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !fNome) return;
    await supabase.from('maquinawg_pipeline').insert([{
      user_id: user.id, nome_lead: fNome, empresa: fEmpresa || null,
      contato: fContato || null, email: fEmail || null, estagio: fEstagio,
      valor_estimado: fValor ? parseFloat(fValor) : null,
      servicos: fServicos.length ? fServicos : null,
      observacoes: fObs || null, proxima_acao: fProxAcao || null,
      data_proxima_acao: fDataAcao || null,
    }]);
    resetForm();
    setShowAdd(false);
    fetchAll();
  };

  const resetForm = () => {
    setFNome(''); setFEmpresa(''); setFContato(''); setFEmail('');
    setFEstagio('Lead'); setFValor(''); setFServicos([]); setFObs('');
    setFProxAcao(''); setFDataAcao('');
  };

  const moveEstagio = async (id: string, estagio: string) => {
    await supabase.from('maquinawg_pipeline').update({ estagio, updated_at: new Date().toISOString() }).eq('id', id);
    if (selectedLead?.id === id) setSelectedLead({ ...selectedLead, estagio });
    fetchAll();
  };

  const excluirLead = async (id: string) => {
    await supabase.from('maquinawg_pipeline').delete().eq('id', id);
    setSelectedLead(null);
    fetchAll();
  };

  const toggleServico = (s: string) =>
    setFServicos(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const valorTotal = leads.filter(l => l.estagio === 'Fechado').reduce((a, b) => a + (b.valor_estimado ?? 0), 0);
  const valorPipeline = leads.filter(l => !['Fechado', 'Perdido'].includes(l.estagio)).reduce((a, b) => a + (b.valor_estimado ?? 0), 0);

  const nextEstagio = (e: string) => {
    const idx = ESTAGIOS.indexOf(e);
    return idx >= 0 && idx < ESTAGIOS.length - 2 ? ESTAGIOS[idx + 1] : null;
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-appleBlue" /> Pipeline de Vendas
          </h1>
          <p className="text-gray-500 text-sm mt-1">Acompanhe seu funil comercial do primeiro contato ao fechamento.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Lead
        </button>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-4 border-l-4 border-l-gray-400">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Total de Leads</p>
          <p className="text-2xl font-bold mt-1">{leads.length}</p>
        </div>
        <div className="glass-card p-4 border-l-4 border-l-purple-400">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Em Negociação</p>
          <p className="text-2xl font-bold mt-1">{leads.filter(l => l.estagio === 'Negociacao').length}</p>
        </div>
        <div className="glass-card p-4 border-l-4 border-l-green-500">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Valor Fechado</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{fmt(valorTotal)}</p>
        </div>
        <div className="glass-card p-4 border-l-4 border-l-appleBlue">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Pipeline Aberto</p>
          <p className="text-2xl font-bold mt-1 text-appleBlue">{fmt(valorPipeline)}</p>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="py-12 text-center text-gray-400">Carregando...</div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {ESTAGIOS.map(estagio => {
              const estagioLeads = leads.filter(l => l.estagio === estagio);
              const estagioValor = estagioLeads.reduce((a, b) => a + (b.valor_estimado ?? 0), 0);
              return (
                <div key={estagio} className="w-64 flex-shrink-0">
                  {/* Column header */}
                  <div className={`rounded-xl px-3 py-2.5 mb-3 flex items-center justify-between ${ESTAGIO_HEADER[estagio]}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${ESTAGIO_DOT[estagio]}`} />
                      <span className="text-sm font-semibold">{estagio}</span>
                      <span className="text-xs font-normal opacity-70 bg-white/50 px-1.5 py-0.5 rounded-full">{estagioLeads.length}</span>
                    </div>
                    {estagioValor > 0 && (
                      <span className="text-xs font-semibold">{fmt(estagioValor)}</span>
                    )}
                  </div>

                  {/* Cards */}
                  <div className="space-y-3 min-h-[200px]">
                    {estagioLeads.map(lead => (
                      <div
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className={`p-4 rounded-xl border-2 cursor-pointer hover:shadow-md transition-all ${ESTAGIO_COLORS[estagio]}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="font-semibold text-sm text-appleDark leading-tight">{lead.nome_lead}</p>
                            {lead.empresa && <p className="text-xs text-gray-400 mt-0.5">{lead.empresa}</p>}
                          </div>
                          {lead.valor_estimado && (
                            <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex-shrink-0">
                              {fmt(lead.valor_estimado)}
                            </span>
                          )}
                        </div>
                        {lead.servicos?.length ? (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {lead.servicos.slice(0, 2).map(s => (
                              <span key={s} className="text-[10px] bg-white/70 border border-gray-200 px-1.5 py-0.5 rounded-full text-gray-600">{s}</span>
                            ))}
                          </div>
                        ) : null}
                        {lead.proxima_acao && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                            <ArrowRight className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{lead.proxima_acao}</span>
                          </div>
                        )}
                        {nextEstagio(estagio) && (
                          <button
                            onClick={e => { e.stopPropagation(); moveEstagio(lead.id, nextEstagio(estagio)!); }}
                            className="mt-2 w-full text-center text-xs font-medium text-appleBlue bg-white/60 hover:bg-white py-1 rounded-lg transition-colors border border-blue-200"
                          >
                            Mover → {nextEstagio(estagio)}
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      onClick={() => { setFEstagio(estagio); setShowAdd(true); }}
                      className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Add Lead */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="glass-card w-full max-w-xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-semibold text-lg">Novo Lead</h2>
              <button onClick={() => { setShowAdd(false); resetForm(); }} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Nome do Lead *</label>
                  <input type="text" className="input-field" required value={fNome} onChange={e => setFNome(e.target.value)} placeholder="João Silva" />
                </div>
                <div>
                  <label className="label-field">Empresa</label>
                  <input type="text" className="input-field" value={fEmpresa} onChange={e => setFEmpresa(e.target.value)} />
                </div>
                <div>
                  <label className="label-field">WhatsApp / Contato</label>
                  <input type="text" className="input-field" value={fContato} onChange={e => setFContato(e.target.value)} />
                </div>
                <div>
                  <label className="label-field">E-mail</label>
                  <input type="email" className="input-field" value={fEmail} onChange={e => setFEmail(e.target.value)} />
                </div>
                <div>
                  <label className="label-field">Estágio</label>
                  <div className="relative">
                    <select className="input-field appearance-none" value={fEstagio} onChange={e => setFEstagio(e.target.value)}>
                      {ESTAGIOS.map(e => <option key={e}>{e}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="label-field">Valor Estimado (R$)</label>
                  <input type="number" step="0.01" className="input-field" value={fValor} onChange={e => setFValor(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label-field">Serviços de interesse</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {SERVICOS_OPCOES.map(s => (
                    <button key={s} type="button" onClick={() => toggleServico(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${fServicos.includes(s) ? 'bg-appleBlue text-white border-appleBlue' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {fServicos.includes(s) ? '✓ ' : ''}{s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label-field">Próxima ação</label>
                <input type="text" className="input-field" value={fProxAcao} onChange={e => setFProxAcao(e.target.value)} placeholder="Ex: Ligar para fechar proposta" />
              </div>
              <div>
                <label className="label-field">Data da próxima ação</label>
                <input type="date" className="input-field" value={fDataAcao} onChange={e => setFDataAcao(e.target.value)} />
              </div>
              <div>
                <label className="label-field">Observações</label>
                <textarea className="input-field resize-none" rows={2} value={fObs} onChange={e => setFObs(e.target.value)} />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setShowAdd(false); resetForm(); }} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Lead Detail */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-2 ${ESTAGIO_HEADER[selectedLead.estagio]}`}>
                  <div className={`w-2 h-2 rounded-full ${ESTAGIO_DOT[selectedLead.estagio]}`} />
                  {selectedLead.estagio}
                </div>
                <h2 className="font-semibold text-lg">{selectedLead.nome_lead}</h2>
                {selectedLead.empresa && <p className="text-sm text-gray-400">{selectedLead.empresa}</p>}
              </div>
              <button onClick={() => setSelectedLead(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedLead.contato && <div><p className="text-xs text-gray-400 flex items-center gap-1"><User className="w-3 h-3"/>Contato</p><p className="font-medium">{selectedLead.contato}</p></div>}
                {selectedLead.email && <div><p className="text-xs text-gray-400">E-mail</p><p className="font-medium">{selectedLead.email}</p></div>}
                {selectedLead.valor_estimado && <div><p className="text-xs text-gray-400 flex items-center gap-1"><DollarSign className="w-3 h-3"/>Valor</p><p className="font-bold text-green-600">{fmt(selectedLead.valor_estimado)}</p></div>}
                {selectedLead.data_proxima_acao && <div><p className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3"/>Próxima ação</p><p className="font-medium">{new Date(selectedLead.data_proxima_acao + 'T12:00:00').toLocaleDateString('pt-BR')}</p></div>}
              </div>
              {selectedLead.servicos?.length ? (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Serviços de interesse</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedLead.servicos.map(s => <span key={s} className="text-xs bg-blue-50 text-appleBlue border border-blue-200 px-2.5 py-1 rounded-full">{s}</span>)}
                  </div>
                </div>
              ) : null}
              {selectedLead.proxima_acao && <div><p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><ArrowRight className="w-3 h-3"/>Próxima ação</p><p className="text-sm bg-amber-50 border border-amber-100 p-3 rounded-lg">{selectedLead.proxima_acao}</p></div>}
              {selectedLead.observacoes && <div><p className="text-xs text-gray-400 mb-1">Observações</p><p className="text-sm leading-relaxed">{selectedLead.observacoes}</p></div>}

              <div>
                <p className="text-xs text-gray-400 mb-2 flex items-center gap-1"><ChevronRight className="w-3 h-3"/>Mover para</p>
                <div className="flex flex-wrap gap-2">
                  {ESTAGIOS.filter(e => e !== selectedLead.estagio).map(e => (
                    <button key={e} onClick={() => moveEstagio(selectedLead.id, e)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${ESTAGIO_HEADER[e]}`}>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${ESTAGIO_DOT[e]}`} />{e}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => excluirLead(selectedLead.id)} className="w-full text-sm text-red-500 hover:text-red-700 hover:bg-red-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" /> Excluir Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
