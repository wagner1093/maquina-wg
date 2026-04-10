import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import {
  FileText, Sparkles, ChevronDown, Copy, Check,
  Loader2, Download, Save, Trash2, ArrowLeft
} from 'lucide-react';
import { generateWithAI, hasOpenAIKey } from '../utils/ai';
import { exportProposalPDF } from '../utils/pdfExport';
import type { Cliente } from './Clients';

type Proposta = {
  id: string;
  cliente_id: string | null;
  titulo: string;
  conteudo: string;
  valor_total: number | null;
  status: string;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  'Rascunho': 'bg-gray-100 text-gray-600',
  'Enviada': 'bg-blue-100 text-blue-700',
  'Aceita': 'bg-green-100 text-green-700',
  'Recusada': 'bg-red-100 text-red-600',
};

export default function Proposals() {
  const { user } = useAuth();
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'new' | 'detail'>('list');
  const [selectedProposta, setSelectedProposta] = useState<Proposta | null>(null);

  // Generator form
  const [fCliente, setFCliente] = useState('');
  const [fTitulo, setFTitulo] = useState('');
  const [fServicos, setFServicos] = useState<string[]>([]);
  const [fValor, setFValor] = useState('');
  const [fPrazo, setFPrazo] = useState('');
  const [fContexto, setFContexto] = useState('');
  const [fCondicoes, setFCondicoes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  const SERVICOS_OPCOES = ['Social Media', 'Tráfego Pago', 'Hospedagem', 'Site / Landing Page', 'Consultoria', 'Gestão de Conteúdo', 'Identidade Visual'];

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    const [p, c] = await Promise.all([
      supabase.from('maquinawg_propostas').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('maquinawg_clientes').select('*').eq('user_id', user.id).order('nome'),
    ]);
    setPropostas(p.data ?? []);
    setClientes(c.data as Cliente[] ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]);

  const clienteSelecionado = clientes.find(c => c.id === fCliente) ?? null;

  const buildClienteCtx = (c: Cliente): string => {
    const lines = [`EMPRESA: ${c.empresa}`, `SEGMENTO: ${c.segmento ?? 'Não informado'}`];
    if (c.sm_descricao_marca) lines.push(`SOBRE A EMPRESA: ${c.sm_descricao_marca}`);
    if (c.sm_publico_alvo) lines.push(`PÚBLICO-ALVO: ${c.sm_publico_alvo}`);
    if (c.sm_tom_de_voz) lines.push(`TOM DE VOZ: ${c.sm_tom_de_voz}`);
    if (c.observacoes) lines.push(`OBSERVAÇÕES: ${c.observacoes}`);
    return lines.join('\n');
  };

  const handleGenerate = async () => {
    if (!fServicos.length) { alert('Selecione ao menos um serviço.'); return; }
    setGenerating(true);

    const clienteCtx = clienteSelecionado ? buildClienteCtx(clienteSelecionado) : '';

    const systemPrompt = `Você é um especialista em propostas comerciais para agências de marketing digital. 
Crie propostas profissionais, persuasivas e bem estruturadas em português brasileiro.
Use markdown para formatar (## para seções, **negrito**, - para listas).
Inclua sempre: apresentação, entendimento do negócio, escopo de serviços, entregáveis, investimento, prazo, condições, garantias e próximos passos.`;

    const userPrompt = `Crie uma proposta comercial completa e profissional com estas informações:

${clienteCtx ? `DADOS DO CLIENTE:\n${clienteCtx}\n` : ''}
SERVIÇOS A PROPOR: ${fServicos.join(', ')}
${fValor ? `INVESTIMENTO TOTAL: R$ ${fValor}` : ''}
${fPrazo ? `PRAZO DE ENTREGA: ${fPrazo}` : ''}
${fContexto ? `CONTEXTO ADICIONAL: ${fContexto}` : ''}
${fCondicoes ? `CONDIÇÕES ESPECIAIS: ${fCondicoes}` : ''}

A proposta deve ser elaborada como se fosse da minha agência para este cliente.
Seja persuasivo, mostre valor e diferenciais. Use linguagem profissional mas acessível.`;

    try {
      const r = await generateWithAI(userPrompt, systemPrompt);
      setResult(r);
    } catch (e: any) {
      setResult('Erro ao gerar: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!user || !result || !fServicos.length) return;
    setSaving(true);
    const titulo = fTitulo || `Proposta ${fServicos.join(' + ')} — ${clienteSelecionado?.empresa ?? 'Sem cliente'}`;
    await supabase.from('maquinawg_propostas').insert([{
      user_id: user.id,
      cliente_id: fCliente || null,
      titulo,
      conteudo: result,
      valor_total: fValor ? parseFloat(fValor) : null,
      status: 'Rascunho',
    }]);
    setSaving(false);
    await fetchAll();
    setView('list');
    resetForm();
  };

  const resetForm = () => {
    setFCliente(''); setFTitulo(''); setFServicos([]); setFValor('');
    setFPrazo(''); setFContexto(''); setFCondicoes(''); setResult('');
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('maquinawg_propostas').update({ status }).eq('id', id);
    if (selectedProposta?.id === id) setSelectedProposta({ ...selectedProposta, status });
    fetchAll();
  };

  const excluir = async (id: string) => {
    await supabase.from('maquinawg_propostas').delete().eq('id', id);
    setSelectedProposta(null);
    setView('list');
    fetchAll();
  };

  const copyText = () => {
    navigator.clipboard.writeText(result || selectedProposta?.conteudo || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleServico = (s: string) =>
    setFServicos(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Markdown renderer (simple)
  const renderMd = (text: string) => {
    return text
      .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-5 mb-2 text-appleDark border-b pb-1">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="font-semibold mt-3 mb-1 text-gray-700">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-gray-700">$1</li>')
      .replace(/\n\n/g, '<br/><br/>');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* List View */}
      {view === 'list' && (
        <>
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <FileText className="w-8 h-8 text-appleBlue" /> Propostas Comerciais
              </h1>
              <p className="text-gray-500 text-sm mt-1">Gere propostas profissionais com IA em segundos.</p>
            </div>
            <button onClick={() => setView('new')} className="btn-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Gerar Proposta com IA
            </button>
          </header>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total', val: propostas.length, color: 'border-l-gray-400' },
              { label: 'Enviadas', val: propostas.filter(p => p.status === 'Enviada').length, color: 'border-l-blue-400' },
              { label: 'Aceitas', val: propostas.filter(p => p.status === 'Aceita').length, color: 'border-l-green-500' },
              { label: 'Valor Aceito', val: propostas.filter(p => p.status === 'Aceita').reduce((a, b) => a + (b.valor_total ?? 0), 0), color: 'border-l-green-500', fmt: true },
            ].map(k => (
              <div key={k.label} className={`glass-card p-4 border-l-4 ${k.color}`}>
                <p className="text-xs text-gray-400 uppercase tracking-wider">{k.label}</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{k.fmt ? fmt(k.val as number) : k.val}</p>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400">Carregando...</div>
          ) : propostas.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="font-medium">Nenhuma proposta ainda.</p>
              <p className="text-sm mt-1">Clique em "Gerar Proposta com IA" para começar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {propostas.map(p => {
                const cliente = clientes.find(c => c.id === p.cliente_id);
                return (
                  <div key={p.id} onClick={() => { setSelectedProposta(p); setView('detail'); }}
                    className="glass-card p-5 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-semibold text-appleDark leading-tight">{p.titulo}</p>
                        {cliente && <p className="text-xs text-gray-400 mt-1">{cliente.empresa}</p>}
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                    </div>
                    {p.valor_total && <p className="text-lg font-bold text-green-600">{fmt(p.valor_total)}</p>}
                    <p className="text-xs text-gray-400 mt-2">{new Date(p.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* New Proposal View */}
      {view === 'new' && (
        <>
          <header className="flex items-center gap-3">
            <button onClick={() => { setView('list'); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Gerar Proposta com IA</h1>
              <p className="text-gray-400 text-sm">Preencha os dados e o GPT-4o gera uma proposta profissional.</p>
            </div>
          </header>

          {!hasOpenAIKey() && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
              ⚠️ Configure <code>VITE_OPENAI_API_KEY</code> no .env para usar esta funcionalidade.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="glass-card p-6 space-y-4">
              <h2 className="font-semibold">Dados da Proposta</h2>

              <div>
                <label className="label-field">Cliente (opcional)</label>
                <div className="relative">
                  <select className="input-field appearance-none" value={fCliente} onChange={e => setFCliente(e.target.value)}>
                    <option value="">Sem cliente (genérico)</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} — {c.empresa}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                {clienteSelecionado && (
                  <div className="mt-2 p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-xs text-gray-600">
                    ✅ Briefing do cliente carregado automaticamente.
                    {clienteSelecionado.sm_descricao_marca && <span className="ml-1">Marca, público-alvo e tom de voz serão usados.</span>}
                  </div>
                )}
              </div>

              <div>
                <label className="label-field">Título da Proposta</label>
                <input type="text" className="input-field" value={fTitulo} onChange={e => setFTitulo(e.target.value)} placeholder="Ex: Proposta Social Media + Tráfego - Empresa X" />
              </div>

              <div>
                <label className="label-field">Serviços a propor *</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {SERVICOS_OPCOES.map(s => (
                    <button key={s} type="button" onClick={() => toggleServico(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${fServicos.includes(s) ? 'bg-appleBlue text-white border-appleBlue' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {fServicos.includes(s) ? '✓ ' : ''}{s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Investimento Total (R$)</label>
                  <input type="number" step="0.01" className="input-field" value={fValor} onChange={e => setFValor(e.target.value)} placeholder="Ex: 3000" />
                </div>
                <div>
                  <label className="label-field">Prazo de Entrega</label>
                  <input type="text" className="input-field" value={fPrazo} onChange={e => setFPrazo(e.target.value)} placeholder="Ex: 15 dias úteis" />
                </div>
              </div>

              <div>
                <label className="label-field">Contexto adicional</label>
                <textarea className="input-field resize-none" rows={3} value={fContexto} onChange={e => setFContexto(e.target.value)} placeholder="Dores do cliente, objetivos específicos, histórico, qualquer info relevante..." />
              </div>

              <div>
                <label className="label-field">Condições especiais</label>
                <input type="text" className="input-field" value={fCondicoes} onChange={e => setFCondicoes(e.target.value)} placeholder="Ex: 50% entrada, 50% após aprovação" />
              </div>

              <button onClick={handleGenerate} disabled={generating || !fServicos.length} className="btn-primary w-full flex items-center justify-center gap-2">
                {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando proposta...</> : <><Sparkles className="w-4 h-4" /> Gerar Proposta com GPT-4o</>}
              </button>
            </div>

            {/* Result */}
            <div className="space-y-3">
              {result ? (
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-appleBlue uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Proposta Gerada
                    </span>
                    <div className="flex gap-2">
                      <button onClick={copyText} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3">
                        {copied ? <><Check className="w-3.5 h-3.5 text-green-600" /> Copiado!</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
                      </button>
                      <button 
                        onClick={() => exportProposalPDF({
                          titulo: fTitulo || `Proposta ${fServicos.join(' + ')}`,
                          conteudo: result,
                          valor_total: fValor ? parseFloat(fValor) : null,
                          created_at: new Date().toISOString()
                        }, clienteSelecionado ? { nome: clienteSelecionado.nome, empresa: clienteSelecionado.empresa } : undefined)} 
                        className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                      <button onClick={handleSave} disabled={saving} className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3">
                        {saving ? 'Salvando...' : <><Save className="w-3.5 h-3.5" /> Salvar</>}
                      </button>
                    </div>
                  </div>
                  <div className="prose max-w-none text-sm leading-relaxed max-h-[600px] overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: renderMd(result) }} />
                </div>
              ) : (
                <div className="glass-card p-12 flex flex-col items-center justify-center text-center text-gray-400 min-h-[400px]">
                  <FileText className="w-16 h-16 opacity-20 mb-4" />
                  <p className="font-medium">Sua proposta aparecerá aqui</p>
                  <p className="text-sm mt-1">Preencha os dados ao lado e clique em gerar.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Detail View */}
      {view === 'detail' && selectedProposta && (
        <>
          <header className="flex items-center gap-3">
            <button onClick={() => { setView('list'); setSelectedProposta(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{selectedProposta.titulo}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[selectedProposta.status]}`}>{selectedProposta.status}</span>
                {selectedProposta.valor_total && <span className="text-sm font-bold text-green-600">{fmt(selectedProposta.valor_total)}</span>}
                <span className="text-xs text-gray-400">{new Date(selectedProposta.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={copyText} className="btn-secondary flex items-center gap-1.5 text-sm">
                {copied ? <><Check className="w-4 h-4 text-green-600" /> Copiado!</> : <><Copy className="w-4 h-4" /> Copiar</>}
              </button>
              <button 
                onClick={() => {
                  const cliente = clientes.find(c => c.id === selectedProposta.cliente_id);
                  exportProposalPDF(selectedProposta, cliente ? { nome: cliente.nome, empresa: cliente.empresa } : undefined);
                }} 
                className="btn-secondary flex items-center gap-1.5 text-sm"
              >
                <Download className="w-4 h-4" /> PDF
              </button>
              <button onClick={() => excluir(selectedProposta.id)} className="p-2 hover:bg-red-50 text-red-00 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Status update */}
          <div className="flex gap-2 flex-wrap">
            <span className="text-sm text-gray-500 self-center">Status:</span>
            {['Rascunho', 'Enviada', 'Aceita', 'Recusada'].map(s => (
              <button key={s} onClick={() => updateStatus(selectedProposta.id, s)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${selectedProposta.status === s ? STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-gray-300' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {s}
              </button>
            ))}
          </div>

          <div className="glass-card p-8">
            <div className="prose max-w-none text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMd(selectedProposta.conteudo) }} />
          </div>
        </>
      )}
    </div>
  );
}
