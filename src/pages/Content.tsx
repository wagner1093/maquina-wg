import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles, Megaphone, PenLine, Video,
  BookmarkPlus, History, Copy, Check, ChevronDown, Loader2, Users
} from 'lucide-react';
import { generateWithAI, hasOpenAIKey } from '../utils/ai';
import type { Cliente } from './Clients';

type Tab = 'copy' | 'post' | 'roteiro' | 'historico';

type Generation = {
  id: string;
  tipo: string;
  resultado: string;
  created_at: string;
};

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useClientes() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  useEffect(() => {
    if (!user) return;
    supabase.from('maquinawg_clientes').select('*').eq('user_id', user.id).order('nome')
      .then(({ data }) => setClientes(data ?? []));
  }, [user]);
  return clientes;
}

// ─── Client context builder ────────────────────────────────────────────────────
function buildClienteContext(c: Cliente | null): string {
  if (!c) return '';
  const lines: string[] = [
    `CLIENTE: ${c.nome} | EMPRESA: ${c.empresa}`,
    c.segmento ? `SEGMENTO: ${c.segmento}` : '',
    '',
  ];
  if (c.sm_ativo) {
    lines.push('=== BRIEF DE SOCIAL MEDIA ===');
    if (c.sm_descricao_marca) lines.push(`DESCRIÇÃO DA MARCA: ${c.sm_descricao_marca}`);
    if (c.sm_publico_alvo) lines.push(`PÚBLICO-ALVO: ${c.sm_publico_alvo}`);
    if (c.sm_tom_de_voz) lines.push(`TOM DE VOZ: ${c.sm_tom_de_voz}`);
    if (c.sm_objetivo) lines.push(`OBJETIVO: ${c.sm_objetivo}`);
    if (c.sm_redes?.length) lines.push(`REDES SOCIAIS: ${c.sm_redes.join(', ')}`);
    if (c.sm_pilares?.length) lines.push(`PILARES DE CONTEÚDO: ${c.sm_pilares.join(', ')}`);
    if (c.sm_identidade_visual) lines.push(`IDENTIDADE VISUAL: ${c.sm_identidade_visual}`);
    if (c.sm_concorrentes) lines.push(`CONCORRENTES: ${c.sm_concorrentes}`);
    if (c.sm_restricoes) lines.push(`⚠️ RESTRIÇÕES (RESPEITAR OBRIGATORIAMENTE): ${c.sm_restricoes}`);
  }
  if (c.tp_ativo) {
    lines.push('', '=== TRÁFEGO PAGO ===');
    if (c.tp_plataformas?.length) lines.push(`PLATAFORMAS: ${c.tp_plataformas.join(', ')}`);
    if (c.tp_objetivo) lines.push(`OBJETIVO DAS CAMPANHAS: ${c.tp_objetivo}`);
  }
  if (c.observacoes) lines.push('', `OBSERVAÇÕES: ${c.observacoes}`);
  return lines.filter(l => l !== undefined).join('\n');
}

// ─── Client Selector ──────────────────────────────────────────────────────────
function ClienteSelector({ clientes, value, onChange }: {
  clientes: Cliente[];
  value: Cliente | null;
  onChange: (c: Cliente | null) => void;
}) {
  return (
    <div className="glass-card p-4 border-2 border-appleBlue/20 bg-blue-50/30">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-appleBlue/10 flex items-center justify-center">
          <Users className="w-4 h-4 text-appleBlue" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-appleBlue uppercase tracking-wider mb-1">
            Gerar para qual cliente?
          </p>
          <div className="relative">
            <select
              className="input-field appearance-none text-sm font-medium bg-white"
              value={value?.id ?? ''}
              onChange={e => {
                const found = clientes.find(c => c.id === e.target.value) ?? null;
                onChange(found);
              }}
            >
              <option value="">Sem cliente (genérico)</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nome} — {c.empresa} {c.sm_ativo ? '(Social Media)' : ''} {c.tp_ativo ? '(Tráfego)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
      {value && (
        <div className="mt-3 p-3 bg-white rounded-lg border border-blue-100 text-xs text-gray-600 space-y-1">
          {value.sm_tom_de_voz && <p>🎯 <strong>Tom:</strong> {value.sm_tom_de_voz}</p>}
          {value.sm_publico_alvo && <p>👥 <strong>Público:</strong> {value.sm_publico_alvo.slice(0, 100)}{value.sm_publico_alvo.length > 100 ? '...' : ''}</p>}
          {value.sm_restricoes && <p>⚠️ <strong>Restrições:</strong> {value.sm_restricoes.slice(0, 80)}...</p>}
          {!value.sm_ativo && !value.tp_ativo && <p className="text-amber-600">Este cliente não tem brief de Social Media cadastrado.</p>}
        </div>
      )}
    </div>
  );
}

// ─── Reusable components ──────────────────────────────────────────────────────
const SelectField = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</label>
    <div className="relative">
      <select className="input-field appearance-none pr-8" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">Selecionar...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  </div>
);

const TextField = ({ label, value, onChange, placeholder, multiline = false }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</label>
    {multiline ? (
      <textarea className="input-field resize-none" rows={3} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    ) : (
      <input type="text" className="input-field" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    )}
  </div>
);

function ResultBox({ result, onSave }: { result: string; onSave: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="glass-card p-5 mt-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-appleBlue uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Resultado (GPT-4o)
        </span>
        <div className="flex gap-2">
          <button onClick={copy} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3">
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
          <button onClick={onSave} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3">
            <BookmarkPlus className="w-3.5 h-3.5" /> Salvar
          </button>
        </div>
      </div>
      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-gray-100 max-h-80 overflow-y-auto">
        {result}
      </div>
    </div>
  );
}

// ─── Copy Tab ─────────────────────────────────────────────────────────────────
function CopyTab({ clienteCtx, onResult }: { clienteCtx: string; onResult: (tipo: string, resultado: string, dados: object) => void }) {
  const [produto, setProduto] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [tom, setTom] = useState('');
  const [plataforma, setPlataforma] = useState('');
  const [cta, setCta] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!objetivo || !plataforma) return;
    setLoading(true);

    const systemPrompt = clienteCtx
      ? `Você é um copywriter expert. Use OBRIGATORIAMENTE as informações do cliente abaixo para criar copies perfeitamente alinhados com a marca.\n\n${clienteCtx}\n\nRespeite o tom de voz, público-alvo e todas as restrições indicadas.`
      : 'Você é um copywriter especializado em anúncios de alta conversão. Responda em português brasileiro.';

    const userPrompt = `Crie 3 variações de copy para anúncio:\n${produto ? `Produto/Serviço: ${produto}\n` : ''}Objetivo: ${objetivo}\nTom: ${tom || 'Conforme briefing do cliente'}\nPlataforma: ${plataforma}\nCTA: ${cta || 'Livre'}`;

    try {
      const r = await generateWithAI(userPrompt, systemPrompt);
      setResult(r);
      onResult('copy', r, { produto, objetivo, tom, plataforma, cta });
    } catch (e: any) { setResult('Erro: ' + e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField label="Produto / Serviço (opcional se cliente selecionado)" value={produto} onChange={setProduto} placeholder="Ex: Consultoria de Marketing" />
        <SelectField label="Objetivo *" value={objetivo} onChange={setObjetivo} options={['Clique', 'Compra', 'Lead', 'Awareness', 'Engajamento']} />
        <SelectField label="Tom de Voz (sobrescreve o do cliente)" value={tom} onChange={setTom} options={['Urgente', 'Emocional', 'Racional', 'Humorístico', 'Profissional', 'Descontraído']} />
        <SelectField label="Plataforma *" value={plataforma} onChange={setPlataforma} options={['Meta Ads', 'Google Ads', 'TikTok Ads', 'LinkedIn Ads']} />
        <div className="md:col-span-2">
          <TextField label="CTA Desejado" value={cta} onChange={setCta} placeholder="Ex: Compre agora, Saiba mais..." />
        </div>
      </div>
      <button onClick={generate} disabled={loading} className="btn-primary flex items-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {loading ? 'Gerando...' : 'Gerar Copies com GPT-4o'}
      </button>
      {result && <ResultBox result={result} onSave={() => {}} />}
    </div>
  );
}

// ─── Post Tab ─────────────────────────────────────────────────────────────────
function PostTab({ clienteCtx, onResult }: { clienteCtx: string; onResult: (tipo: string, resultado: string, dados: object) => void }) {
  const [tema, setTema] = useState('');
  const [formato, setFormato] = useState('');
  const [rede, setRede] = useState('');
  const [objetivoPost, setObjetivoPost] = useState('');
  const [tom, setTom] = useState('');
  const [tamanho, setTamanho] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!tema || !formato) return;
    setLoading(true);

    const systemPrompt = clienteCtx
      ? `Você é especialista em criação de conteúdo para redes sociais. Use OBRIGATORIAMENTE as informações do cliente:\n\n${clienteCtx}\n\nCrie conteúdo que reflita o tom de voz, fale com o público-alvo correto e siga as restrições.`
      : 'Você é expert em criação de conteúdo para redes sociais. Responda em português brasileiro.';

    const userPrompt = `Crie um post completo:\nTema: ${tema}\nFormato: ${formato}\nRede Social: ${rede || 'Instagram'}\nObjetivo: ${objetivoPost || 'Engajamento'}\nTom: ${tom || 'Conforme briefing'}\nTamanho: ${tamanho || 'Médio'}`;

    try {
      const r = await generateWithAI(userPrompt, systemPrompt);
      setResult(r);
      onResult('post', r, { tema, formato, rede, objetivoPost, tom, tamanho });
    } catch (e: any) { setResult('Erro: ' + e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField label="Tema do Post *" value={tema} onChange={setTema} placeholder="Ex: 5 erros que impedem seu negócio" />
        <SelectField label="Formato *" value={formato} onChange={setFormato} options={['Feed', 'Stories', 'Reels', 'Carrossel', 'LinkedIn Article']} />
        <SelectField label="Rede Social" value={rede} onChange={setRede} options={['Instagram', 'Facebook', 'LinkedIn', 'TikTok']} />
        <SelectField label="Objetivo" value={objetivoPost} onChange={setObjetivoPost} options={['Engajamento', 'Venda', 'Autoridade', 'Educação', 'Entretenimento']} />
        <SelectField label="Tom (sobrescreve o do cliente)" value={tom} onChange={setTom} options={['Descontraído', 'Profissional', 'Inspirador', 'Didático', 'Humorístico']} />
        <SelectField label="Tamanho" value={tamanho} onChange={setTamanho} options={['Curto (até 150)', 'Médio (até 300)', 'Longo (600+)']} />
      </div>
      <button onClick={generate} disabled={loading} className="btn-primary flex items-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {loading ? 'Gerando...' : 'Gerar Post com GPT-4o'}
      </button>
      {result && <ResultBox result={result} onSave={() => {}} />}
    </div>
  );
}

// ─── Roteiro Tab ──────────────────────────────────────────────────────────────
function RoteiroTab({ clienteCtx, onResult }: { clienteCtx: string; onResult: (tipo: string, resultado: string, dados: object) => void }) {
  const [tema, setTema] = useState('');
  const [plataforma, setPlataforma] = useState('');
  const [duracao, setDuracao] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!tema || !plataforma || !duracao) return;
    setLoading(true);

    const systemPrompt = clienteCtx
      ? `Você é roteirista de vídeos virais. Use OBRIGATORIAMENTE o briefing do cliente:\n\n${clienteCtx}\n\nO roteiro deve refletir a marca, falar com o público-alvo e seguir o tom de voz especificado.`
      : 'Você é roteirista de vídeos virais. Responda em português brasileiro.';

    const userPrompt = `Crie um roteiro completo:\nTema: ${tema}\nPlataforma: ${plataforma}\nDuração: ${duracao}\nObjetivo: ${objetivo || 'Engajar'}\n\nEstruture: GANCHO (0-5s), DESENVOLVIMENTO por cenas com indicações de câmera/texto, CTA final, sugestão de THUMBNAIL e TÍTULO SEO.`;

    try {
      const r = await generateWithAI(userPrompt, systemPrompt);
      setResult(r);
      onResult('roteiro', r, { tema, plataforma, duracao, objetivo });
    } catch (e: any) { setResult('Erro: ' + e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField label="Tema / Título *" value={tema} onChange={setTema} placeholder="Ex: Como triplicar seus seguidores" />
        <SelectField label="Plataforma *" value={plataforma} onChange={setPlataforma} options={['YouTube', 'Reels (Instagram)', 'TikTok', 'VSL (Vendas)']} />
        <SelectField label="Duração *" value={duracao} onChange={setDuracao} options={['30 segundos', '1 minuto', '3 minutos', '5 minutos', '10+ minutos']} />
        <SelectField label="Objetivo" value={objetivo} onChange={setObjetivo} options={['Educar', 'Vender', 'Entreter', 'Autoridade', 'Engajar']} />
      </div>
      <button onClick={generate} disabled={loading} className="btn-primary flex items-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {loading ? 'Gerando...' : 'Gerar Roteiro com GPT-4o'}
      </button>
      {result && <ResultBox result={result} onSave={() => {}} />}
    </div>
  );
}

// ─── Histórico ────────────────────────────────────────────────────────────────
function HistoricoTab() {
  const { user } = useAuth();
  const [geracoes, setGeracoes] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('maquinawg_conteudo_geracoes').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setGeracoes(data); setLoading(false); });
  }, [user]);

  if (loading) return <div className="py-8 text-center text-gray-400">Carregando...</div>;
  if (geracoes.length === 0) return (
    <div className="py-16 text-center text-gray-400">
      <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p>Nenhuma geração salva ainda.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {geracoes.map(g => (
        <div key={g.id} className="glass-card overflow-hidden">
          <button className="w-full flex items-center justify-between p-4 text-left" onClick={() => setOpen(open === g.id ? null : g.id)}>
            <div className="flex items-center gap-3">
              <span className="capitalize font-medium">{g.tipo}</span>
              <span className="text-xs text-gray-400">{new Date(g.created_at).toLocaleString('pt-BR')}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open === g.id ? 'rotate-180' : ''}`} />
          </button>
          {open === g.id && (
            <div className="px-4 pb-4 border-t border-gray-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
              {g.resultado}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Content() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('copy');
  const clientes = useClientes();
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);

  const clienteCtx = buildClienteContext(clienteSelecionado);

  const saveGeneration = async (tipo: string, resultado: string, dados: object) => {
    if (!user) return;
    await supabase.from('maquinawg_conteudo_geracoes').insert([{
      user_id: user.id, tipo, resultado, prompt_dados: dados
    }]);
  };

  const tabs: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: 'copy', icon: <Megaphone className="w-4 h-4" />, label: 'Copy / Anúncio' },
    { id: 'post', icon: <PenLine className="w-4 h-4" />, label: 'Post & Caption' },
    { id: 'roteiro', icon: <Video className="w-4 h-4" />, label: 'Roteiro de Vídeo' },
    { id: 'historico', icon: <History className="w-4 h-4" />, label: 'Histórico' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Criação de Conteúdo</h1>
        <p className="text-gray-500 text-sm mt-1">Gere copies, posts e roteiros com GPT-4o — integrado ao briefing dos seus clientes.</p>
        {!hasOpenAIKey() && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            ⚠️ Configure <code className="font-mono bg-amber-100 px-1 rounded">VITE_OPENAI_API_KEY</code> no .env
          </div>
        )}
      </header>

      {/* Client Selector — always visible */}
      <ClienteSelector clientes={clientes} value={clienteSelecionado} onChange={setClienteSelecionado} />

      {/* Tabs */}
      <div className="flex gap-1 p-1 glass-panel bg-white/40 w-fit flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white shadow-sm text-appleDark' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="glass-card p-6">
        {tab === 'copy' && <CopyTab clienteCtx={clienteCtx} onResult={saveGeneration} />}
        {tab === 'post' && <PostTab clienteCtx={clienteCtx} onResult={saveGeneration} />}
        {tab === 'roteiro' && <RoteiroTab clienteCtx={clienteCtx} onResult={saveGeneration} />}
        {tab === 'historico' && <HistoricoTab />}
      </div>
    </div>
  );
}
