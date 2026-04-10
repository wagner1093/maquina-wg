import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Plus, X, ChevronDown, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import type { Cliente } from './Clients';

type Post = {
  id: string;
  cliente_id: string;
  titulo: string;
  descricao: string | null;
  tipo_conteudo: string | null;
  rede_social: string | null;
  data_publicacao: string;
  status: string;
  legenda: string | null;
  hashtags: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  'Ideia': 'bg-gray-400',
  'Producao': 'bg-amber-400',
  'Agendado': 'bg-blue-400',
  'Publicado': 'bg-green-500',
};

const STATUS_LABEL: Record<string, string> = {
  'Ideia': 'Ideia',
  'Producao': 'Em Produção',
  'Agendado': 'Agendado',
  'Publicado': 'Publicado',
};

const REDES = ['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'YouTube'];
const TIPOS = ['Post', 'Reels', 'Stories', 'Carrossel', 'Vídeo', 'Artigo'];
const STATUS_OPTS = ['Ideia', 'Producao', 'Agendado', 'Publicado'];

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function EditorialCalendar() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterCliente, setFilterCliente] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Form
  const [fTitulo, setFTitulo] = useState('');
  const [fCliente, setFCliente] = useState('');
  const [fRede, setFRede] = useState('');
  const [fTipo, setFTipo] = useState('');
  const [fData, setFData] = useState('');
  const [fStatus, setFStatus] = useState('Ideia');
  const [fDescricao, setFDescricao] = useState('');
  const [fLegenda, setFLegenda] = useState('');
  const [fHashtags, setFHashtags] = useState('');

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    const [p, c] = await Promise.all([
      supabase.from('maquinawg_calendario_editorial').select('*').eq('user_id', user.id),
      supabase.from('maquinawg_clientes').select('id, nome, empresa').eq('user_id', user.id).order('nome'),
    ]);
    setPosts(p.data ?? []);
    setClientes(c.data as Cliente[] ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !fTitulo || !fCliente || !fData) return;
    await supabase.from('maquinawg_calendario_editorial').insert([{
      user_id: user.id, cliente_id: fCliente, titulo: fTitulo,
      descricao: fDescricao || null, tipo_conteudo: fTipo || null,
      rede_social: fRede || null, data_publicacao: fData,
      status: fStatus, legenda: fLegenda || null, hashtags: fHashtags || null,
    }]);
    setFTitulo(''); setFCliente(''); setFRede(''); setFTipo('');
    setFData(selectedDay ?? ''); setFStatus('Ideia'); setFDescricao('');
    setFLegenda(''); setFHashtags('');
    setShowAdd(false);
    fetchAll();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('maquinawg_calendario_editorial').update({ status }).eq('id', id);
    fetchAll();
  };

  const excluirPost = async (id: string) => {
    await supabase.from('maquinawg_calendario_editorial').delete().eq('id', id);
    setSelectedPost(null);
    fetchAll();
  };

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getPostsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return posts.filter(p => {
      const match = p.data_publicacao === dateStr;
      const clienteMatch = !filterCliente || p.cliente_id === filterCliente;
      return match && clienteMatch;
    });
  };

  const openDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDay(dateStr);
    setFData(dateStr);
    setShowAdd(true);
  };

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const clienteNome = (id: string) => clientes.find(c => c.id === id)?.nome ?? '';

  const cells = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  while (cells.length % 7 !== 0) cells.push(null);

  const totalPosts = posts.filter(p => {
    const d = new Date(p.data_publicacao + 'T00:00:00');
    return d.getMonth() === month && d.getFullYear() === year;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Calendar className="w-8 h-8 text-appleBlue" /> Calendário Editorial
          </h1>
          <p className="text-gray-500 text-sm mt-1">Planeje e visualize todos os conteúdos dos seus clientes.</p>
        </div>
        <button onClick={() => { setSelectedDay(null); setFData(''); setShowAdd(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Post
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATUS_OPTS.map(s => (
          <div key={s} className="glass-card p-4 flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[s]}`} />
            <div>
              <p className="text-xs text-gray-400">{STATUS_LABEL[s]}</p>
              <p className="font-bold">{totalPosts.filter(p => p.status === s).length}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Nav */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
          <h2 className="font-semibold text-lg w-44 text-center">{MESES[month]} {year}</h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
        </div>
        <div className="relative">
          <select className="input-field appearance-none pr-8 min-w-48" value={filterCliente} onChange={e => setFilterCliente(e.target.value)}>
            <option value="">Todos os clientes</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="glass-panel overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-7 bg-gray-50/80 border-b border-gray-100">
          {DIAS_SEMANA.map(d => (
            <div key={d} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{d}</div>
          ))}
        </div>

        {/* Cells */}
        {loading ? (
          <div className="p-12 text-center text-gray-400">Carregando...</div>
        ) : (
          <div className="grid grid-cols-7 divide-x divide-gray-100">
            {cells.map((day, i) => {
              const dayPosts = day ? getPostsForDay(day) : [];
              return (
                <div
                  key={i}
                  onClick={() => day && openDay(day)}
                  className={`min-h-[90px] p-2 border-b border-gray-100 transition-colors ${day ? 'cursor-pointer hover:bg-blue-50/30' : 'bg-gray-50/30'} ${isToday(day!) ? 'bg-blue-50' : ''}`}
                >
                  {day && (
                    <>
                      <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday(day) ? 'bg-appleBlue text-white' : 'text-gray-600'}`}>
                        {day}
                      </span>
                      <div className="space-y-1">
                        {dayPosts.slice(0, 3).map(p => (
                          <div
                            key={p.id}
                            onClick={e => { e.stopPropagation(); setSelectedPost(p); }}
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md text-white truncate cursor-pointer hover:opacity-90 ${STATUS_COLORS[p.status]}`}
                          >
                            {p.titulo}
                          </div>
                        ))}
                        {dayPosts.length > 3 && (
                          <div className="text-[10px] text-gray-400 pl-1">+{dayPosts.length - 3} mais</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="font-medium">Status:</span>
        {Object.entries(STATUS_COLORS).map(([s, c]) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${c}`} />{STATUS_LABEL[s]}
          </span>
        ))}
      </div>

      {/* Modal: Add Post */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-semibold text-lg">Novo Conteúdo</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label-field">Título do Conteúdo *</label>
                <input type="text" className="input-field" required value={fTitulo} onChange={e => setFTitulo(e.target.value)} placeholder="Ex: 5 dicas para aumentar vendas" />
              </div>
              <div>
                <label className="label-field">Cliente *</label>
                <div className="relative">
                  <select className="input-field appearance-none" required value={fCliente} onChange={e => setFCliente(e.target.value)}>
                    <option value="">Selecionar...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="label-field">Data de Publicação *</label>
                <input type="date" className="input-field" required value={fData} onChange={e => setFData(e.target.value)} />
              </div>
              <div>
                <label className="label-field">Rede Social</label>
                <div className="relative">
                  <select className="input-field appearance-none" value={fRede} onChange={e => setFRede(e.target.value)}>
                    <option value="">Selecionar...</option>
                    {REDES.map(r => <option key={r}>{r}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="label-field">Tipo de Conteúdo</label>
                <div className="relative">
                  <select className="input-field appearance-none" value={fTipo} onChange={e => setFTipo(e.target.value)}>
                    <option value="">Selecionar...</option>
                    {TIPOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="label-field">Status</label>
                <div className="relative">
                  <select className="input-field appearance-none" value={fStatus} onChange={e => setFStatus(e.target.value)}>
                    {STATUS_OPTS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="label-field">Descrição / Pauta</label>
                <textarea className="input-field resize-none" rows={2} value={fDescricao} onChange={e => setFDescricao(e.target.value)} placeholder="Sobre o que vai ser esse conteúdo..." />
              </div>
              <div className="md:col-span-2">
                <label className="label-field">Legenda pronta</label>
                <textarea className="input-field resize-none" rows={3} value={fLegenda} onChange={e => setFLegenda(e.target.value)} placeholder="Texto completo para publicação..." />
              </div>
              <div className="md:col-span-2">
                <label className="label-field">Hashtags</label>
                <input type="text" className="input-field" value={fHashtags} onChange={e => setFHashtags(e.target.value)} placeholder="#marketing #negócios..." />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Post */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full text-white ${STATUS_COLORS[selectedPost.status]}`}>
                  {STATUS_LABEL[selectedPost.status]}
                </span>
                <h2 className="font-semibold text-lg mt-2">{selectedPost.titulo}</h2>
              </div>
              <button onClick={() => setSelectedPost(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><p className="text-xs text-gray-400">Cliente</p><p className="font-medium">{clienteNome(selectedPost.cliente_id)}</p></div>
                <div><p className="text-xs text-gray-400">Rede</p><p className="font-medium">{selectedPost.rede_social || '—'}</p></div>
                <div><p className="text-xs text-gray-400">Data</p><p className="font-medium">{new Date(selectedPost.data_publicacao + 'T12:00:00').toLocaleDateString('pt-BR')}</p></div>
              </div>
              {selectedPost.descricao && <div><p className="text-xs text-gray-400 mb-1">Pauta</p><p className="text-sm">{selectedPost.descricao}</p></div>}
              {selectedPost.legenda && <div><p className="text-xs text-gray-400 mb-1">Legenda</p><p className="text-sm bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{selectedPost.legenda}</p></div>}
              {selectedPost.hashtags && <p className="text-xs text-appleBlue">{selectedPost.hashtags}</p>}

              <div>
                <p className="text-xs text-gray-400 mb-2">Atualizar status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTS.map(s => (
                    <button key={s} onClick={() => { updateStatus(selectedPost.id, s); setSelectedPost({ ...selectedPost, status: s }); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-white ${STATUS_COLORS[s]} ${selectedPost.status === s ? 'ring-2 ring-offset-1 ring-gray-400' : 'opacity-70 hover:opacity-100'}`}>
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => excluirPost(selectedPost.id)} className="w-full text-sm text-red-500 hover:text-red-700 hover:bg-red-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                <X className="w-4 h-4" /> Excluir este conteúdo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
