import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Loader2, ChevronRight } from 'lucide-react';
import { generateWithAI, hasOpenAIKey } from '../utils/ai';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

type AIMessage = { role: 'user' | 'assistant'; content: string };

type Props = {
  modulo: string;
  contextoId?: string;
  contextoTexto: string;
  promptsSugeridos?: string[];
};

export default function AIContextPanel({ modulo, contextoId, contextoTexto, promptsSugeridos = [] }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !hasOpenAIKey()) return;

    const userMsg: AIMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const systemPrompt = `Você é um assistente de negócios especializado em marketing, gestão financeira e tráfego pago. Você está ajudando o usuário no módulo: ${modulo}.

CONTEXTO ATUAL DO MÓDULO:
${contextoTexto}

Responda de forma objetiva e prática em português brasileiro. Use bullet points quando útil.`;

    try {
      const resposta = await generateWithAI(text, systemPrompt);
      const assistantMsg: AIMessage = { role: 'assistant', content: resposta };
      setMessages(prev => [...prev, assistantMsg]);

      if (user) {
        await supabase.from('maquinawg_ia_conversas').insert([{
          user_id: user.id,
          modulo,
          contexto_id: contextoId ?? null,
          mensagem: text,
          resposta,
        }]);
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Erro: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-appleBlue text-white rounded-2xl shadow-xl hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center"
        title="IA Assistente (ChatGPT)"
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-sm z-50 flex flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div>
                <h3 className="font-semibold flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-appleBlue" /> ChatGPT Assistente
                </h3>
                <p className="text-xs text-gray-400 capitalize mt-0.5">Contexto: {modulo}</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            {promptsSugeridos.length > 0 && messages.length === 0 && (
              <div className="px-4 py-3 border-b border-gray-100 space-y-1.5">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Sugestões rápidas</p>
                {promptsSugeridos.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(p)}
                    className="w-full text-left text-xs px-3 py-2 bg-blue-50 text-appleBlue rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-between gap-2"
                  >
                    <span>{p}</span>
                    <ChevronRight className="w-3 h-3 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                  <p className="text-sm text-gray-400">Faça uma pergunta contextualizada sobre <strong className="capitalize">{modulo}</strong>.</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] p-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-appleBlue text-white rounded-br-none'
                      : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-bl-none'
                  }`}>
                    {m.role === 'assistant' && <Sparkles className="w-3.5 h-3.5 text-appleBlue mb-1.5" />}
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl rounded-bl-none p-3">
                    <Loader2 className="w-4 h-4 animate-spin text-appleBlue" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50">
              {!hasOpenAIKey() && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg mb-3 border border-amber-200">
                  ⚠️ Configure <code className="font-mono">VITE_OPENAI_API_KEY</code> no .env
                </p>
              )}
              <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Digite sua pergunta..."
                  disabled={loading}
                  className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-appleBlue/30 text-sm"
                />
                <button type="submit" disabled={loading || !input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-appleBlue text-white rounded-lg flex items-center justify-center hover:bg-blue-600 disabled:opacity-40 transition-colors">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
