import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import AIContextPanel from '../components/AIContextPanel';
import { exportTrafficClientPDF } from '../utils/pdfExport';
import {
  Users, Plus, TrendingUp, Search, ChevronDown, ChevronRight,
  BarChart2, Clock, CheckCircle, XCircle, PauseCircle, X, Download
} from 'lucide-react';

type Cliente = {
  id: string;
  nome_cliente: string;
  empresa: string;
  nicho: string;
  plataformas: string[];
  valor_contrato: number;
  data_inicio: string;
  status: string;
};

type Campanha = {
  id: string;
  cliente_id: string;
  nome_campanha: string;
  plataforma: string;
  objetivo: string;
  orcamento_diario: number;
  status: string;
};

type Metrica = {
  id: string;
  campanha_id: string;
  periodo: string;
  investimento: number;
  impressoes: number | null;
  cliques: number | null;
  ctr: number | null;
  cpc: number | null;
  conversoes: number | null;
  cpa: number | null;
  roas: number | null;
  faturamento_gerado: number | null;
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { color: string; icon: React.ReactNode }> = {
    Ativo:       { color: 'bg-green-100 text-green-700',  icon: <CheckCircle className="w-3.5 h-3.5" /> },
    Ativa:       { color: 'bg-green-100 text-green-700',  icon: <CheckCircle className="w-3.5 h-3.5" /> },
    Pausado:     { color: 'bg-yellow-100 text-yellow-700', icon: <PauseCircle className="w-3.5 h-3.5" /> },
    Pausada:     { color: 'bg-yellow-100 text-yellow-700', icon: <PauseCircle className="w-3.5 h-3.5" /> },
    Encerrado:   { color: 'bg-gray-100 text-gray-600',    icon: <XCircle className="w-3.5 h-3.5" /> },
    Encerrada:   { color: 'bg-gray-100 text-gray-600',    icon: <XCircle className="w-3.5 h-3.5" /> },
    Lead:        { color: 'bg-blue-100 text-blue-700',    icon: <Clock className="w-3.5 h-3.5" /> },
    Otimizando:  { color: 'bg-purple-100 text-purple-700', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  };
  const s = map[status] ?? { color: 'bg-gray-100 text-gray-600', icon: null };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.color}`}>
      {s.icon}{status}
    </span>
  );
};

// Modal helpers
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</label>
    {children}
  </div>
);

export default function Traffic() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [metricas, setMetricas] = useState<Metrica[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  // Modals
  const [showAddCliente, setShowAddCliente] = useState(false);
  const [showAddCampanha, setShowAddCampanha] = useState<string | null>(null); // cliente_id
  const [showAddMetrica, setShowAddMetrica] = useState<string | null>(null);   // campanha_id

  // Add Cliente form
  const [cNome, setCNome] = useState('');
  const [cEmpresa, setCEmpresa] = useState('');
  const [cNicho, setCNicho] = useState('');
  const [cPlataformas, setCPlataformas] = useState<string[]>([]);
  const [cValor, setCValor] = useState('');
  const [cData, setCData] = useState('');
  const [cStatus, setCStatus] = useState('Ativo');

  // Add Campanha form
  const [camNome, setCamNome] = useState('');
  const [camPlat, setCamPlat] = useState('');
  const [camObj, setCamObj] = useState('');
  const [camOrc, setCamOrc] = useState('');
  const [camData, setCamData] = useState('');
  const [camStatus, setCamStatus] = useState('Ativa');

  // Add Metrica form
  const [mPeriodo, setMPeriodo] = useState('');
  const [mInv, setMInv] = useState('');
  const [mImpr, setMImpr] = useState('');
  const [mCliques, setMCliques] = useState('');
  const [mConv, setMConv] = useState('');
  const [mRoas, setMRoas] = useState('');
  const [mFat, setMFat] = useState('');

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    const [c, cam, m] = await Promise.all([
      supabase.from('maquinawg_trafego_clientes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('maquinawg_trafego_campanhas').select('*').eq('user_id', user.id),
      supabase.from('maquinawg_trafego_metricas').select('*').eq('user_id', user.id),
    ]);
    setClientes(c.data ?? []);
    setCampanhas(cam.data ?? []);
    setMetricas(m.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]);

  const togglePlataforma = (p: string) => {
    setCPlataformas(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleAddCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await supabase.from('maquinawg_trafego_clientes').insert([{
      user_id: user.id,
      nome_cliente: cNome, empresa: cEmpresa, nicho: cNicho, plataformas: cPlataformas,
      valor_contrato: parseFloat(cValor), data_inicio: cData, status: cStatus
    }]);
    setCNome(''); setCEmpresa(''); setCNicho(''); setCPlataformas([]); setCValor(''); setCData(''); setCStatus('Ativo');
    setShowAddCliente(false);
    fetchAll();
  };

  const handleAddCampanha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !showAddCampanha) return;
    await supabase.from('maquinawg_trafego_campanhas').insert([{
      user_id: user.id, cliente_id: showAddCampanha,
      nome_campanha: camNome, plataforma: camPlat, objetivo: camObj,
      orcamento_diario: parseFloat(camOrc), data_inicio: camData, status: camStatus
    }]);
    setCamNome(''); setCamPlat(''); setCamObj(''); setCamOrc(''); setCamData(''); setCamStatus('Ativa');
    setShowAddCampanha(null);
    fetchAll();
  };

  const handleAddMetrica = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !showAddMetrica) return;
    const inv = parseFloat(mInv);
    const cliques = parseInt(mCliques) || null;
    const impressoes = parseInt(mImpr) || null;
    const conversoes = parseInt(mConv) || null;
    const roas = parseFloat(mRoas) || null;
    const fat = parseFloat(mFat) || null;
    const ctr = (impressoes && cliques) ? parseFloat((cliques / impressoes * 100).toFixed(2)) : null;
    const cpc = (cliques && inv) ? parseFloat((inv / cliques).toFixed(2)) : null;
    const cpa = (conversoes && inv) ? parseFloat((inv / conversoes).toFixed(2)) : null;

    await supabase.from('maquinawg_trafego_metricas').insert([{
      user_id: user.id, campanha_id: showAddMetrica,
      periodo: mPeriodo, investimento: inv, impressoes, cliques,
      ctr, cpc, conversoes, cpa, roas, faturamento_gerado: fat
    }]);
    setMPeriodo(''); setMInv(''); setMImpr(''); setMCliques(''); setMConv(''); setMRoas(''); setMFat('');
    setShowAddMetrica(null);
    fetchAll();
  };

  const totalContrato = clientes.filter(c => c.status === 'Ativo').reduce((a, c) => a + Number(c.valor_contrato), 0);
  const filteredClientes = clientes.filter(c =>
    c.nome_cliente.toLowerCase().includes(search.toLowerCase()) ||
    c.empresa.toLowerCase().includes(search.toLowerCase())
  );

  const plataformasOpcoes = ['Meta Ads', 'Google Ads', 'TikTok Ads', 'LinkedIn Ads'];
  const objetivos = ['Leads', 'Vendas', 'Tráfego', 'Brand Awareness'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tráfego Pago</h1>
          <p className="text-gray-500 text-sm mt-1">Clientes, campanhas e KPIs de performance.</p>
        </div>
        <button onClick={() => setShowAddCliente(true)} className="btn-primary w-full md:w-auto flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Novo Cliente
        </button>
      </header>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 border-l-4 border-l-appleBlue">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">Clientes Ativos</p>
          <h2 className="text-2xl font-semibold mt-1">{clientes.filter(c => c.status === 'Ativo').length}</h2>
        </div>
        <div className="glass-card p-5 border-l-4 border-l-green-500">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">Receita Mensal Gerenciada</p>
          <h2 className="text-2xl font-semibold mt-1">R$ {totalContrato.toFixed(2).replace('.', ',')}</h2>
        </div>
        <div className="glass-card p-5 border-l-4 border-l-purple-400">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">Campanhas Ativas</p>
          <h2 className="text-2xl font-semibold mt-1">{campanhas.filter(c => c.status === 'Ativa').length}</h2>
        </div>
      </div>

      {/* Client List */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/40">
          <h3 className="font-semibold text-sm uppercase tracking-wider">Clientes</h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar..." className="pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-appleBlue text-sm w-48" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">Carregando...</div>
        ) : filteredClientes.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum cliente cadastrado.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredClientes.map(c => {
              const clientCampanhas = campanhas.filter(cam => cam.cliente_id === c.id);
              return (
                <div key={c.id}>
                  <div
                    className="flex items-center gap-4 px-6 py-4 hover:bg-black/[0.02] cursor-pointer transition-colors"
                    onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center font-bold text-appleBlue text-sm flex-shrink-0">
                      {c.nome_cliente.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-appleDark truncate">{c.nome_cliente}</p>
                      <p className="text-xs text-gray-400 truncate">{c.empresa} · {c.nicho}</p>
                    </div>
                    <div className="hidden md:block text-right mr-4">
                      <p className="text-sm font-medium text-gray-700">R$ {Number(c.valor_contrato).toFixed(2).replace('.', ',')}/mês</p>
                      <p className="text-xs text-gray-400">{clientCampanhas.length} campanha(s)</p>
                    </div>
                    <StatusBadge status={c.status} />
                    {expanded === c.id ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </div>

                  {/* Expanded campaigns */}
                  {expanded === c.id && (
                    <div className="bg-gray-50/50 border-t border-gray-100 px-6 py-4 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500">Campanhas</h4>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              const clientCams = campanhas.filter(cam => cam.cliente_id === c.id);
                              const clientMets = metricas.filter(m => clientCams.some(cam => cam.id === m.campanha_id));
                              exportTrafficClientPDF(
                                { nome: c.nome_cliente, empresa: c.empresa, nicho: c.nicho, valor_contrato: c.valor_contrato, status: c.status },
                                clientCams.map(cam => ({ nome_campanha: cam.nome_campanha, plataforma: cam.plataforma, objetivo: cam.objetivo, status: cam.status })),
                                clientMets
                              );
                            }}
                            className="text-xs text-gray-500 hover:text-appleBlue flex items-center gap-1 border border-gray-200 px-2 py-1 rounded-lg hover:border-appleBlue transition-colors"
                          >
                            <Download className="w-3 h-3" /> Exportar PDF
                          </button>
                          <button onClick={() => setShowAddCampanha(c.id)} className="text-xs text-appleBlue hover:underline flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Nova Campanha
                          </button>
                        </div>
                      </div>
                      {clientCampanhas.length === 0 ? (
                        <p className="text-sm text-gray-400 py-2">Nenhuma campanha cadastrada.</p>
                      ) : (
                        clientCampanhas.map(cam => {
                          const camMetricas = metricas.filter(m => m.campanha_id === cam.id);
                          const lastMetrica = camMetricas[camMetricas.length - 1];
                          return (
                            <div key={cam.id} className="glass-card p-4">
                              <div className="flex items-center justify-between gap-4 flex-wrap">
                                <div>
                                  <p className="font-medium text-sm">{cam.nome_campanha}</p>
                                  <p className="text-xs text-gray-400">{cam.plataforma} · {cam.objetivo}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <StatusBadge status={cam.status} />
                                  <button onClick={() => setShowAddMetrica(cam.id)} className="text-xs text-appleBlue hover:underline flex items-center gap-1">
                                    <BarChart2 className="w-3 h-3" /> + KPIs
                                  </button>
                                </div>
                              </div>
                              {lastMetrica && (
                                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                  {[
                                    { label: 'Investimento', val: `R$ ${Number(lastMetrica.investimento).toFixed(2)}` },
                                    { label: 'ROAS', val: lastMetrica.roas ? `${lastMetrica.roas}x` : '-' },
                                    { label: 'CTR', val: lastMetrica.ctr ? `${lastMetrica.ctr}%` : '-' },
                                    { label: 'CPA', val: lastMetrica.cpa ? `R$ ${Number(lastMetrica.cpa).toFixed(2)}` : '-' },
                                  ].map(kpi => (
                                    <div key={kpi.label} className="bg-white rounded-lg p-3 text-center border border-gray-100">
                                      <p className="text-xs text-gray-400 mb-1">{kpi.label}</p>
                                      <p className="font-semibold text-sm">{kpi.val}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Modal: Novo Cliente ─── */}
      {showAddCliente && (
        <Modal title="Novo Cliente de Tráfego" onClose={() => setShowAddCliente(false)}>
          <form onSubmit={handleAddCliente} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nome do Cliente *"><input required type="text" className="input-field" value={cNome} onChange={e => setCNome(e.target.value)} /></Field>
            <Field label="Empresa / Negócio *"><input required type="text" className="input-field" value={cEmpresa} onChange={e => setCEmpresa(e.target.value)} /></Field>
            <Field label="Nicho / Segmento *">
              <div className="relative">
                <select className="input-field appearance-none" value={cNicho} onChange={e => setCNicho(e.target.value)} required>
                  <option value="">Selecionar...</option>
                  {['Saúde', 'Moda', 'Educação', 'Imóveis', 'Alimentação', 'Tecnologia', 'Serviços', 'Beleza', 'Outro'].map(o => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </Field>
            <Field label="Valor do Contrato (R$) *"><input required type="number" step="0.01" className="input-field" value={cValor} onChange={e => setCValor(e.target.value)} /></Field>
            <Field label="Data de Início *"><input required type="date" className="input-field" value={cData} onChange={e => setCData(e.target.value)} /></Field>
            <Field label="Status">
              <div className="relative">
                <select className="input-field appearance-none" value={cStatus} onChange={e => setCStatus(e.target.value)}>
                  {['Ativo', 'Pausado', 'Encerrado', 'Lead'].map(o => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </Field>
            <div className="md:col-span-2">
              <Field label="Plataformas Ativas">
                <div className="flex flex-wrap gap-2 mt-1">
                  {plataformasOpcoes.map(p => (
                    <button type="button" key={p} onClick={() => togglePlataforma(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${cPlataformas.includes(p) ? 'bg-appleBlue text-white border-appleBlue' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowAddCliente(false)} className="btn-secondary">Cancelar</button>
              <button type="submit" className="btn-primary">Salvar Cliente</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Modal: Nova Campanha ─── */}
      {showAddCampanha && (
        <Modal title="Nova Campanha" onClose={() => setShowAddCampanha(null)}>
          <form onSubmit={handleAddCampanha} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nome da Campanha *"><input required type="text" className="input-field" value={camNome} onChange={e => setCamNome(e.target.value)} /></Field>
            <Field label="Plataforma *">
              <div className="relative">
                <select className="input-field appearance-none" required value={camPlat} onChange={e => setCamPlat(e.target.value)}>
                  <option value="">Selecionar...</option>
                  {plataformasOpcoes.map(o => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </Field>
            <Field label="Objetivo *">
              <div className="relative">
                <select className="input-field appearance-none" required value={camObj} onChange={e => setCamObj(e.target.value)}>
                  <option value="">Selecionar...</option>
                  {objetivos.map(o => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </Field>
            <Field label="Orçamento Diário (R$) *"><input required type="number" step="0.01" className="input-field" value={camOrc} onChange={e => setCamOrc(e.target.value)} /></Field>
            <Field label="Data de Início *"><input required type="date" className="input-field" value={camData} onChange={e => setCamData(e.target.value)} /></Field>
            <Field label="Status">
              <div className="relative">
                <select className="input-field appearance-none" value={camStatus} onChange={e => setCamStatus(e.target.value)}>
                  {['Ativa', 'Pausada', 'Otimizando', 'Encerrada'].map(o => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </Field>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowAddCampanha(null)} className="btn-secondary">Cancelar</button>
              <button type="submit" className="btn-primary">Salvar Campanha</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Modal: Registrar KPIs ─── */}
      {showAddMetrica && (
        <Modal title="Registrar Métricas / KPIs" onClose={() => setShowAddMetrica(null)}>
          <form onSubmit={handleAddMetrica} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Período *"><input required type="text" className="input-field" placeholder="Ex: Semana 15/04 a 21/04" value={mPeriodo} onChange={e => setMPeriodo(e.target.value)} /></Field>
            <Field label="Investimento Total (R$) *"><input required type="number" step="0.01" className="input-field" value={mInv} onChange={e => setMInv(e.target.value)} /></Field>
            <Field label="Impressões"><input type="number" className="input-field" value={mImpr} onChange={e => setMImpr(e.target.value)} /></Field>
            <Field label="Cliques"><input type="number" className="input-field" value={mCliques} onChange={e => setMCliques(e.target.value)} /></Field>
            <Field label="Conversões"><input type="number" className="input-field" value={mConv} onChange={e => setMConv(e.target.value)} /></Field>
            <Field label="ROAS"><input type="number" step="0.01" className="input-field" placeholder="Ex: 3.5" value={mRoas} onChange={e => setMRoas(e.target.value)} /></Field>
            <div className="md:col-span-2">
              <Field label="Faturamento Gerado (R$)"><input type="number" step="0.01" className="input-field" value={mFat} onChange={e => setMFat(e.target.value)} /></Field>
            </div>
            <p className="md:col-span-2 text-xs text-gray-400">CTR, CPC e CPA são calculados automaticamente.</p>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowAddMetrica(null)} className="btn-secondary">Cancelar</button>
              <button type="submit" className="btn-primary">Registrar KPIs</button>
            </div>
          </form>
        </Modal>
      )}
      <AIContextPanel
        modulo="Tráfego Pago"
        contextoTexto={`Clientes Ativos: ${clientes.filter(c => c.status === 'Ativo').length}\nReceita Mensal Gerenciada: R$ ${totalContrato.toFixed(2)}\nCampanhas Ativas: ${campanhas.filter(c => c.status === 'Ativa').length}\n\nClientes:\n${clientes.map(c => `- ${c.nome_cliente} (${c.empresa}) | ${c.status} | R$ ${Number(c.valor_contrato).toFixed(2)}/mês | Plataformas: ${(c.plataformas || []).join(', ')}`).join('\n')}`}
        promptsSugeridos={[
          'Analise os resultados gerais das minhas campanhas e sugira otimizações.',
          'Quais clientes posso fazer upsell de serviços?',
          'Crie um relatório de resultados para enviar ao cliente.',
        ]}
      />
    </div>
  );
}
