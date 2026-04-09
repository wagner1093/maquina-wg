import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import {
  Plus, Search, Users, ChevronDown, X, Edit2, CheckCircle,
  Globe, Phone, Mail, Megaphone, TrendingUp, Server,
  Eye, Save, ArrowLeft, Share2
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
export type Cliente = {
  id: string;
  user_id: string;
  nome: string;
  empresa: string;
  segmento: string | null;
  contato_nome: string | null;
  contato_email: string | null;
  contato_telefone: string | null;
  site: string | null;
  status: string;
  servicos: string[];
  // Social Media
  sm_ativo: boolean;
  sm_redes: string[] | null;
  sm_objetivo: string | null;
  sm_tom_de_voz: string | null;
  sm_publico_alvo: string | null;
  sm_descricao_marca: string | null;
  sm_pilares: string[] | null;
  sm_identidade_visual: string | null;
  sm_concorrentes: string | null;
  sm_restricoes: string | null;
  // Tráfego
  tp_ativo: boolean;
  tp_plataformas: string[] | null;
  tp_objetivo: string | null;
  tp_orcamento_mensal: number | null;
  // Hospedagem
  hosp_ativo: boolean;
  hosp_dominio: string | null;
  hosp_vencimento: string | null;
  hosp_valor: number | null;
  observacoes: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SEGMENTOS = ['E-commerce', 'Saúde e Bem-estar', 'Educação', 'Imóveis', 'Alimentação', 'Moda e Beleza', 'Tecnologia', 'Serviços', 'Consultoria', 'Indústria', 'Outro'];
const REDES = ['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'YouTube', 'Pinterest'];
const PLATAFORMAS_ADS = ['Meta Ads', 'Google Ads', 'TikTok Ads', 'LinkedIn Ads'];
const TONS_DE_VOZ = ['Formal e Profissional', 'Descontraído e Amigável', 'Inspirador e Motivacional', 'Humorístico', 'Educativo e Didático', 'Urgente e Persuasivo', 'Elegante e Premium'];
const OBJETIVOS_SM = ['Vender produtos/serviços', 'Gerar autoridade e credibilidade', 'Engajamento e comunidade', 'Atrair leads qualificados', 'Brand awareness'];
const PILARES_OPCOES = ['Educação', 'Vendas', 'Bastidores', 'Cases e provas sociais', 'Entretenimento', 'Inspiração', 'Novidades e lançamentos'];

const emptyCliente = (): Partial<Cliente> => ({
  nome: '', empresa: '', segmento: '', contato_nome: '', contato_email: '',
  contato_telefone: '', site: '', status: 'Ativo', servicos: [],
  sm_ativo: false, sm_redes: [], sm_objetivo: '', sm_tom_de_voz: '', sm_publico_alvo: '',
  sm_descricao_marca: '', sm_pilares: [], sm_identidade_visual: '', sm_concorrentes: '', sm_restricoes: '',
  tp_ativo: false, tp_plataformas: [], tp_objetivo: '', tp_orcamento_mensal: 0,
  hosp_ativo: false, hosp_dominio: '', hosp_vencimento: '', hosp_valor: 0,
  observacoes: '',
});

const TagToggle = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
      active ? 'bg-appleBlue text-white border-appleBlue shadow-sm' : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
    }`}
  >
    {active && <span className="mr-1">✓</span>}
    {label}
  </button>
);

const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="border-b border-gray-100 pb-3 mb-4">
    <h3 className="font-semibold text-appleDark">{title}</h3>
    {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
  </div>
);

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

// ─── Service Badge ─────────────────────────────────────────────────────────────
const ServiceBadge = ({ servico }: { servico: string }) => {
  const map: Record<string, { color: string; icon: React.ReactNode }> = {
    'Social Media': { color: 'bg-pink-100 text-pink-700', icon: <Share2 className="w-3 h-3" /> },
    'Tráfego Pago': { color: 'bg-purple-100 text-purple-700', icon: <TrendingUp className="w-3 h-3" /> },
    'Hospedagem': { color: 'bg-blue-100 text-blue-700', icon: <Server className="w-3 h-3" /> },
    'Site / Landing Page': { color: 'bg-green-100 text-green-700', icon: <Globe className="w-3 h-3" /> },
    'Consultoria': { color: 'bg-orange-100 text-orange-700', icon: <Megaphone className="w-3 h-3" /> },
  };
  const s = map[servico] ?? { color: 'bg-gray-100 text-gray-600', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
      {s.icon}{servico}
    </span>
  );
};

// ─── Client Card ───────────────────────────────────────────────────────────────
const ClientCard = ({ cliente, onView, onEdit }: { cliente: Cliente; onView: () => void; onEdit: () => void }) => (
  <div className="glass-card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-appleBlue to-blue-400 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
          {cliente.nome.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-appleDark leading-tight">{cliente.nome}</p>
          <p className="text-xs text-gray-400">{cliente.empresa}</p>
        </div>
      </div>
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cliente.status === 'Ativo' ? 'bg-green-100 text-green-700' : cliente.status === 'Inativo' ? 'bg-gray-100 text-gray-500' : 'bg-yellow-100 text-yellow-700'}`}>
        {cliente.status}
      </span>
    </div>

    {/* Services */}
    {cliente.servicos?.length > 0 && (
      <div className="flex flex-wrap gap-1.5">
        {cliente.servicos.map(s => <ServiceBadge key={s} servico={s} />)}
      </div>
    )}

    {/* Info Row */}
    <div className="flex flex-col gap-1 text-xs text-gray-400">
      {cliente.segmento && <span>📁 {cliente.segmento}</span>}
      {cliente.contato_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{cliente.contato_email}</span>}
      {cliente.contato_telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{cliente.contato_telefone}</span>}
    </div>

    {/* Action Buttons */}
    <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
      <button onClick={onView} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-appleBlue bg-blue-50 py-2 rounded-lg hover:bg-blue-100 transition-colors">
        <Eye className="w-3.5 h-3.5" /> Ver Ficha
      </button>
      <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 py-2 rounded-lg hover:bg-gray-100 transition-colors">
        <Edit2 className="w-3.5 h-3.5" /> Editar
      </button>
    </div>
  </div>
);

// ─── Client Form ───────────────────────────────────────────────────────────────
function ClienteForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Partial<Cliente>;
  onSave: (data: Partial<Cliente>) => Promise<void>;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Cliente>>(initial);

  const set = (field: keyof Cliente, val: unknown) => setForm(prev => ({ ...prev, [field]: val }));

  const toggleArr = (field: keyof Cliente, val: string) => {
    const arr = (form[field] as string[]) ?? [];
    set(field, arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const toggleServico = (s: string) => {
    const arr = form.servicos ?? [];
    const has = arr.includes(s);
    const next = has ? arr.filter(x => x !== s) : [...arr, s];
    setForm(prev => ({
      ...prev,
      servicos: next,
      sm_ativo: next.includes('Social Media'),
      tp_ativo: next.includes('Tráfego Pago'),
      hosp_ativo: next.includes('Hospedagem'),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const SERVICOS_OPCOES = ['Social Media', 'Tráfego Pago', 'Hospedagem', 'Site / Landing Page', 'Consultoria'];

  const steps = [
    { id: 1, label: 'Dados Gerais' },
    { id: 2, label: 'Serviços' },
    ...(form.sm_ativo ? [{ id: 3, label: 'Social Media' }] : []),
    ...(form.tp_ativo ? [{ id: 4, label: 'Tráfego Pago' }] : []),
    ...(form.hosp_ativo ? [{ id: 5, label: 'Hospedagem' }] : []),
  ];

  const maxStep = steps[steps.length - 1]?.id ?? 2;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Step indicator */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setStep(s.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${step === s.id ? 'bg-appleBlue text-white' : step > s.id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
            >
              {step > s.id ? <CheckCircle className="w-3.5 h-3.5" /> : <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center text-[10px]">{s.id}</span>}
              {s.label}
            </button>
            {i < steps.length - 1 && <ChevronDown className="w-3 h-3 text-gray-300 rotate-[-90deg]" />}
          </div>
        ))}
      </div>

      <div className="glass-card p-6 space-y-5">
        {/* ── Step 1: Dados Gerais ── */}
        {step === 1 && (
          <>
            <SectionHeader title="Dados do Cliente" subtitle="Informações básicas e de contato" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nome do Cliente" required>
                <input type="text" className="input-field" value={form.nome ?? ''} onChange={e => set('nome', e.target.value)} placeholder="Ex: João Silva" />
              </Field>
              <Field label="Empresa / Negócio" required>
                <input type="text" className="input-field" value={form.empresa ?? ''} onChange={e => set('empresa', e.target.value)} placeholder="Nome da empresa" />
              </Field>
              <Field label="Segmento / Nicho">
                <div className="relative">
                  <select className="input-field appearance-none" value={form.segmento ?? ''} onChange={e => set('segmento', e.target.value)}>
                    <option value="">Selecionar...</option>
                    {SEGMENTOS.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </Field>
              <Field label="Status">
                <div className="relative">
                  <select className="input-field appearance-none" value={form.status ?? 'Ativo'} onChange={e => set('status', e.target.value)}>
                    {['Ativo', 'Pausado', 'Inativo', 'Lead', 'Proposta'].map(s => <option key={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </Field>
              <Field label="Nome do Contato">
                <input type="text" className="input-field" value={form.contato_nome ?? ''} onChange={e => set('contato_nome', e.target.value)} />
              </Field>
              <Field label="WhatsApp / Telefone">
                <input type="text" className="input-field" value={form.contato_telefone ?? ''} onChange={e => set('contato_telefone', e.target.value)} placeholder="(11) 99999-9999" />
              </Field>
              <Field label="E-mail">
                <input type="email" className="input-field" value={form.contato_email ?? ''} onChange={e => set('contato_email', e.target.value)} />
              </Field>
              <Field label="Site / Domínio">
                <input type="text" className="input-field" value={form.site ?? ''} onChange={e => set('site', e.target.value)} placeholder="www.empresa.com.br" />
              </Field>
              <div className="md:col-span-2">
                <Field label="Observações Gerais">
                  <textarea className="input-field resize-none" rows={3} value={form.observacoes ?? ''} onChange={e => set('observacoes', e.target.value)} placeholder="Notas internas, contexto do cliente..." />
                </Field>
              </div>
            </div>
          </>
        )}

        {/* ── Step 2: Serviços ── */}
        {step === 2 && (
          <>
            <SectionHeader title="Serviços Contratados" subtitle="Selecione todos os serviços que você presta para este cliente. Novas abas serão habilitadas para cada serviço." />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SERVICOS_OPCOES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleServico(s)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${(form.servicos ?? []).includes(s) ? 'border-appleBlue bg-appleBlue/5' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                >
                  <div className="mb-2"><ServiceBadge servico={s} /></div>
                  <p className="text-xs text-gray-500">Ativar módulo de {s}</p>
                </button>
              ))}
            </div>
            {(form.servicos ?? []).length === 0 && (
              <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                ⚠️ Selecione ao menos um serviço para habilitar as abas específicas.
              </p>
            )}
          </>
        )}

        {/* ── Step 3: Social Media ── */}
        {step === 3 && (
          <>
            <SectionHeader title="Brief de Social Media" subtitle="Essas informações serão usadas automaticamente ao gerar conteúdos para este cliente." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <Field label="Descrição da Marca / Empresa" required>
                  <textarea className="input-field resize-none" rows={4} value={form.sm_descricao_marca ?? ''} onChange={e => set('sm_descricao_marca', e.target.value)} placeholder="O que a empresa faz, qual problema resolve, diferenciais, missão, visão e valores. Quanto mais detalhado, melhor o conteúdo gerado." />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Público-Alvo" required>
                  <textarea className="input-field resize-none" rows={3} value={form.sm_publico_alvo ?? ''} onChange={e => set('sm_publico_alvo', e.target.value)} placeholder="Idade, gênero, profissão, dores, desejos, comportamentos, onde vivem, poder aquisitivo, o que consomem..." />
                </Field>
              </div>
              <Field label="Tom de Voz">
                <div className="relative">
                  <select className="input-field appearance-none" value={form.sm_tom_de_voz ?? ''} onChange={e => set('sm_tom_de_voz', e.target.value)}>
                    <option value="">Selecionar...</option>
                    {TONS_DE_VOZ.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </Field>
              <Field label="Objetivo Principal nas Redes">
                <div className="relative">
                  <select className="input-field appearance-none" value={form.sm_objetivo ?? ''} onChange={e => set('sm_objetivo', e.target.value)}>
                    <option value="">Selecionar...</option>
                    {OBJETIVOS_SM.map(o => <option key={o}>{o}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </Field>
              <div className="md:col-span-2">
                <Field label="Redes Sociais Ativas">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {REDES.map(r => <TagToggle key={r} label={r} active={(form.sm_redes ?? []).includes(r)} onClick={() => toggleArr('sm_redes', r)} />)}
                  </div>
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Pilares de Conteúdo">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {PILARES_OPCOES.map(p => <TagToggle key={p} label={p} active={(form.sm_pilares ?? []).includes(p)} onClick={() => toggleArr('sm_pilares', p)} />)}
                  </div>
                </Field>
              </div>
              <div>
                <Field label="Identidade Visual">
                  <textarea className="input-field resize-none" rows={2} value={form.sm_identidade_visual ?? ''} onChange={e => set('sm_identidade_visual', e.target.value)} placeholder="Cores, fontes, estilo visual..." />
                </Field>
              </div>
              <div>
                <Field label="Concorrentes">
                  <textarea className="input-field resize-none" rows={2} value={form.sm_concorrentes ?? ''} onChange={e => set('sm_concorrentes', e.target.value)} placeholder="Principais concorrentes a serem referenciados ou evitados..." />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Restrições / O que NÃO fazer">
                  <textarea className="input-field resize-none" rows={2} value={form.sm_restricoes ?? ''} onChange={e => set('sm_restricoes', e.target.value)} placeholder="Palavras proibidas, temas a evitar, qualquer restrição importante..." />
                </Field>
              </div>
            </div>
          </>
        )}

        {/* ── Step 4: Tráfego Pago ── */}
        {step === 4 && (
          <>
            <SectionHeader title="Tráfego Pago" subtitle="Detalhes das campanhas pagas deste cliente." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Field label="Plataformas de Anúncio">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {PLATAFORMAS_ADS.map(p => <TagToggle key={p} label={p} active={(form.tp_plataformas ?? []).includes(p)} onClick={() => toggleArr('tp_plataformas', p)} />)}
                  </div>
                </Field>
              </div>
              <Field label="Objetivo das Campanhas">
                <div className="relative">
                  <select className="input-field appearance-none" value={form.tp_objetivo ?? ''} onChange={e => set('tp_objetivo', e.target.value)}>
                    <option value="">Selecionar...</option>
                    {['Leads', 'Vendas', 'Tráfego', 'Brand Awareness', 'Engajamento'].map(o => <option key={o}>{o}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </Field>
              <Field label="Orçamento Mensal (R$)">
                <input type="number" step="0.01" className="input-field" value={form.tp_orcamento_mensal ?? ''} onChange={e => set('tp_orcamento_mensal', parseFloat(e.target.value))} />
              </Field>
            </div>
          </>
        )}

        {/* ── Step 5: Hospedagem ── */}
        {step === 5 && (
          <>
            <SectionHeader title="Hospedagem" subtitle="Domínio e dados de renovação." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Field label="Domínio Principal">
                  <input type="text" className="input-field" value={form.hosp_dominio ?? ''} onChange={e => set('hosp_dominio', e.target.value)} placeholder="www.empresa.com.br" />
                </Field>
              </div>
              <Field label="Data de Vencimento">
                <input type="date" className="input-field" value={form.hosp_vencimento ?? ''} onChange={e => set('hosp_vencimento', e.target.value)} />
              </Field>
              <Field label="Valor Anual (R$)">
                <input type="number" step="0.01" className="input-field" value={form.hosp_valor ?? ''} onChange={e => set('hosp_valor', parseFloat(e.target.value))} />
              </Field>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="btn-secondary flex items-center gap-1.5">
            <X className="w-4 h-4" /> Cancelar
          </button>
          {step > 1 && (
            <button type="button" onClick={() => setStep(s => s - 1)} className="btn-secondary flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Anterior
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {step < maxStep ? (
            <button type="button" onClick={() => setStep(s => s + 1)} className="btn-primary flex items-center gap-2">
              Próximo <ChevronDown className="w-4 h-4 -rotate-90" />
            </button>
          ) : (
            <button type="button" onClick={handleSave} disabled={saving || !form.nome || !form.empresa} className="btn-primary flex items-center gap-2">
              {saving ? 'Salvando...' : <><Save className="w-4 h-4" /> Salvar Cliente</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Client Ficha (Read-only detail view) ─────────────────────────────────────
function ClienteFicha({ cliente, onEdit, onBack }: { cliente: Cliente; onEdit: () => void; onBack: () => void }) {
  const InfoRow = ({ label, value }: { label: string; value?: string | null }) =>
    value ? <div className="flex flex-col gap-0.5"><span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span><span className="text-sm font-medium text-appleDark">{value}</span></div> : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{cliente.nome}</h2>
          <p className="text-gray-400 text-sm">{cliente.empresa} · {cliente.segmento}</p>
        </div>
        <button onClick={onEdit} className="btn-secondary flex items-center gap-2">
          <Edit2 className="w-4 h-4" /> Editar
        </button>
      </div>

      {/* Services */}
      <div className="flex gap-2 flex-wrap">
        {cliente.servicos?.map(s => <ServiceBadge key={s} servico={s} />)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contato */}
        <div className="glass-card p-5 space-y-3">
          <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider">Contato</h3>
          <InfoRow label="Responsável" value={cliente.contato_nome} />
          <InfoRow label="E-mail" value={cliente.contato_email} />
          <InfoRow label="Telefone" value={cliente.contato_telefone} />
          <InfoRow label="Site" value={cliente.site} />
        </div>

        {/* Observações */}
        {cliente.observacoes && (
          <div className="glass-card p-5">
            <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-3">Observações</h3>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{cliente.observacoes}</p>
          </div>
        )}

        {/* Social Media Brief */}
        {cliente.sm_ativo && (
          <div className="glass-card p-5 space-y-4 md:col-span-2">
            <h3 className="font-semibold text-pink-600 flex items-center gap-2">
              <Share2 className="w-4 h-4" /> Brief de Social Media
            </h3>
            {cliente.sm_descricao_marca && (
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wider">Descrição da Marca</span>
                <p className="text-sm text-gray-700 mt-1 leading-relaxed">{cliente.sm_descricao_marca}</p>
              </div>
            )}
            {cliente.sm_publico_alvo && (
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wider">Público-Alvo</span>
                <p className="text-sm text-gray-700 mt-1 leading-relaxed">{cliente.sm_publico_alvo}</p>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoRow label="Tom de Voz" value={cliente.sm_tom_de_voz} />
              <InfoRow label="Objetivo" value={cliente.sm_objetivo} />
              <InfoRow label="Redes Ativas" value={cliente.sm_redes?.join(', ')} />
              <InfoRow label="Pilares" value={cliente.sm_pilares?.join(', ')} />
            </div>
            {cliente.sm_restricoes && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                <span className="text-xs font-semibold text-red-700 uppercase">⚠️ Restrições</span>
                <p className="text-sm text-red-600 mt-1">{cliente.sm_restricoes}</p>
              </div>
            )}
          </div>
        )}

        {/* Tráfego Pago */}
        {cliente.tp_ativo && (
          <div className="glass-card p-5 space-y-3">
            <h3 className="font-semibold text-purple-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Tráfego Pago
            </h3>
            <InfoRow label="Plataformas" value={cliente.tp_plataformas?.join(', ')} />
            <InfoRow label="Objetivo" value={cliente.tp_objetivo} />
            <InfoRow label="Orçamento Mensal" value={cliente.tp_orcamento_mensal ? `R$ ${Number(cliente.tp_orcamento_mensal).toFixed(2)}` : undefined} />
          </div>
        )}

        {/* Hospedagem */}
        {cliente.hosp_ativo && (
          <div className="glass-card p-5 space-y-3">
            <h3 className="font-semibold text-appleBlue flex items-center gap-2">
              <Server className="w-4 h-4" /> Hospedagem
            </h3>
            <InfoRow label="Domínio" value={cliente.hosp_dominio} />
            <InfoRow label="Vencimento" value={cliente.hosp_vencimento ? new Date(cliente.hosp_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : undefined} />
            <InfoRow label="Valor Anual" value={cliente.hosp_valor ? `R$ ${Number(cliente.hosp_valor).toFixed(2)}` : undefined} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Clients() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterServico, setFilterServico] = useState('');
  const [view, setView] = useState<'grid' | 'form' | 'ficha'>('grid');
  const [editing, setEditing] = useState<Partial<Cliente> | null>(null);
  const [viewing, setViewing] = useState<Cliente | null>(null);

  const fetch = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('maquinawg_clientes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setClientes(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [user]);

  const handleSave = async (form: Partial<Cliente>) => {
    if (!user) return;
    if (form.id) {
      await supabase.from('maquinawg_clientes').update({ ...form, updated_at: new Date().toISOString() }).eq('id', form.id);
    } else {
      await supabase.from('maquinawg_clientes').insert([{ ...form, user_id: user.id }]);
    }
    await fetch();
    setView('grid');
    setEditing(null);
  };

  const openNew = () => { setEditing(emptyCliente()); setView('form'); };
  const openEdit = (c: Cliente) => { setEditing(c); setView('form'); };
  const openView = (c: Cliente) => { setViewing(c); setView('ficha'); };

  const SERVICOS_FILTER = ['Social Media', 'Tráfego Pago', 'Hospedagem', 'Site / Landing Page', 'Consultoria'];

  const filtered = clientes.filter(c => {
    const matchSearch = c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.empresa.toLowerCase().includes(search.toLowerCase());
    const matchServico = !filterServico || (c.servicos ?? []).includes(filterServico);
    return matchSearch && matchServico;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      {view === 'grid' && (
        <>
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
              <p className="text-gray-500 text-sm mt-1">Cadastro central — conectado a todos os módulos do sistema.</p>
            </div>
            <button onClick={openNew} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Novo Cliente
            </button>
          </header>

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total', val: clientes.length, color: 'border-l-gray-400' },
              { label: 'Ativos', val: clientes.filter(c => c.status === 'Ativo').length, color: 'border-l-green-500' },
              { label: 'Social Media', val: clientes.filter(c => c.sm_ativo).length, color: 'border-l-pink-400' },
              { label: 'Tráfego Pago', val: clientes.filter(c => c.tp_ativo).length, color: 'border-l-purple-400' },
            ].map(k => (
              <div key={k.label} className={`glass-card p-4 border-l-4 ${k.color}`}>
                <p className="text-xs text-gray-400 uppercase tracking-wider">{k.label}</p>
                <p className="text-2xl font-bold mt-1">{k.val}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" className="input-field pl-9" placeholder="Buscar cliente ou empresa..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="relative">
              <select className="input-field appearance-none pr-8 min-w-48" value={filterServico} onChange={e => setFilterServico(e.target.value)}>
                <option value="">Todos os serviços</option>
                {SERVICOS_FILTER.map(s => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="py-12 text-center text-gray-400">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="font-medium">Nenhum cliente encontrado.</p>
              <p className="text-sm mt-1">Clique em "Novo Cliente" para começar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(c => (
                <ClientCard key={c.id} cliente={c} onView={() => openView(c)} onEdit={() => openEdit(c)} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Form View */}
      {view === 'form' && editing && (
        <>
          <header className="flex items-center gap-3">
            <button onClick={() => { setView('grid'); setEditing(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">{editing.id ? 'Editar Cliente' : 'Novo Cliente'}</h1>
              <p className="text-gray-400 text-sm">{editing.id ? editing.nome : 'Preencha as informações do cliente e seus serviços.'}</p>
            </div>
          </header>
          <ClienteForm initial={editing} onSave={handleSave} onCancel={() => { setView('grid'); setEditing(null); }} />
        </>
      )}

      {/* Ficha View */}
      {view === 'ficha' && viewing && (
        <ClienteFicha
          cliente={viewing}
          onEdit={() => { setEditing(viewing); setView('form'); }}
          onBack={() => { setViewing(null); setView('grid'); }}
        />
      )}
    </div>
  );
}
