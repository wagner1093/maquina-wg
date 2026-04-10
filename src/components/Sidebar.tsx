import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, Server, Sparkles, MessageSquare, LogOut,
  TrendingUp, Users, Bell, Calendar, FileText, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export default function Sidebar() {
  const { signOut, user } = useAuth();
  const [urgentCount, setUrgentCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const check = async () => {
      const { data } = await supabase
        .from('maquinawg_lembretes')
        .select('id, data_lembrete, prioridade')
        .eq('user_id', user.id)
        .eq('status', 'Ativo');
      const now = new Date();
      const count = (data ?? []).filter(l => {
        if (l.prioridade === 'Alta' && !l.data_lembrete) return true;
        if (!l.data_lembrete) return false;
        const diff = Math.ceil((new Date(l.data_lembrete).getTime() - now.getTime()) / (1000 * 3600 * 24));
        return diff <= 1;
      }).length;
      setUrgentCount(count);
    };
    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [user]);

  type LinkItem = {
    to: string;
    icon: React.ReactNode;
    label: string;
    end?: boolean;
    highlight?: boolean;
    badge?: number;
  };

  const groups: { title: string; links: LinkItem[] }[] = [
    {
      title: 'Geral',
      links: [
        { to: '/', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard', end: true },
        { to: '/reminders', icon: <Bell className="w-4 h-4" />, label: 'Lembretes', badge: urgentCount },
      ],
    },
    {
      title: 'Comercial',
      links: [
        { to: '/clients', icon: <Users className="w-4 h-4" />, label: 'Clientes', highlight: true },
        { to: '/pipeline', icon: <TrendingUp className="w-4 h-4" />, label: 'Pipeline de Vendas' },
        { to: '/proposals', icon: <FileText className="w-4 h-4" />, label: 'Propostas IA' },
      ],
    },
    {
      title: 'Operacional',
      links: [
        { to: '/finance', icon: <Wallet className="w-4 h-4" />, label: 'Financeiro' },
        { to: '/hosting', icon: <Server className="w-4 h-4" />, label: 'Hospedagem' },
        { to: '/traffic', icon: <TrendingUp className="w-4 h-4" />, label: 'Tráfego Pago' },
      ],
    },
    {
      title: 'Conteúdo',
      links: [
        { to: '/calendar', icon: <Calendar className="w-4 h-4" />, label: 'Calendário Editorial' },
        { to: '/content', icon: <Sparkles className="w-4 h-4" />, label: 'Criação com IA' },
        { to: '/assistant', icon: <MessageSquare className="w-4 h-4" />, label: 'IA Assistente' },
      ],
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-200/50 bg-surface/50 backdrop-blur-2xl flex flex-col h-screen sticky top-0 hidden md:flex">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100/60">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span>My System</span>
          <span className="bg-appleBlue text-white text-[9px] uppercase font-bold px-1.5 py-0.5 rounded">Pro</span>
        </h2>
        <p className="text-[11px] text-gray-400 mt-0.5">Sistema Pessoal WG</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {groups.map(group => (
          <div key={group.title}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 mb-1.5">{group.title}</p>
            <div className="space-y-0.5">
              {group.links.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all group
                    ${isActive
                      ? 'bg-appleBlue text-white shadow-sm'
                      : link.highlight
                        ? 'text-appleBlue bg-blue-50/60 hover:bg-blue-100/60 border border-appleBlue/20'
                        : 'text-gray-600 hover:bg-gray-100/70 hover:text-appleDark'
                    }`
                  }
                >
                  {link.icon}
                  <span className="flex-1">{link.label}</span>
                  {link.badge && link.badge > 0 ? (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {link.badge}
                    </span>
                  ) : null}
                  {link.highlight && !link.badge && (
                    <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-gray-200/50">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 mb-1 truncate">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-appleBlue to-blue-400 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <span className="truncate text-xs">{user?.email}</span>
        </div>
        <button
          onClick={signOut}
          className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sair do Sistema
        </button>
      </div>
    </aside>
  );
}
