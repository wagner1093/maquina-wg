import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Wallet, Server, TrendingUp, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import AIContextPanel from '../components/AIContextPanel';

type Stats = {
  receitaEsperada: number;
  receitaConfirmada: number;
  despesasPendentes: number;
  clientesHospedagem: number;
  hospedagensVencendo: number;
  clientesTrafego: number;
  campanhasAtivas: number;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    receitaEsperada: 0, receitaConfirmada: 0, despesasPendentes: 0,
    clientesHospedagem: 0, hospedagensVencendo: 0, clientesTrafego: 0, campanhasAtivas: 0,
  });
  const [loading, setLoading] = useState(true);
  const [hosps, setHosps] = useState<{ nome_cliente: string; data_vencimento: string }[]>([]);
  const [projetos, setProjetos] = useState<{ nome_projeto: string; status_pagamento: string; valor_mensal: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [fp, fd, hc, tc, cam] = await Promise.all([
        supabase.from('maquinawg_financeiro_projetos').select('*').eq('user_id', user.id),
        supabase.from('maquinawg_financeiro_despesas').select('*').eq('user_id', user.id),
        supabase.from('maquinawg_hospedagem_clientes').select('*').eq('user_id', user.id),
        supabase.from('maquinawg_trafego_clientes').select('*').eq('user_id', user.id),
        supabase.from('maquinawg_trafego_campanhas').select('*').eq('user_id', user.id),
      ]);

      const projData = fp.data ?? [];
      const despData = fd.data ?? [];
      const hospData = hc.data ?? [];

      const today = new Date();
      const vencendo30 = hospData.filter(h => {
        const diff = Math.ceil((new Date(h.data_vencimento).getTime() - today.getTime()) / (1000 * 3600 * 24));
        return diff <= 30;
      });

      setProjetos(projData);
      setHosps(hospData);
      setStats({
        receitaEsperada: projData.reduce((a, p) => a + Number(p.valor_mensal), 0),
        receitaConfirmada: projData.filter(p => p.status_pagamento === 'Recebido').reduce((a, p) => a + Number(p.valor_mensal), 0),
        despesasPendentes: despData.filter(d => d.status === 'Pendente').reduce((a, d) => a + Number(d.valor), 0),
        clientesHospedagem: hospData.length,
        hospedagensVencendo: vencendo30.length,
        clientesTrafego: (tc.data ?? []).filter(c => c.status === 'Ativo').length,
        campanhasAtivas: (cam.data ?? []).filter(c => c.status === 'Ativa').length,
      });
      setLoading(false);
    })();
  }, [user]);

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  };

  const aiContexto = `
RESUMO DO NEGÓCIO:
- Receita esperada este mês: R$ ${stats.receitaEsperada.toFixed(2)}
- Receita confirmada: R$ ${stats.receitaConfirmada.toFixed(2)}
- Despesas pendentes: R$ ${stats.despesasPendentes.toFixed(2)}
- Clientes de Hospedagem: ${stats.clientesHospedagem} (${stats.hospedagensVencendo} vencendo em 30 dias)
- Clientes de Tráfego Pago: ${stats.clientesTrafego} ativos
- Campanhas ativas: ${stats.campanhasAtivas}
`.trim();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <p className="text-gray-400 text-sm font-medium">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
        <h1 className="text-3xl font-bold text-appleDark tracking-tight mt-1">
          {greeting()}, {user?.email?.split('@')[0]}! 👋
        </h1>
        <p className="text-gray-400 mt-1 text-sm">Aqui está o seu resumo de hoje.</p>
      </header>

      {/* Main KPI Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Receita Esperada', value: `R$ ${stats.receitaEsperada.toFixed(2).replace('.', ',')}`, icon: <Wallet className="w-5 h-5 text-green-600" />, color: 'border-l-green-500', bg: 'bg-green-100' },
          { label: 'Receita Confirmada', value: `R$ ${stats.receitaConfirmada.toFixed(2).replace('.', ',')}`, icon: <CheckCircle className="w-5 h-5 text-appleBlue" />, color: 'border-l-appleBlue', bg: 'bg-blue-100' },
          { label: 'Despesas Pendentes', value: `R$ ${stats.despesasPendentes.toFixed(2).replace('.', ',')}`, icon: <Clock className="w-5 h-5 text-orange-500" />, color: 'border-l-orange-400', bg: 'bg-orange-100' },
          { label: 'Campanhas Ativas', value: String(stats.campanhasAtivas), icon: <TrendingUp className="w-5 h-5 text-purple-500" />, color: 'border-l-purple-400', bg: 'bg-purple-100' },
        ].map(kpi => (
          <div key={kpi.label} className={`glass-card p-5 border-l-4 ${kpi.color}`}>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-7 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : (
              <>
                <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center mb-3`}>{kpi.icon}</div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{kpi.label}</p>
                <h3 className="text-xl font-bold mt-1 text-appleDark">{kpi.value}</h3>
              </>
            )}
          </div>
        ))}
      </section>

      {/* Hospitality + Traffic row */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hospedagens urgentes */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Server className="w-5 h-5 text-appleBlue" /> Hospedagens
            </h2>
            {stats.hospedagensVencendo > 0 && (
              <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {stats.hospedagensVencendo} urgente(s)
              </span>
            )}
          </div>
          {hosps.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhuma hospedagem cadastrada.</p>
          ) : (
            <div className="space-y-2">
              {hosps.slice(0, 4).map(h => {
                const diff = Math.ceil((new Date(h.data_vencimento).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                const color = diff < 0 ? 'text-red-600' : diff <= 7 ? 'text-orange-500' : diff <= 30 ? 'text-yellow-600' : 'text-green-600';
                return (
                  <div key={h.nome_cliente} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm font-medium">{h.nome_cliente}</span>
                    <span className={`text-xs font-semibold ${color}`}>
                      {diff < 0 ? `Vencido há ${Math.abs(diff)}d` : `${diff}d restantes`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Projetos pendentes */}
        <div className="glass-panel p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-green-600" /> Pagamentos Pendentes
          </h2>
          {projetos.filter(p => p.status_pagamento !== 'Recebido').length === 0 ? (
            <p className="text-sm text-gray-400">Todos os pagamentos recebidos! 🎉</p>
          ) : (
            <div className="space-y-2">
              {projetos.filter(p => p.status_pagamento !== 'Recebido').slice(0, 4).map(p => (
                <div key={p.nome_projeto} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <span className="text-sm font-medium">{p.nome_projeto}</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${p.status_pagamento === 'Atrasado' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                      {p.status_pagamento}
                    </span>
                  </div>
                  <span className="text-sm font-semibold">R$ {Number(p.valor_mensal).toFixed(2).replace('.', ',')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <AIContextPanel
        modulo="Hub / Dashboard"
        contextoTexto={aiContexto}
        promptsSugeridos={[
          'Qual meu lucro líquido estimado para este mês?',
          'Existe algum risco financeiro que devo ficar atento?',
          'Como posso aumentar minha receita mensal?',
        ]}
      />
    </div>
  );
}
