// Katalog disertakan supaya Code.gs boleh dipasang sebagai satu fail lengkap.
function getUniformProducts() {
  const products = [];
  const add = (id, name, gender, years, groups, colors = []) => {
    const sizePrices = {};
    const sizes = [];
    groups.forEach(([groupSizes, price]) => groupSizes.split(',').forEach(size => { sizes.push(size); sizePrices[size] = price; }));
    products.push({ id, name, gender, years, colors, category: 'Uniform', cost: 0,
      sizes, sizePrices, price: groups[0][1] });
  };
  const all = [1, 2, 3, 4, 5, 6];
  const upper = [4, 5, 6];
  const shirt = [['13,14,15,16', 33], ['17,18,19,20', 35]];
  const pants = [['19,20,21,22,23,24', 33], ['25,26', 35]];
  const girls = [['22,24,26,28,30,32', 22], ['34,36,38,40', 25]];
  const sports = '30,32,34,36,38,40';
  const letters = 'S,M,L,XL,2XL,3XL';
  const cadet = 'S,M,L,XL,2XL,3XL,4XL';
  const tops = ['HIJAU', 'PEACH', 'UNGU'];
  const bottoms = ['HIJAU', 'COKLAT', 'BLUE BLACK'];
  add('kemeja', 'Kemeja', 'Lelaki', all, shirt, tops);
  add('seluar-t1', 'Seluar', 'Lelaki', [1,2,3], pants, bottoms);
  add('seluar-t2', 'Seluar', 'Lelaki', upper, pants, [...bottoms, 'HITAM']);
  add('sukan-lelaki', 'Baju sukan', 'Lelaki', all, [[sports,30],[letters,32]]);
  add('kopiah', 'Kopiah', 'Lelaki', all, [['19.5,20,20.5,21,21.5,22,22.5,23',25]]);
  add('tali-leher', 'Tali leher', 'Lelaki', all, [['FREE SIZE',13]]);
  add('jubah', 'Jubah lelaki', 'Lelaki', upper, [['9,10,11,12,13,14,15',55]]);
  add('kadet-lelaki', 'Baju kadet', 'Lelaki', upper, [[cadet,75]]);
  add('beret-lelaki', 'Beret', 'Lelaki', upper, [['6,7,8',12]]);
  add('baju-perempuan', 'Baju perempuan', 'Perempuan', all, girls, tops);
  add('kain-perempuan', 'Kain perempuan', 'Perempuan', all, girls, bottoms);
  add('tudung-1', 'Tudung putih 1 lapis', 'Perempuan', [1,2], [['S,M,L,XL',15]], ['PUTIH']);
  add('tudung-2-t1', 'Tudung 2 lapis', 'Perempuan', [1,2,3], [['S,M',28],['L,XL',32]], ['PUTIH', 'PEACH', 'UNGU']);
  add('tudung-2-t2', 'Tudung 2 lapis', 'Perempuan', upper, [['S,M',28],['L,XL',32]], ['PUTIH', 'PEACH', 'UNGU', 'HITAM']);
  add('sukan-perempuan', 'Baju sukan', 'Perempuan', all, [[sports,32],[letters,35]]);
  add('kadet-perempuan', 'Baju kadet', 'Perempuan', upper, [[cadet,70]]);
  add('seluar-kadet', 'Seluar kadet', 'Perempuan', upper, pants, ['HITAM']);
  add('beret-perempuan', 'Beret', 'Perempuan', upper, [['6,7,8',12]]);
  return products;
}

const CONFIG = {
  teacherPassword: 'Guru1234',
  sheetId: '1_cseyHAdD599a0i9c-1A2BTlYSqDta6MyO95T4fpFz0',
  folderId: '1rPIxTL9i_5l0Mf2QnY5EDpasFwCyF4dI',
  studentCsv: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTf_wvpFNZYigSd2tIkt_pTUEaMxx0-dgkNqVDPJoSzHuikVWIu9TKiGPIEpTtIrcElxy5GI1WfIKJM/pub?gid=0&single=true&output=csv',
  origins: ['https://uniform-ar-razi-meru-2-2026.g-52033830.chatgpt.site'],
  orders: 'Tempahan Uniform', items: 'Item Uniform', payments: 'Bayaran Uniform', products: 'Produk Uniform'
};

const HEADERS = {
  orders: ['ID Tempahan','Tarikh','Nama Murid','Tahun','Kelas','Tahap','Uniform','Nama Pembayar','Telefon','Jumlah Item','Jumlah Tempahan','Jumlah Bayaran','Baki','Status Bayaran','Status Serahan','Catatan','Sumber','Data JSON'],
  items: ['ID Tempahan','Bil Item','Nama Murid','Kelas','Produk','Warna','Saiz','Kuantiti','Harga Seunit','Jumlah','Status Serahan'],
  payments: ['ID Tempahan','ID Bayaran','Tarikh','Nama Murid','Kaedah','Jumlah','Nama Resit','ID Fail Drive','URL Resit'],
  products: ['ID Produk','Data JSON']
};

function setup() {
  const db = SpreadsheetApp.openById(CONFIG.sheetId);
  DriveApp.getFolderById(CONFIG.folderId).getName();
  Object.keys(HEADERS).forEach(key => tab_(db, key));
  return 'Persediaan selesai.';
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, service: 'uniform-api-v1', version: 4, catalogItems: getUniformProducts().length }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let request = {};
  let message;
  const origins = allowedOrigins_();
  try {
    request = JSON.parse(e.parameter.payload || e.postData.contents);
    if (!origins.includes(request.origin)) throw new Error('Asal laman tidak dibenarkan.');
    const result = dispatch_(request);
    message = { ok: true, result };
  } catch (error) {
    console.error(error.stack || error);
    message = { ok: false, error: String(error.message || error) };
  }
  message.channel = 'uniform-api-v1';
  message.requestId = String(request.requestId || '');
  const target = origins.includes(request.origin) ? request.origin : CONFIG.origins[0];
  // Escape script delimiters before embedding submitted text in the response.
  const json = JSON.stringify(message).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return HtmlService.createHtmlOutput('<!doctype html><meta charset="utf-8"><script>window.top.postMessage(' + json + ',' + JSON.stringify(target) + ');</script>')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function allowedOrigins_() {
  const configured = PropertiesService.getScriptProperties().getProperty('ALLOWED_ORIGINS') || '';
  return CONFIG.origins.concat(configured.split(/[\s,]+/).map(origin => origin.replace(/\/+$/, '')).filter(Boolean));
}

function dispatch_(request) {
  const action = request.action;
  const payload = request.payload || {};
  if (action === 'login') return login_(payload.password);
  if (action === 'catalog') return products_(SpreadsheetApp.openById(CONFIG.sheetId));
  const admin = ['listOrders','saveProduct','addPayment','setDelivery'].includes(action) ||
    (action === 'saveOrder' && payload.order && payload.order.source === 'Borang manual');
  if (admin) authorize_(request.token);
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const db = SpreadsheetApp.openById(CONFIG.sheetId);
    if (action === 'listOrders') return orders_(db).map(row => row.order).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    if (action === 'saveProduct') return saveProduct_(db, payload);
    if (action === 'saveOrder') return saveOrder_(db, payload.order, Boolean(request.token && admin));
    if (action === 'addPayment' || action === 'setDelivery') {
      const entry = orders_(db).find(row => row.order.id === payload.orderId);
      if (!entry) throw new Error('Tempahan tidak ditemui.');
      const order = entry.order;
      if (action === 'addPayment') {
        const payment = validatePayment_(payload.payment);
        if (!order.payments.some(item => item.id === payment.id)) {
          if (paid_(order) + payment.amount > order.total) throw new Error('Jumlah bayaran melebihi baki tempahan.');
          order.payments.push(uploadReceipt_(payment));
        }
      } else {
        if (!Number.isInteger(payload.index) || !order.items[payload.index] || typeof payload.delivered !== 'boolean') throw new Error('Item serahan tidak sah.');
        order.items[payload.index].delivered = payload.delivered;
      }
      storeOrder_(db, order, entry.row);
      return order;
    }
    throw new Error('Tindakan tidak dikenali.');
  } finally { lock.releaseLock(); }
}

function login_(password) {
  const expected = CONFIG.teacherPassword;
  if (typeof password !== 'string' || password !== expected) throw new Error('Kata laluan tidak tepat.');
  const token = Utilities.getUuid() + Utilities.getUuid();
  CacheService.getScriptCache().put('session:' + token, 'teacher', 21600);
  return { token };
}

function authorize_(token) {
  if (!token || CacheService.getScriptCache().get('session:' + token) !== 'teacher') throw new Error('Sesi guru tamat. Sila login semula.');
}

function tab_(db, key) {
  const sheet = db.getSheetByName(CONFIG[key]) || db.insertSheet(CONFIG[key]);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1,1,1,HEADERS[key].length).setValues([HEADERS[key]]);
    sheet.setFrozenRows(1);
  } else {
    const headers = sheet.getRange(1,1,1,HEADERS[key].length).getValues()[0];
    if (JSON.stringify(headers) !== JSON.stringify(HEADERS[key])) throw new Error('Struktur tab ' + CONFIG[key] + ' berbeza. Gunakan nama tab baharu dalam CONFIG.');
  }
  return sheet;
}

function products_(db) {
  const sheet = tab_(db,'products');
  const overrides = sheet.getLastRow() > 1 ? sheet.getRange(2,1,sheet.getLastRow()-1,2).getValues() : [];
  return getUniformProducts().map(product => {
    const row = overrides.find(row => row[0] === product.id);
    if (row) Object.assign(product, JSON.parse(row[1]));
    return product;
  });
}

function saveProduct_(db, payload) {
  const product = getUniformProducts().find(item => item.id === payload.id);
  if (!product) throw new Error('Produk tidak sah.');
  const sizePrices = {};
  product.sizes.forEach(size => { sizePrices[size] = amount_(payload.sizePrices && payload.sizePrices[size]); });
  const sheet = tab_(db,'products');
  const rows = sheet.getLastRow() > 1 ? sheet.getRange(2,1,sheet.getLastRow()-1,1).getValues() : [];
  const index = rows.findIndex(row => row[0] === product.id);
  const data = JSON.stringify({ sizePrices, cost: amount_(payload.cost) });
  sheet.getRange(index < 0 ? sheet.getLastRow()+1 : index+2,1,1,2).setValues([[product.id,data]]);
  return products_(db);
}

function orders_(db) {
  const sheet = tab_(db,'orders');
  if (sheet.getLastRow() < 2) return [];
  return sheet.getRange(2,18,sheet.getLastRow()-1,1).getValues().map((row,index) => ({ row: index+2, order: JSON.parse(row[0]) }));
}

function saveOrder_(db, input, admin) {
  if (!input || !/^[a-zA-Z0-9-]{10,80}$/.test(input.id || '')) throw new Error('ID tempahan tidak sah.');
  const existing = orders_(db).find(entry => entry.order.id === input.id);
  if (existing) {
    if (!admin && existing.order.source !== 'Ibu bapa') throw new Error('ID tempahan tidak sah.');
    storeOrder_(db, existing.order, existing.row);
    return existing.order;
  }
  const year = Number(input.student && input.student.year);
  if (!Number.isInteger(year) || year < 1 || year > 6) throw new Error('Tahun murid tidak sah.');
  const student = verifiedStudent_(input.student);
  if (!['Lelaki','Perempuan'].includes(input.gender)) throw new Error('Pilihan uniform tidak sah.');
  if (!Array.isArray(input.items) || !input.items.length || input.items.length > 30) throw new Error('Senarai item tidak sah.');
  const catalog = products_(db);
  const items = input.items.map(item => {
    const p = catalog.find(p => p.id === item.productId && p.gender === input.gender && p.years.includes(year));
    if (!p || !p.sizes.includes(String(item.size))) throw new Error('Produk atau saiz tidak sesuai dengan tahun murid.');
    if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > 99) throw new Error('Kuantiti mestilah 1 hingga 99.');
    const color = String(item.color || '');
    if ((p.colors.length && !p.colors.includes(color)) || (!p.colors.length && color)) throw new Error('Warna tidak sah.');
    return { productId: p.id, name: p.name, category: p.category, size: String(item.size), color, qty: item.qty, price: p.sizePrices[item.size], cost: p.cost, delivered: false };
  });
  const order = { id: input.id, source: admin ? 'Borang manual' : 'Ibu bapa', createdAt: new Date().toISOString(), student, year: String(year), className: student.className,
    gender: input.gender, items, total: Math.round(items.reduce((sum,item) => sum + Math.round(item.price*100) * item.qty,0))/100,
    payerName: text_(input.payerName,120), payerPhone: text_(input.payerPhone,30), note: text_(input.note,2000), payments: [] };
  if (!admin && !order.payerName) throw new Error('Nama pembayar diperlukan.');
  if (Math.abs(Number(input.total) - order.total) > 0.001) throw new Error('Harga telah dikemas kini. Muat semula laman dan semak jumlah tempahan.');
  if (input.payments && input.payments.length > 1) throw new Error('Hanya satu bayaran awal dibenarkan.');
  if (input.payments && input.payments.length) {
    const payment = validatePayment_(input.payments[0]);
    if (payment.amount > order.total) throw new Error('Bayaran melebihi nilai tempahan.');
    if (!admin && payment.method === 'QR' && !payment.receiptData) throw new Error('Resit diperlukan untuk transfer / QR.');
    order.payments = [uploadReceipt_(payment)];
  }
  storeOrder_(db,order);
  return order;
}

function verifiedStudent_(input) {
  const response = UrlFetchApp.fetch(CONFIG.studentCsv);
  const rows = Utilities.parseCsv(response.getContentText());
  const row = rows.slice(1).find(row => 'murid-' + String(row[0]).trim() === input.id || String(row[0]).trim() + '-' + String(row[3] || row[1]).trim() === input.id);
  if (!row || String(row[2]).trim() !== input.className || Number((String(row[2]).match(/\d+/) || [])[0]) !== Number(input.year)) throw new Error('Murid tidak sepadan dengan rekod sekolah.');
  return { id: input.id, name: String(row[1]).trim(), className: String(row[2]).trim(), year: String(input.year) };
}

function validatePayment_(input) {
  if (!input || !/^[a-zA-Z0-9-]{10,80}$/.test(input.id || '') || !['Tunai','QR'].includes(input.method)) throw new Error('Butiran bayaran tidak sah.');
  const amount = amount_(input.amount);
  if (amount <= 0) throw new Error('Jumlah bayaran mestilah lebih daripada sifar.');
  return { id: input.id, date: new Date().toISOString(), amount, method: input.method,
    receiptName: text_(input.receiptName,200), receiptData: input.receiptData || '', receiptMimeType: input.receiptMimeType || '' };
}

function uploadReceipt_(payment) {
  if (payment.receiptData) {
    const match = String(payment.receiptData).match(/^data:(image\/(?:jpeg|png|webp)|application\/pdf);base64,([A-Za-z0-9+/=\r\n]+)$/);
    if (!match || match[2].length > 7 * 1024 * 1024) throw new Error('Format resit tidak sah atau melebihi 5 MB.');
    const bytes = Utilities.base64Decode(match[2]);
    if (!bytes.length || bytes.length > 5 * 1024 * 1024) throw new Error('Saiz resit tidak sah.');
    const extension = { 'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp', 'application/pdf':'pdf' }[match[1]];
    const folder = DriveApp.getFolderById(CONFIG.folderId);
    const name = 'RESIT-' + payment.id + '.' + extension;
    const files = folder.getFilesByName(name);
    const file = files.hasNext() ? files.next() : folder.createFile(Utilities.newBlob(bytes,match[1],name));
    payment.receiptFileId = file.getId(); payment.receiptUrl = file.getUrl();
  }
  delete payment.receiptData; delete payment.receiptMimeType;
  return payment;
}

function storeOrder_(db, order, row) {
  const paid = paid_(order);
  const paymentStatus = paid === 0 ? 'Belum bayar' : paid < order.total ? 'Bayar sebahagian' : 'Selesai bayar';
  const delivered = order.items.every(item => item.delivered) ? 'Selesai diserahkan' : 'Belum selesai';
  const values = [order.id,order.createdAt,order.student.name,order.year,order.className,Number(order.year) <= 3 ? 1 : 2,order.gender,order.payerName,order.payerPhone,
    order.items.reduce((sum,item) => sum+item.qty,0),order.total,paid,order.total-paid,paymentStatus,delivered,order.note,order.source,JSON.stringify(order)];
  const sheet = tab_(db,'orders');
  sheet.getRange(row || sheet.getLastRow()+1,1,1,values.length).setValues([values.map(cell_)]);
  // The JSON row is canonical. Retrying the same ID rebuilds the readable tabs.
  replaceRows_(tab_(db,'items'),order.id,order.items.map((item,index) => [order.id,index+1,order.student.name,order.className,item.name,item.color,item.size,item.qty,item.price,item.price*item.qty,item.delivered ? 'Selesai diserahkan' : 'Belum selesai']));
  replaceRows_(tab_(db,'payments'),order.id,order.payments.map(p => [order.id,p.id,p.date,order.student.name,p.method,p.amount,p.receiptName,p.receiptFileId || '',p.receiptUrl || '']));
  SpreadsheetApp.flush();
}

function replaceRows_(sheet,id,rows) {
  if (sheet.getLastRow() > 1) {
    const ids = sheet.getRange(2,1,sheet.getLastRow()-1,1).getValues();
    for (let index=ids.length-1; index>=0; index--) if (ids[index][0] === id) sheet.deleteRow(index+2);
  }
  if (rows.length) sheet.getRange(sheet.getLastRow()+1,1,rows.length,rows[0].length).setValues(rows.map(row => row.map(cell_)));
}

function paid_(order) { return order.payments.reduce((sum,p) => sum+Math.round(p.amount*100),0)/100; }
function text_(value,max) { return String(value || '').trim().slice(0,max); }
function cell_(value) { return typeof value === 'string' && /^[=+@-]/.test(value) ? "'"+value : value; }
function amount_(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1000000 || Math.abs(value*100-Math.round(value*100)) > 0.00001) throw new Error('Nilai wang tidak sah.');
  return value;
}
