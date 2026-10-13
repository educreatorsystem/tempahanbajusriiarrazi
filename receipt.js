async function createUniformReceiptPdf(order) {
  const { PDFDocument, StandardFonts, rgb } = PDFLib;
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.09,0.13,0.12), green = rgb(0.08,0.42,0.33);
  const date = value => new Intl.DateTimeFormat('ms-MY', { day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Kuala_Lumpur' }).format(new Date(value));
  const money = value => `RM ${Number(value).toFixed(2)}`;
  const paid = order.payments.reduce((sum,p) => sum+Math.round(p.amount*100),0)/100;
  const total = order.deletedAt ? 0 : order.total;
  const status = paid === 0 ? 'Belum bayar' : paid < total ? 'Bayar sebahagian' : 'Selesai bayar';
  const clean = value => Array.from(String(value ?? '').replace(/[\r\n\t]/g,' ')).map(char => {
    try { regular.encodeText(char); return char; } catch { return '?'; }
  }).join('');
  const wrap = (value,width,size=10,font=regular) => {
    const lines = []; let line = '';
    for (const word of clean(value).split(/\s+/)) {
      if (line && font.widthOfTextAtSize(line+' '+word,size) > width) { lines.push(line); line = ''; }
      for (const char of (line ? ' ' : '')+word) {
        if (font.widthOfTextAtSize(line+char,size) > width) { lines.push(line); line = ''; }
        line += char;
      }
    }
    if (line || !lines.length) lines.push(line);
    return lines;
  };
  let page, y;
  const text = (value,x,position,size=10,font=regular,color=ink) => page.drawText(clean(value),{x,y:position,size,font,color});
  const newPage = () => {
    page = pdf.addPage([595.28,841.89]); y = 794;
    text('SRI INTEGRASI AR RAZI MERU 2',40,y,14,bold,green); y -= 24;
    text('RINGKASAN TEMPAHAN DAN BAYARAN UNIFORM',40,y,11,bold); y -= 22;
    text('No. tempahan: '+order.id,40,y,9); y -= 25;
  };
  const ensure = height => { if (y-height < 55) newPage(); };
  const paragraph = (value,font=regular,size=10) => {
    wrap(value,515,size,font).forEach(line => { ensure(16); text(line,40,y,size,font); y -= 15; });
  };
  const heading = title => { ensure(45); y -= 12; paragraph(title,bold,11); y -= 7; };
  const table = (headers,rows,widths) => {
    const row = (cells,header=false) => {
      const font = header ? bold : regular;
      const lines = cells.map((cell,i) => wrap(cell,widths[i]-12,9,font));
      const height = Math.max(...lines.map(line => line.length))*13+12;
      if (y-height < 55) { newPage(); if (!header) row(headers,true); }
      if (header) page.drawRectangle({x:40,y:y-height+3,width:515,height,color:rgb(0.93,0.96,0.94)});
      let x = 46;
      lines.forEach((cell,i) => { cell.forEach((line,j) => text(line,x,y-10-j*13,9,font)); x += widths[i]; });
      page.drawLine({start:{x:40,y:y-height+3},end:{x:555,y:y-height+3},thickness:0.5,color:rgb(0.83,0.87,0.85)});
      y -= height;
    };
    row(headers,true); rows.forEach(cells => row(cells)); y -= 10;
  };
  newPage();
  paragraph('Nama murid: '+order.student.name,bold);
  paragraph('Tahun: '+order.year+' | Kelas: '+order.className);
  paragraph('Tarikh tempahan: '+date(order.createdAt)+' (Malaysia)');
  paragraph('Nama pembayar: '+order.payerName);
  if (order.deletedAt) {
    paragraph('STATUS TEMPAHAN: DIPADAM',bold);
    paragraph('Tarikh dipadam: '+date(order.deletedAt));
    paragraph('Sebab: '+order.deletedReason);
    paragraph('Jumlah asal: '+money(order.total));
  }
  heading('SENARAI TEMPAHAN');
  table(['Item','Warna / saiz','Kuantiti','Harga seunit','Jumlah'],order.items.map(item => [item.name,(item.color || '-')+' / '+item.size,String(item.qty),money(item.price),money(Math.round(item.price*100)*item.qty/100)]),[190,110,50,80,85]);
  paragraph('Jumlah tempahan: '+money(total),bold);
  paragraph('Bayaran diterima: '+money(paid),bold);
  paragraph('Baki bayaran: '+money(Math.max(0,total-paid)),bold);
  if (paid > total) paragraph('Lebihan / bayaran perlu diurus: '+money(paid-total),bold);
  paragraph('Status bayaran: '+status,bold);
  heading('REKOD BAYARAN');
  if (order.payments.length) table(['Tarikh','Kaedah','Amaun','Resit / catatan'],order.payments.map(payment => [date(payment.date),payment.method,money(payment.amount),[payment.receiptName,payment.note].filter(Boolean).join(' / ') || '-']),[125,65,80,245]);
  else paragraph('Belum ada bayaran diterima.');
  if (order.note) { heading('CATATAN'); paragraph(order.note); }
  heading('MAKLUMAT AKAUN');
  paragraph('Bank Islam | 12319010018722');
  paragraph('SEKOLAH RENDAH ISLAM INTEGRASI AR RAZI MERU 2');
  pdf.getPages().forEach((page,index,pages) => page.drawText(`Muka surat ${index+1} / ${pages.length}`,{x:40,y:30,size:9,font:regular,color:ink}));
  pdf.setTitle('Tempahan Uniform - '+order.id);
  pdf.setCreationDate(new Date(order.createdAt));
  return pdf.save();
}
