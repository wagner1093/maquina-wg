import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, Server, Sparkles, MessageSquare, LogOut, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { signOut, user } = useAuth();

  const links = [
    { to: '/', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Hub', end: true },
    { to: '/clients', icon: <Users className="w-5 h-5" />, label: 'Clientes', end: false, highlight: true },
    { to: '/finance', icon: <Wallet className="w-5 h-5" />, label: 'Financeiro', end: false },
    { to: '/hosting', icon: <Server className="w-5 h-5" />, label: 'Hospedagem', end: false },
    { to: '/traffic', icon: <TrendingUp className="w-5 h-5" />, label: 'Tráfego Pago', end: false },
    { to: '/content', icon: <Sparkles className="w-5 h-5" />, label: 'Conteúdo', end: false },
    { to: '/assistant', icon: <MessageSquare className="w-5 h-5" />, label: 'IA Assistente', end: false },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-200/50 bg-surface/50 backdrop-blur-2xl flex flex-col h-screen sticky top-0 hidden md:flex">
      <div className="p-6 border-b border-gray-100/60">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <span>My System</span>
          <span className="bg-appleBlue text-white text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">Pro</span>
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">Sistema Pessoal WG</p>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `apple-sidebar-link ${isActive ? 'apple-sidebar-link-active' : 'apple-sidebar-link-inactive'} ${link.highlight && !isActive ? 'border border-appleBlue/20 bg-blue-50/50 text-appleBlue hover:bg-blue-100/50' : ''}`
            }
          >
            {link.icon}
            <span>{link.label}</span>
            {link.highlight && (
              <span className="ml-auto text-[10px] font-bold bg-appleBlue text-white px-1.5 py-0.5 rounded uppercase">Hub</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200/50">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 mb-2 truncate">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-appleBlue to-blue-400 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <span className="truncate text-xs">{user?.email}</span>
        </div>
        <button
          onClick={signOut}
          className="w-full text-left apple-sidebar-link text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" /> Sair do Sistema
        </button>
      </div>
    </aside>
  );
}
