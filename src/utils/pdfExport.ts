import jsPDF from 'jspdf';

type ClienteRelatorio = {
  nome: string;
  empresa: string;
  nicho: string;
  valor_contrato: number;
  status: string;
};

type CampanhaRelatorio = {
  nome_campanha: string;
  plataforma: string;
  objetivo: string;
  status: string;
};

type MetricaRelatorio = {
  periodo: string;
  investimento: number;
  impressoes?: number | null;
  cliques?: number | null;
  conversoes?: number | null;
  roas?: number | null;
  cpa?: number | null;
  ctr?: number | null;
  faturamento_gerado?: number | null;
};

export function exportTrafficClientPDF(
  cliente: ClienteRelatorio,
  campanhas: CampanhaRelatorio[],
  metricas: MetricaRelatorio[]
) {
  const doc = new jsPDF();
  const blue = [0, 102, 204] as const;
  const dark = [29, 29, 31] as const;
  const gray = [107, 114, 128] as const;
  const lightGray = [245, 245, 247] as const;

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 0;

  // ─── Header ───────────────────────────────────────────────────
  doc.setFillColor(...blue);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Performance', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

  y = 54;

  // ─── Client Info ───────────────────────────────────────────────
  doc.setFillColor(...lightGray);
  doc.roundedRect(14, y - 8, pageWidth - 28, 38, 3, 3, 'F');

  doc.setTextColor(...dark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(cliente.nome, 20, y + 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...gray);
  doc.text(`${cliente.empresa}  ·  ${cliente.nicho}`, 20, y + 12);
  doc.text(`Contrato: R$ ${Number(cliente.valor_contrato).toFixed(2).replace('.', ',')} /mês  ·  Status: ${cliente.status}`, 20, y + 22);

  y += 48;

  // ─── KPI Summary ───────────────────────────────────────────────
  if (metricas.length > 0) {
    const totalInvestimento = metricas.reduce((a, m) => a + Number(m.investimento), 0);
    const totalFat = metricas.reduce((a, m) => a + Number(m.faturamento_gerado ?? 0), 0);
    const avgRoas = metricas.filter(m => m.roas).reduce((a, m, _, arr) => a + Number(m.roas) / arr.length, 0);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...dark);
    doc.text('Resumo de Performance', 14, y);
    y += 6;

    type KPIItem = { label: string; value: string };
    const kpis: KPIItem[] = [
      { label: 'Investimento Total', value: `R$ ${totalInvestimento.toFixed(2).replace('.', ',')}` },
      { label: 'Faturamento Gerado', value: `R$ ${totalFat.toFixed(2).replace('.', ',')}` },
      { label: 'ROAS Médio', value: avgRoas ? `${avgRoas.toFixed(2)}x` : 'N/A' },
      { label: 'Períodos Registrados', value: `${metricas.length}` },
    ];

    const boxW = (pageWidth - 28 - 12) / 4;
    kpis.forEach((kpi, i) => {
      const x = 14 + i * (boxW + 4);
      doc.setFillColor(...lightGray);
      doc.roundedRect(x, y, boxW, 20, 2, 2, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...gray);
      doc.text(kpi.label, x + 4, y + 7);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...dark);
      doc.text(kpi.value, x + 4, y + 16);
    });

    y += 30;
  }

  // ─── Campaigns ─────────────────────────────────────────────────
  if (campanhas.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...dark);
    doc.text('Campanhas', 14, y);
    y += 8;

    // Header
    doc.setFillColor(...blue);
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const headers = ['Campanha', 'Plataforma', 'Objetivo', 'Status'];
    const colW = (pageWidth - 28) / 4;
    headers.forEach((h, i) => doc.text(h, 16 + i * colW, y + 5.5));
    y += 8;

    campanhas.forEach((cam, idx) => {
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 249);
      doc.rect(14, y, pageWidth - 28, 8, 'F');
      doc.setTextColor(...dark);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      [cam.nome_campanha, cam.plataforma, cam.objetivo, cam.status].forEach((v, i) => {
        doc.text(v ?? '-', 16 + i * colW, y + 5.5, { maxWidth: colW - 4 });
      });
      y += 8;
    });
    y += 8;
  }

  // ─── Metrics table ─────────────────────────────────────────────
  if (metricas.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...dark);
    doc.text('Histórico de Métricas', 14, y);
    y += 8;

    const mHeaders = ['Período', 'Invest.', 'Cliques', 'CTR', 'ROAS', 'CPA'];
    const mColW = (pageWidth - 28) / mHeaders.length;
    doc.setFillColor(...blue);
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    mHeaders.forEach((h, i) => doc.text(h, 16 + i * mColW, y + 5.5));
    y += 8;

    metricas.forEach((m, idx) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 249);
      doc.rect(14, y, pageWidth - 28, 8, 'F');
      doc.setTextColor(...dark);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const row = [
        m.periodo,
        `R$ ${Number(m.investimento).toFixed(2)}`,
        m.cliques ? String(m.cliques) : '-',
        m.ctr ? `${m.ctr}%` : '-',
        m.roas ? `${m.roas}x` : '-',
        m.cpa ? `R$ ${Number(m.cpa).toFixed(2)}` : '-',
      ];
      row.forEach((v, i) => doc.text(v, 16 + i * mColW, y + 5.5));
      y += 8;
    });
  }

  // ─── Footer ───────────────────────────────────────────────────
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(...blue);
  doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório de Performance Gerencial', 14, pageHeight - 4);

  doc.save(`Relatorio_${cliente.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportFinancePDF(
  projetos: { nome_projeto: string; tipo_servico: string; valor_mensal: number; status_pagamento: string; competencia: string }[],
  despesas: { descricao: string; categoria: string; valor: number; status: string; vencimento: string }[],
  mes: string
) {
  const doc = new jsPDF();
  const blue = [0, 102, 204] as const;
  const dark = [29, 29, 31] as const;
  const gray = [107, 114, 128] as const;
  const lightGray = [245, 245, 247] as const;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 0;

  // Header
  doc.setFillColor(...blue);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Extrato Financeiro Mensal', 14, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Competência: ${mes}  ·  Relatório de Conferência`, 14, 30);

  y = 54;

  const totalReceita = projetos.filter(p => p.status_pagamento === 'Recebido').reduce((a, p) => a + Number(p.valor_mensal), 0);
  const totalEsperado = projetos.reduce((a, p) => a + Number(p.valor_mensal), 0);
  const totalDespesas = despesas.filter(d => d.status === 'Pago').reduce((a, d) => a + Number(d.valor), 0);
  const lucro = totalReceita - totalDespesas;

  const kpis = [
    { label: 'Receita Esperada', value: `R$ ${totalEsperado.toFixed(2).replace('.', ',')}` },
    { label: 'Receita Confirmada', value: `R$ ${totalReceita.toFixed(2).replace('.', ',')}` },
    { label: 'Despesas Pagas', value: `R$ ${totalDespesas.toFixed(2).replace('.', ',')}` },
    { label: 'Lucro Líquido Est.', value: `R$ ${lucro.toFixed(2).replace('.', ',')}` },
  ];

  const boxW = (pageWidth - 28 - 12) / 4;
  kpis.forEach((kpi, i) => {
    const x = 14 + i * (boxW + 4);
    doc.setFillColor(...lightGray);
    doc.roundedRect(x, y - 8, boxW, 22, 2, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.text(kpi.label, x + 4, y - 1);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...dark);
    doc.text(kpi.value, x + 4, y + 9);
  });

  y += 24;

  // Projetos
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...dark);
  doc.text('Projetos / Receitas', 14, y); y += 8;
  doc.setFillColor(...blue); doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  ['Projeto', 'Serviço', 'Valor Mensal', 'Status'].forEach((h, i) => {
    doc.text(h, 16 + i * ((pageWidth - 28) / 4), y + 5.5);
  }); y += 8;

  projetos.forEach((p, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 249);
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.setTextColor(...dark); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    [p.nome_projeto, p.tipo_servico, `R$ ${Number(p.valor_mensal).toFixed(2)}`, p.status_pagamento].forEach((v, i) => {
      doc.text(v, 16 + i * ((pageWidth - 28) / 4), y + 5.5, { maxWidth: (pageWidth - 28) / 4 - 4 });
    }); y += 8;
  });

  y += 10;

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(...blue);
  doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('Extrato Gerencial Mensal', 14, pageHeight - 4);

  doc.save(`Extrato_Financeiro_${mes.replace('/', '-')}.pdf`);
}

export function exportProposalPDF(
  proposta: { titulo: string; conteudo: string; valor_total: number | null; created_at: string },
  cliente?: { nome: string; empresa: string }
) {
  const doc = new jsPDF();
  const primaryColor = [0, 0, 0] as const; // Pure Black
  const grayColor = [100, 116, 139] as const; // Slate 500
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ─── COVER PAGE ──────────────────────────────────────────────────
  const drawCover = () => {
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    
    // Large "PRO" "POSTA"
    doc.setFontSize(100);
    doc.text('PRO', 20, 100);
    doc.text('POSTA', 20, 135);
    
    // Subtext
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setCharSpace(2);
    doc.text('WEB HOSPEDAGEM •', 20, 155);
    doc.setCharSpace(0);
  };

  drawCover();

  // ─── CONTENT PAGE ─────────────────────────────────────────────────
  doc.addPage();
  let y = 30;
  const margin = 20;

  // Header: "PLANO [NOME]"
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('PLANO', margin, y);
  
  const planName = proposta.titulo.split(' ').pop()?.toUpperCase() || 'HOSTING';
  doc.setFontSize(60);
  doc.text(planName, margin, y + 25);
  
  y += 70;

  // Prices and Payment (Left Column)
  if (proposta.valor_total) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('pagamento anual', margin, y);
    
    doc.setFontSize(36);
    doc.setFont('helvetica', 'bold');
    doc.text(`R$ ${proposta.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, margin, y + 16);
    
    y += 40;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('MÉTODO DE PAGAMENTO', margin, y);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);
    doc.text('Conforme sua preferência ou acordado com o Cliente', margin, y + 6);
    
    doc.setTextColor(...primaryColor);
    doc.text('•  Boleto Bancário', margin + 5, y + 15);
    doc.text('•  Pix', margin + 5, y + 22);
  }

  // Features List (Right Column - Starts at y=30)
  const rightColX = 130;
  let ry = 30;

  const drawBadge = (text: string, x: number, py: number, color: [number, number, number]) => {
    doc.setFontSize(7);
    const w = doc.getTextWidth(text) + 6;
    doc.setFillColor(...color);
    doc.roundedRect(x, py - 4, w, 6, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text(text, x + 3, py + 0.5);
  };

  const lines = proposta.conteudo.split('\n');
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('## ')) {
      ry += 4;
      doc.setTextColor(...primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(trimmed.replace('## ', ''), rightColX, ry);
      ry += 8;
    } 
    else if (trimmed.startsWith('- ')) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...primaryColor);
      
      let text = trimmed.replace('- ', '');
      let badge: { text: string, color: [number, number, number] } | null = null;
      
      if (text.includes('[NOVO]')) {
         text = text.replace('[NOVO]', '').trim();
         badge = { text: 'NOVO', color: [168, 85, 247] }; // Purple
      } else if (text.includes('[GRÁTIS]')) {
         text = text.replace('[GRÁTIS]', '').trim();
         badge = { text: 'GRÁTIS', color: [34, 197, 94] }; // Green
      }

      // Checkmark icon simulation
      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(0.5);
      doc.line(rightColX - 5, ry - 1, rightColX - 4, ry);
      doc.line(rightColX - 4, ry, rightColX - 2, ry - 3);

      const wrappedText = doc.splitTextToSize(text, pageWidth - rightColX - 10);
      wrappedText.forEach((l: string, i: number) => {
        doc.text(l, rightColX, ry);
        if (i === wrappedText.length - 1 && badge) {
           const textW = doc.getTextWidth(l);
           drawBadge(badge.text, rightColX + textW + 5, ry, badge.color);
        }
        ry += 5;
      });
      ry += 2;
    }
  });

  // Footer / Branding Neutrality
  doc.setTextColor(...grayColor);
  doc.setFontSize(8);
  doc.text(`Gerado para ${cliente?.empresa || 'Cliente'} em ${new Date().toLocaleDateString('pt-BR')}`, margin, pageHeight - 15);

  doc.save(`PROPOSTA_WEB_${planName}.pdf`);
}


