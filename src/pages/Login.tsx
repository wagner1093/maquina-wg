import React, { useState } from 'react';
import { supabase } from '../supabase';
import { LogIn, KeyRound } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // Tenta fazer login primeiro
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    
    // Se o login falhar porque a conta não existe, vamos criá-la automaticamente
    if (signInError && signInError.message.includes('Invalid login credentials')) {
      const { error: signUpError, data } = await supabase.auth.signUp({ email, password });
      
      if (signUpError) {
        setError(signUpError.message);
      } else if (data?.user?.identities?.length === 0) {
        setError("Este e-mail já está cadastrado, e a senha informada está incorreta.");
      } else {
        setMessage("Conta Nova Criada com sucesso! Você já está sendo autenticado (ou verifique seu e-mail se solicitado).");
      }
    } else if (signInError) {
      setError(signInError.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-3xl"></div>
      
      <div className="relative glass-card p-8 md:p-12 w-full max-w-md mx-4 text-center">
        <div className="w-16 h-16 bg-appleBlue/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-appleBlue/20">
          <KeyRound className="w-8 h-8 text-appleBlue" />
        </div>
        
        <h1 className="text-2xl font-semibold mb-2">My System</h1>
        <p className="text-gray-500 text-sm mb-8">Sign in or create your productivity hub</p>

        {error && (
          <div className="bg-red-50 text-danger text-sm p-3 rounded-lg border border-red-100 mb-6 font-medium">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg border border-green-100 mb-6 font-medium">
            {message}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="text-left">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Email</label>
            <input
              type="email"
              required
              className="input-field"
              placeholder="wagner@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="text-left">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Password</label>
            <input
              type="password"
              required
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary mt-6 flex items-center justify-center gap-2 text-sm font-semibold tracking-wide h-11"
          >
            {loading ? 'Validando...' : 'Acessar o Sistema'} <LogIn className="w-4 h-4 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
}
