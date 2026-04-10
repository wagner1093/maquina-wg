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
  const primaryColor = [15, 23, 42] as const; // Slate 900 / Deep Navy
  const textColor = [30, 41, 59] as const;    // Slate 800
  const lightTextColor = [100, 116, 139] as const; // Slate 500
  const bgColor = [248, 250, 252] as const;   // Slate 50
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2) - 10; // Extra space for left bar
  let y = 0;

  // ─── BACKGROUND & ACCENT BAR ──────────────────────────────────────
  const drawPageAssets = () => {
    // Left Accent Bar (Premium feel)
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 8, pageHeight, 'F');
  };

  drawPageAssets();

  // ─── HEADER ────────────────────────────────────────────────────────
  y = 30;
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setCharSpace(0.5);
  doc.text('PROPOSTA', margin + 5, y);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setCharSpace(2);
  doc.setTextColor(...lightTextColor);
  doc.text('DOCUMENTO COMERCIAL EXCLUSIVO', margin + 5, y + 8);
  
  y += 25;

  // ─── CLIENT INFO ───────────────────────────────────────────────────
  doc.setFillColor(...bgColor);
  doc.rect(margin + 5, y, contentWidth, 20, 'F');
  
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('PREPARADO PARA:', margin + 10, y + 8);
  
  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.text(cliente?.nome || 'CLIENTE ESPECIAL', margin + 10, y + 16);
  
  y += 35;

  // ─── CONTENT PARSING ───────────────────────────────────────────────
  const lines = proposta.conteudo.split('\n');
  
  lines.forEach(line => {
    // Page break handling
    if (y > pageHeight - 30) {
      doc.addPage();
      drawPageAssets();
      y = 30;
    }

    const trimmed = line.trim();
    if (trimmed === '') {
      y += 4;
      return;
    }

    if (line.startsWith('# ')) {
      y += 10;
      doc.setTextColor(...primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text(line.replace('# ', '').toUpperCase(), margin + 5, y);
      y += 12;
    } 
    else if (line.startsWith('## ')) {
      y += 8;
      doc.setTextColor(...primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(line.replace('## ', ''), margin + 5, y);
      
      // Underline accent
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(margin + 5, y + 2, margin + 25, y + 2);
      y += 10;
    } 
    else if (line.startsWith('---')) {
      y += 5;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(margin + 5, y, margin + 5 + contentWidth, y);
      y += 8;
    }
    else if (line.startsWith('- ')) {
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      const bulletText = line.replace('- ', '');
      const parts = bulletText.split(':');
      
      if (parts.length > 1) {
        doc.setFont('helvetica', 'bold');
        doc.text('• ' + parts[0] + ':', margin + 8, y);
        const labelWidth = doc.getTextWidth('• ' + parts[0] + ': ');
        doc.setFont('helvetica', 'normal');
        
        const description = parts.slice(1).join(':').trim();
        const wrappedDetails = doc.splitTextToSize(description, contentWidth - labelWidth - 5);
        
        wrappedDetails.forEach((ld: string, i: number) => {
          if (y > pageHeight - 20) { doc.addPage(); drawPageAssets(); y = 30; }
          doc.text(ld, margin + 8 + (i === 0 ? labelWidth : 0), y);
          if (i < wrappedDetails.length - 1) y += 5;
        });
      } else {
        const wrappedLine = doc.splitTextToSize('• ' + bulletText, contentWidth - 5);
        wrappedLine.forEach((l: string) => {
           if (y > pageHeight - 20) { doc.addPage(); drawPageAssets(); y = 30; }
           doc.text(l, margin + 8, y);
           y += 5;
        });
      }
      y += 6;
    }
    else {
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      // Simple bold support **text**
      const cleanLine = line.replace(/\*\*(.*?)\*\*/g, '$1');
      const wrappedLines = doc.splitTextToSize(cleanLine, contentWidth);
      
      wrappedLines.forEach((l: string) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          drawPageAssets();
          y = 30;
        }
        doc.text(l, margin + 5, y);
        y += 6;
      });
    }
  });

  // ─── INVESTMENT BLOCK ──────────────────────────────────────────────
  if (proposta.valor_total) {
    y += 15;
    if (y > pageHeight - 50) {
      doc.addPage();
      drawPageAssets();
      y = 30;
    }

    doc.setFillColor(...primaryColor);
    doc.rect(margin + 5, y, contentWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('INVESTIMENTO MENSAL:', margin + 15, y + 12);
    
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(`R$ ${proposta.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin + 15, y + 25);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(200, 200, 200);
    doc.text('* Valor sujeito a reajuste anual conforme IGPM.', margin + 15, y + 31);
  }

  // Final Save
  doc.save(`PROPOSTA_${cliente?.nome.replace(/\s+/g, '_') || 'COMERCIAL'}.pdf`);
}

