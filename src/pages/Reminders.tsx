import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import {
  Bell, Plus, X, Check, ChevronDown, AlertCircle,
  Clock, Calendar, User, Trash2
} from 'lucide-react';
import type { Cliente } from './Clients';

type Lembrete = {
  id: string;
  titulo: string;
  descricao: string | null;
  data_lembrete: string | null;
  prioridade: string;
  status: string;
  cliente_id: string | null;
  created_at: string;
};

const PRIORIDADES = ['Alta', 'Media', 'Baixa'];

const prioColor = (p: string) =>
  p === 'Alta' ? 'bg-red-100 text-red-700 border-red-200' :
  p === 'Media' ? 'bg-amber-100 text-amber-700 border-amber-200' :
  'bg-green-100 text-green-700 border-green-200';

const prioIcon = (p: string) =>
  p === 'Alta' ? <AlertCircle className="w-3.5 h-3.5" /> :
  p === 'Media' ? <Clock className="w-3.5 h-3.5" /> :
  <Check className="w-3.5 h-3.5" />;

export default function Reminders() {
  const { user } = useAuth();
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filtro, setFiltro] = useState<'Todos' | 'Ativo' | 'Concluido'>('Ativo');

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState('');
  const [prioridade, setPrioridade] = useState('Media');
  const [clienteId, setClienteId] = useState('');

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    const [l, c] = await Promise.all([
      supabase.from('maquinawg_lembretes').select('*').eq('user_id', user.id).order('data_lembrete', { ascending: true }),
      supabase.from('maquinawg_clientes').select('id, nome, empresa').eq('user_id', user.id).order('nome'),
    ]);
    setLembretes(l.data ?? []);
    setClientes(c.data as Cliente[] ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !titulo) return;
    await supabase.from('maquinawg_lembretes').insert([{
      user_id: user.id, titulo, descricao: descricao || null,
      data_lembrete: data ? new Date(data).toISOString() : null,
      prioridade, status: 'Ativo',
      cliente_id: clienteId || null,
    }]);
    setTitulo(''); setDescricao(''); setData(''); setPrioridade('Media'); setClienteId('');
    setShowAdd(false);
    fetchAll();
  };

  const concluir = async (id: string) => {
    await supabase.from('maquinawg_lembretes').update({ status: 'Concluido' }).eq('id', id);
    fetchAll();
  };

  const excluir = async (id: string) => {
    await supabase.from('maquinawg_lembretes').delete().eq('id', id);
    fetchAll();
  };

  const hoje = new Date();
  const filtered = lembretes.filter(l => filtro === 'Todos' ? true : l.status === filtro);

  const getDaysUntil = (dateStr: string | null) => {
    if (!dateStr) return null;
    const diff = Math.ceil((new Date(dateStr).getTime() - hoje.getTime()) / (1000 * 3600 * 24));
    return diff;
  };

  const urgentes = lembretes.filter(l => {
    if (l.status !== 'Ativo') return false;
    if (!l.data_lembrete) return l.prioridade === 'Alta';
    const d = getDaysUntil(l.data_lembrete);
    return d !== null && d <= 1;
  }).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Bell className="w-8 h-8 text-appleBlue" /> Lembretes
          </h1>
          <p className="text-gray-500 text-sm mt-1">Alertas internos vinculados a clientes e prazos.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Lembrete
        </button>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Ativos', val: lembretes.filter(l => l.status === 'Ativo').length, color: 'border-l-appleBlue' },
          { label: 'Urgentes / Hoje', val: urgentes, color: 'border-l-red-500' },
          { label: 'Concluídos', val: lembretes.filter(l => l.status === 'Concluido').length, color: 'border-l-green-500' },
        ].map(k => (
          <div key={k.label} className={`glass-card p-4 border-l-4 ${k.color}`}>
            <p className="text-xs text-gray-400 uppercase tracking-wider">{k.label}</p>
            <p className="text-2xl font-bold mt-1">{k.val}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['Ativo', 'Todos', 'Concluido'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filtro === f ? 'bg-appleBlue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f === 'Ativo' ? 'Pendentes' : f === 'Concluido' ? 'Concluídos' : 'Todos'}
          </button>
        ))}
      </div>

      {/* Modal Add */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-semibold text-lg">Novo Lembrete</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="label-field">Título *</label>
                <input type="text" className="input-field" required value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Enviar relatório cliente X" />
              </div>
              <div>
                <label className="label-field">Descrição</label>
                <textarea className="input-field resize-none" rows={2} value={descricao} onChange={e => setDescricao(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Data / Prazo</label>
                  <input type="datetime-local" className="input-field" value={data} onChange={e => setData(e.target.value)} />
                </div>
                <div>
                  <label className="label-field">Prioridade</label>
                  <div className="relative">
                    <select className="input-field appearance-none" value={prioridade} onChange={e => setPrioridade(e.target.value)}>
                      {PRIORIDADES.map(p => <option key={p}>{p}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="label-field">Vincular ao cliente (opcional)</label>
                <div className="relative">
                  <select className="input-field appearance-none" value={clienteId} onChange={e => setClienteId(e.target.value)}>
                    <option value="">Sem cliente</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} — {c.empresa}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="py-12 text-center text-gray-400">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Nenhum lembrete {filtro === 'Ativo' ? 'pendente' : 'encontrado'}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(l => {
            const days = getDaysUntil(l.data_lembrete);
            const isOverdue = days !== null && days < 0;
            const isToday = days !== null && days === 0;
            const clienteNome = clientes.find(c => c.id === l.cliente_id)?.nome;

            return (
              <div key={l.id} className={`glass-card p-4 flex items-start gap-4 transition-opacity ${l.status === 'Concluido' ? 'opacity-60' : ''}`}>
                {/* Prioridade badge */}
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 mt-0.5 ${prioColor(l.prioridade)}`}>
                  {prioIcon(l.prioridade)} {l.prioridade}
                </span>

                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${l.status === 'Concluido' ? 'line-through text-gray-400' : 'text-appleDark'}`}>{l.titulo}</p>
                  {l.descricao && <p className="text-sm text-gray-500 mt-0.5">{l.descricao}</p>}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {l.data_lembrete && (
                      <span className={`flex items-center gap-1 text-xs font-medium ${isOverdue ? 'text-red-600' : isToday ? 'text-amber-600' : 'text-gray-400'}`}>
                        <Calendar className="w-3.5 h-3.5" />
                        {isOverdue ? `Atrasado ${Math.abs(days!)}d` : isToday ? 'Hoje!' : `Em ${days}d`}
                        — {new Date(l.data_lembrete).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {clienteNome && (
                      <span className="flex items-center gap-1 text-xs text-appleBlue bg-blue-50 px-2 py-0.5 rounded-full">
                        <User className="w-3 h-3" />{clienteNome}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {l.status === 'Ativo' && (
                    <button onClick={() => concluir(l.id)} title="Concluir" className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors">
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => excluir(l.id)} title="Excluir" className="p-2 hover:bg-red-50 text-red-400 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
