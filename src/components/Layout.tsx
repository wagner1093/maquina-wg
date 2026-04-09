
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="flex bg-background min-h-screen text-appleDark font-sans selection:bg-appleBlue selection:text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 md:px-12 py-8 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center">
        <div className="min-h-full glass-panel p-6 md:p-8 backdrop-blur-3xl bg-white/60">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
