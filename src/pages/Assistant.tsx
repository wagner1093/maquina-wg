import React, { useState } from 'react';
import { Sparkles, MessageSquare, Send, Loader2 } from 'lucide-react';
import { generateWithAI, hasOpenAIKey } from '../utils/ai';

export default function Assistant() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: 'Olá! Sou seu assistente pessoal (powered by ChatGPT / GPT-4o). Como posso ajudar com sua produtividade hoje?' }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    if (!hasOpenAIKey()) {
      alert('Por favor, adicione sua VITE_OPENAI_API_KEY no arquivo .env');
      return;
    }

    const newMsgs = [...messages, { role: 'user', content: prompt } as const];
    setMessages(newMsgs);
    setPrompt('');
    setLoading(true);

    try {
      const systemPrompt = 'Você é um assistente pessoal de alto nível especializado em gestão de negócios, marketing digital, tráfego pago e produtividade. Responda sempre em português brasileiro de forma clara e prática.';
      const resposta = await generateWithAI(prompt, systemPrompt);
      setMessages([...newMsgs, { role: 'assistant', content: resposta }]);
    } catch (error: any) {
      setMessages([...newMsgs, { role: 'assistant', content: 'Erro: ' + error.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] animate-in fade-in duration-500">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">IA Assistente</h1>
        <p className="text-gray-500 text-sm mt-1">Converse com seu assistente pessoal (GPT-4o) para acelerar seus processos.</p>
        {!hasOpenAIKey() && (
          <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-sm border border-yellow-200 rounded-lg">
            ⚠️ <strong>Chave Ausente:</strong> Configure <code className="font-mono bg-yellow-100 px-1 rounded">VITE_OPENAI_API_KEY</code> no arquivo <code className="font-mono bg-yellow-100 px-1 rounded">.env</code>.
          </div>
        )}
      </header>

      <div className="flex-1 glass-panel overflow-hidden flex flex-col bg-white/40">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-appleBlue text-white rounded-br-none' : 'bg-white border border-gray-100 shadow-sm rounded-bl-none text-appleDark'}`}>
                {msg.role === 'assistant' && <Sparkles className="w-4 h-4 mb-2 text-appleBlue" />}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[70%] p-4 rounded-2xl bg-white border border-gray-100 shadow-sm rounded-bl-none">
                <Loader2 className="w-5 h-5 animate-spin text-appleBlue" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-white/80 border-t border-gray-100">
          <form onSubmit={handleSend} className="relative">
            <MessageSquare className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-appleBlue/30 focus:border-appleBlue transition-all text-sm"
              placeholder="Pergunte sobre negócios, marketing, conteúdo, finanças..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-appleBlue text-white rounded-lg shadow-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
