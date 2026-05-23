// ══════════════════════════════════════════════════════════════
// BlinTrack — Calculadora de Bonificação
// Google Apps Script — Gerador de Relatório Word/PDF
// Cole este código em: script.google.com → Novo projeto
// Implante como: App da Web → Qualquer pessoa (anônimo)
// ══════════════════════════════════════════════════════════════

const PASTA_DRIVE = 'BlinTrack — Relatórios'; // Nome da pasta no Drive

// ── ENTRY POINT ──────────────────────────────────────────────
function doPost(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Content-Type': 'application/json'
  };
  try {
    const payload = JSON.parse(e.postData.contents);
    if (payload.action === 'gerarRelatorio') {
      const result = gerarRelatorio(payload);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    throw new Error('Ação desconhecida: ' + payload.action);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'BlinTrack AppScript ativo ✅' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── GERADOR PRINCIPAL ─────────────────────────────────────────
function gerarRelatorio(data) {
  const periodo  = data.periodo  || '—';
  const tecs     = data.tecnicos     || [];
  const viagens  = data.viagens      || [];
  const monts    = data.montagens    || [];
  const sobreavs = data.sobreaviso   || [];

  // Cria o documento Google Docs
  const titulo = 'BlinTrack — Bonificação — ' + periodo;
  const doc    = DocumentApp.create(titulo);
  const body   = doc.getBody();

  // Estilos base
  const FONT     = 'Arial';
  const COR_GOLD = '#F5B800';
  const COR_DARK = '#1A1A1A';
  const COR_GRAY = '#555555';
  const COR_FUNDO_HEADER = '#1A1A1A';

  body.setMarginTop(50).setMarginBottom(50).setMarginLeft(60).setMarginRight(60);

  // ── CABEÇALHO ──────────────────────────────────────────────
  const hdr = body.insertParagraph(0, 'BlinTrack');
  hdr.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  hdr.editAsText()
    .setFontFamily(FONT)
    .setFontSize(28)
    .setForegroundColor(COR_DARK)
    .setBold(true);
  // "Track" em dourado
  hdr.editAsText().setForegroundColor(4, 8, COR_GOLD);

  appendPara(body, 'Calculadora de Bonificação', FONT, 13, COR_GRAY, false, true);
  appendPara(body, 'Período de Apuração: ' + periodo, FONT, 12, COR_GRAY, false, false);
  appendHRule(body, COR_GOLD);
  appendPara(body, '', FONT, 6, COR_GRAY, false, false);

  // ── INFO GRID ──────────────────────────────────────────────
  appendSectionTitle(body, '📋 Informações Gerais', FONT);
  const infoTable = body.appendTable([
    ['Empresa',             'Blincast Tecnologia'],
    ['Período de Apuração', periodo],
    ['Área',                'Operacional — Técnica'],
    ['Registro de Ponto',   'Fechado via sistema PontoMais'],
    ['Horas Extras',        'Calculadas automaticamente via PontoMais'],
    ['Férias (próx. mês)',  'Não haverá férias no próximo período'],
  ]);
  styleInfoTable(infoTable, FONT, COR_GOLD, COR_DARK);

  // ── BONIFICAÇÃO OS ─────────────────────────────────────────
  appendPara(body, '', FONT, 8, COR_GRAY, false, false);
  appendSectionTitle(body, '1. Bonificação por OS', FONT);
  appendPara(body, 'R$ 6,00 por OS técnico · R$ 4,00 por OS ajudante', FONT, 10, COR_GRAY, false, true);

  if (tecs.length) {
    const rows = [['Técnico', 'OS Técnico', 'OS Ajudante', 'Total']];
    let totalOS = 0;
    tecs.forEach(t => {
      const val = (Number(t.osTec)||0)*6 + (Number(t.osAjud)||0)*4;
      totalOS += val;
      rows.push([t.nome || '—', String(t.osTec||0), String(t.osAjud||0), fmtBRL(val)]);
    });
    rows.push(['TOTAL', '', '', fmtBRL(totalOS)]);
    const tb = body.appendTable(rows);
    styleDataTable(tb, FONT, COR_GOLD, COR_DARK, COR_FUNDO_HEADER);
  } else {
    appendPara(body, 'Nenhum registro de OS.', FONT, 11, COR_GRAY, false, true);
  }

  // ── VIAGENS ────────────────────────────────────────────────
  appendPara(body, '', FONT, 8, COR_GRAY, false, false);
  appendSectionTitle(body, '2. Viagens', FONT);
  appendPara(body, 'R$ 50,00 por dia de viagem', FONT, 10, COR_GRAY, false, true);

  if (viagens.length) {
    const rows = [['Técnico', 'Destino', 'Tipo', 'Dias', 'Total']];
    let totalVia = 0;
    viagens.forEach(v => {
      const val = (Number(v.dias)||1) * 50;
      totalVia += val;
      rows.push([v.nome||'—', v.destino||'—', v.tipo||'—', String(v.dias||1), fmtBRL(val)]);
    });
    rows.push(['TOTAL', '', '', '', fmtBRL(totalVia)]);
    const tb = body.appendTable(rows);
    styleDataTable(tb, FONT, COR_GOLD, COR_DARK, COR_FUNDO_HEADER);
  } else {
    appendPara(body, 'Nenhuma viagem registrada.', FONT, 11, COR_GRAY, false, true);
  }

  // ── MONTAGENS ──────────────────────────────────────────────
  appendPara(body, '', FONT, 8, COR_GRAY, false, false);
  appendSectionTitle(body, '3. Montagens / Instalações', FONT);

  if (monts.length) {
    const rows = [['Técnico', 'Item', 'Qtd', 'Unit.', 'Total']];
    let totalMon = 0;
    monts.forEach(m => {
      const val = (Number(m.tipoValor)||0) * (Number(m.qtd)||1);
      totalMon += val;
      rows.push([m.nome||'—', m.tipoLabel||'—', String(m.qtd||1), fmtBRL(m.tipoValor||0), fmtBRL(val)]);
    });
    rows.push(['TOTAL', '', '', '', fmtBRL(totalMon)]);
    const tb = body.appendTable(rows);
    styleDataTable(tb, FONT, COR_GOLD, COR_DARK, COR_FUNDO_HEADER);
  } else {
    appendPara(body, 'Nenhuma montagem registrada.', FONT, 11, COR_GRAY, false, true);
  }

  // ── SOBREAVISO ─────────────────────────────────────────────
  appendPara(body, '', FONT, 8, COR_GRAY, false, false);
  appendSectionTitle(body, '4. Sobreaviso', FONT);

  if (sobreavs.length) {
    const rows = [['Técnico', 'Datas', 'Total de Horas']];
    let totalH = 0;
    sobreavs.forEach(s => {
      totalH += Number(s.horas)||0;
      rows.push([s.nome||'—', s.datas||'—', (s.horas||0) + 'h']);
    });
    rows.push(['TOTAL', '', totalH + 'h']);
    const tb = body.appendTable(rows);
    styleDataTable(tb, FONT, COR_GOLD, COR_DARK, COR_FUNDO_HEADER);
  } else {
    appendPara(body, 'Nenhum sobreaviso registrado.', FONT, 11, COR_GRAY, false, true);
  }

  // ── RESUMO FINAL ───────────────────────────────────────────
  appendPara(body, '', FONT, 10, COR_GRAY, false, false);
  appendHRule(body, COR_GOLD);
  appendSectionTitle(body, '📊 Resumo por Técnico', FONT);

  // Agrupa por nome
  const mapa = {};
  const addMapa = (nome, campo, val) => {
    if (!nome) nome = '—';
    if (!mapa[nome]) mapa[nome] = { os:0, viagens:0, montagens:0, horas:0 };
    mapa[nome][campo] += val;
  };
  tecs.forEach(t => addMapa(t.nome, 'os', (Number(t.osTec)||0)*6 + (Number(t.osAjud)||0)*4));
  viagens.forEach(v => addMapa(v.nome, 'viagens', (Number(v.dias)||1)*50));
  monts.forEach(m => addMapa(m.nome, 'montagens', (Number(m.tipoValor)||0)*(Number(m.qtd)||1)));
  sobreavs.forEach(s => { addMapa(s.nome, 'horas', 0); mapa[s.nome||'—'].horas += Number(s.horas)||0; });

  const nomes = Object.keys(mapa);
  if (nomes.length) {
    const rows = [['Técnico', 'OS Bônus', 'Viagens', 'Montagens', 'Sobreaviso', 'TOTAL']];
    let grand = 0;
    nomes.forEach(nome => {
      const r = mapa[nome];
      const tot = r.os + r.viagens + r.montagens;
      grand += tot;
      rows.push([nome, fmtBRL(r.os), fmtBRL(r.viagens), fmtBRL(r.montagens), r.horas > 0 ? r.horas+'h' : '—', fmtBRL(tot)]);
    });
    rows.push(['TOTAL GERAL', '', '', '', '', fmtBRL(grand)]);
    const tb = body.appendTable(rows);
    styleDataTable(tb, FONT, COR_GOLD, COR_DARK, COR_FUNDO_HEADER);
  }

  // ── ASSINATURAS ────────────────────────────────────────────
  appendPara(body, '', FONT, 20, COR_GRAY, false, false);
  const assinaturas = body.appendTable([
    ['Responsável Operacional\n\n\n________________________\nAssinatura / Data',
     'Recursos Humanos\n\n\n________________________\nAssinatura / Data']
  ]);
  assinaturas.setColumnWidth(0, 220).setColumnWidth(1, 220);
  const asRow = assinaturas.getRow(0);
  for (let c = 0; c < 2; c++) {
    const cell = asRow.getCell(c);
    cell.editAsText().setFontFamily(FONT).setFontSize(11).setForegroundColor(COR_GRAY);
    cell.setBackgroundColor('#F5F5F5');
  }

  // ── RODAPÉ ─────────────────────────────────────────────────
  appendPara(body, '', FONT, 12, COR_GRAY, false, false);
  appendHRule(body, '#333333');
  appendPara(body, 'BlinTrack — Blincast Tecnologia  •  Gerado automaticamente em ' + new Date().toLocaleDateString('pt-BR'), FONT, 9, COR_GRAY, false, true);

  doc.saveAndClose();

  // ── MOVE PARA PASTA NO DRIVE ───────────────────────────────
  const arquivo = DriveApp.getFileById(doc.getId());
  const pasta   = obterOuCriarPasta(PASTA_DRIVE);
  pasta.addFile(arquivo);
  DriveApp.getRootFolder().removeFile(arquivo);

  // ── GERA TAMBÉM O PDF ──────────────────────────────────────
  const pdfBlob = arquivo.getAs('application/pdf');
  pdfBlob.setName(titulo + '.pdf');
  const pdfFile = pasta.createFile(pdfBlob);

  return {
    status:  'ok',
    url:     arquivo.getUrl(),       // Google Doc (editável)
    pdfUrl:  pdfFile.getDownloadUrl(), // PDF para download direto
    titulo:  titulo,
    geradoEm: new Date().toISOString()
  };
}

// ══════════════════════════════════════════════════════════════
// HELPERS DE FORMATAÇÃO
// ══════════════════════════════════════════════════════════════

function fmtBRL(v) {
  return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
}

function appendPara(body, texto, font, size, color, bold, italic) {
  const p = body.appendParagraph(texto);
  p.editAsText()
    .setFontFamily(font)
    .setFontSize(size)
    .setForegroundColor(color)
    .setBold(bold || false)
    .setItalic(italic || false);
  return p;
}

function appendHRule(body, color) {
  const p = body.appendParagraph('');
  p.editAsText().setFontSize(1);
  p.setBorderBottom && p.setBorderBottom
    ? null
    : p.editAsText().setBackgroundColor(color);
  return p;
}

function appendSectionTitle(body, texto, font) {
  const p = body.appendParagraph(texto);
  p.editAsText()
    .setFontFamily(font)
    .setFontSize(13)
    .setForegroundColor('#1A1A1A')
    .setBold(true);
  p.setSpacingBefore(10).setSpacingAfter(6);
  return p;
}

function styleInfoTable(table, font, colorGold, colorDark) {
  table.setBorderColor('#E0E0E0');
  for (let i = 0; i < table.getNumRows(); i++) {
    const row = table.getRow(i);
    // Coluna label
    const c0 = row.getCell(0);
    c0.editAsText().setFontFamily(font).setFontSize(11).setBold(true).setForegroundColor(colorDark);
    c0.setBackgroundColor('#F5F5F5').setPaddingTop(5).setPaddingBottom(5).setPaddingLeft(8).setPaddingRight(8);
    // Coluna valor
    const c1 = row.getCell(1);
    c1.editAsText().setFontFamily(font).setFontSize(11).setBold(false).setForegroundColor('#555555');
    c1.setPaddingTop(5).setPaddingBottom(5).setPaddingLeft(8).setPaddingRight(8);
  }
  table.setColumnWidth(0, 160);
  table.setColumnWidth(1, 300);
}

function styleDataTable(table, font, colorGold, colorDark, colorHeader) {
  table.setBorderColor('#E0E0E0');
  const numRows = table.getNumRows();
  for (let i = 0; i < numRows; i++) {
    const row = table.getRow(i);
    const isHeader = i === 0;
    const isTotal  = i === numRows - 1;
    const bgColor  = isHeader ? colorHeader : (isTotal ? '#F0F0F0' : (i % 2 === 0 ? '#FFFFFF' : '#FAFAFA'));
    const txtColor = isHeader ? '#FFFFFF' : (isTotal ? colorDark : '#333333');
    const bold     = isHeader || isTotal;

    for (let c = 0; c < row.getNumCells(); c++) {
      const cell = row.getCell(c);
      cell.setBackgroundColor(bgColor);
      cell.editAsText()
        .setFontFamily(font)
        .setFontSize(isHeader ? 10 : 11)
        .setForegroundColor(isTotal && c === row.getNumCells()-1 ? colorGold : txtColor)
        .setBold(bold);
      cell.setPaddingTop(5).setPaddingBottom(5).setPaddingLeft(8).setPaddingRight(8);
    }
  }
}

function obterOuCriarPasta(nome) {
  const pastas = DriveApp.getFoldersByName(nome);
  if (pastas.hasNext()) return pastas.next();
  return DriveApp.createFolder(nome);
}
