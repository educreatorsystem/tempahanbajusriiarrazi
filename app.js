const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTf_wvpFNZYigSd2tIkt_pTUEaMxx0-dgkNqVDPJoSzHuikVWIu9TKiGPIEpTtIrcElxy5GI1WfIKJM/pub?gid=0&single=true&output=csv";
const DRIVE_FOLDER_ID = "1rPIxTL9i_5l0Mf2QnY5EDpasFwCyF4dI";
const STORAGE = {
  students: "uniform-students-cache-v2",
};

const DEFAULT_PRODUCTS = getUniformProducts();


const state = {
  students: [],
  products: structuredClone(DEFAULT_PRODUCTS),
  orders: [],
  selectedStudent: null,
  parentCart: {},
  manualCart: {},
  adminLoggedIn: false,
  adminToken: '',
  pendingOrder: null,
  pendingManualOrder: null,
  confirmedOrder: null,
  editingPayment: null,
  pendingPaymentUpdate: null,
  manualSuggestions: [],
  manualSuggestionIndex: -1,
  orderEditingReady: false,
  orderDraft: [],
  pendingOrderUpdate: null,
  editorBusy: false,
};

const el = (selector) => document.querySelector(selector);
const els = (selector) => Array.from(document.querySelectorAll(selector));

const currency = new Intl.NumberFormat("ms-MY", {
  style: "currency",
  currency: "MYR",
});

const icons = {
  copy: '<svg viewBox="0 0 24 24"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>',
  user: '<svg viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>',
  refresh: '<svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>',
  download: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>',
  save: '<svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></svg>',
  login: '<svg viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>',
};

function boot() {
  injectIcons();
  bindGlobalEvents();
  loadStudents();
  uniformRequest('catalog').then(products => {
    state.products = products;
    const ready = supportsSizeCosts();
    el('#save-status').hidden = ready;
    if (!ready) el('#save-status').textContent = 'Tetapan kos saiz dan kemaskini bayaran guru memerlukan Apps Script versi 6.';
    renderAll();
    if (state.editingPayment && el('#payment-editor').open) renderOrderEditor();
  }).catch(() => {
    el('#save-status').textContent = 'Simpanan tempahan belum tersedia. Sila hubungi pihak sekolah.';
    el('#save-status').hidden = false;
  });
  uniformRequest('capabilities').then(features => {
    state.orderEditingReady = features.orderEditing === true;
    if (state.editingPayment && el('#payment-editor').open) renderOrderEditor();
  }).catch(() => { state.orderEditingReady = false; });
  renderAll();
}

function injectIcons() {
  document.querySelectorAll("[data-icon]").forEach((node) => {
    const name = node.getAttribute("data-icon");
    node.innerHTML = icons[name] || "";
  });
}

function readJson(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

async function loadStudents() {
  showNotice("Sedang memuat turun rekod murid daripada Google Sheet...");
  try {
    const response = await fetch(CSV_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const csv = await response.text();
    const rows = parseCsv(csv);
    state.students = rows
      .slice(1)
      .map(mapStudentRow)
      .filter((student) => student.name && student.className);
    writeJson(STORAGE.students, state.students);
    showNotice(`${state.students.length} rekod murid berjaya dimuatkan daripada Google Sheet.`);
  } catch (error) {
    const cached = readJson(STORAGE.students, []);
    state.students = cached;
    showNotice(
      `Rekod live tidak dapat dimuatkan. Sistem menggunakan ${
        cached.length ? "cache terakhir" : "senarai kosong"
      } buat sementara.`
    );
  }
  renderStudents();
  renderStudentOptions();
  renderFilters();
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }
  return rows;
}

function mapStudentRow(columns) {
  const className = columns[2] || "";
  return {
    id: `murid-${columns[0] || crypto.randomUUID()}`,
    bil: columns[0] || "",
    name: titleCase(columns[1] || ""),
    className,
    year: extractYear(className),
    registeredAt: columns[5] || "",
    guardian1Name: titleCase(columns[6] || ""),
    guardian2Name: titleCase(columns[8] || ""),
  };
}

function titleCase(value) {
  return value
    .toLowerCase()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase())
    .replace(/\bBin\b/g, "Bin")
    .replace(/\bBinti\b/g, "Binti");
}

function extractYear(className) {
  const match = String(className).match(/\d+/);
  return match ? match[0] : "";
}

function showNotice(message) {
  const box = el("#data-notice");
  box.textContent = message;
  box.hidden = false;
}

function bindGlobalEvents() {
  el('#download-receipt').addEventListener('click', downloadReceipt);
  el('#new-parent-order').addEventListener('click', () => {
    state.confirmedOrder = null; state.selectedStudent = null;
    el('#parent-confirmation').hidden = true; el('.parent-layout').hidden = false;
    el('#page-title').textContent = 'Borang Tempahan Ibu Bapa';
    el('#student-search').value = ''; renderStudents(); renderSelectedStudent(); renderProducts();
  });
  ['#payment-search','#payment-class','#payment-item','#payment-status-filter','#payment-archived'].forEach(selector => el(selector).addEventListener('input', renderPaymentRecords));
  els('[data-editor-mode]').forEach(button => button.addEventListener('click', () => switchPaymentEditorMode(button.dataset.editorMode)));
  el('#order-editor-form').addEventListener('submit', event => { event.preventDefault(); saveOrderCorrection('editOrderItems'); });
  el('#edit-order-note').addEventListener('input', () => { state.pendingOrderUpdate = null; });
  el('#delete-order').addEventListener('click', () => saveOrderCorrection('deleteOrder'));
  el('#restore-order').addEventListener('click', () => saveOrderCorrection('restoreOrder'));
  el('#close-payment-editor').addEventListener('click', () => el('#payment-editor').close());
  el('#payment-editor-form').addEventListener('submit', savePaymentStatus);
  el('#payment-editor').addEventListener('cancel', event => { if (state.editorBusy) event.preventDefault(); });
  el('#payment-editor-form').addEventListener('input', () => { state.pendingPaymentUpdate = null; });
  el('#edit-payment-status').addEventListener('change', () => {
    const status = el('#edit-payment-status').value;
    const input = el('#edit-payment-received');
    if (status === 'Belum bayar') input.value = '0.00';
    if (status === 'Selesai bayar') input.value = Math.max(effectiveTotal(state.editingPayment),paidAmount(state.editingPayment)).toFixed(2);
    if (status === 'Bayar sebahagian' && (Number(input.value) <= 0 || Number(input.value) >= effectiveTotal(state.editingPayment))) input.value = '';
    input.readOnly = status !== 'Bayar sebahagian' && !(status === 'Selesai bayar' && creditAmount(state.editingPayment) > 0);
    renderPaymentEditorBalance();
  });
  el('#edit-payment-received').addEventListener('input', renderPaymentEditorBalance);
  el('#copy-account').addEventListener('click', copyBankAccount);
  els(".nav-button").forEach((button) => {
    button.addEventListener("click", () => switchMainView(button.dataset.view));
  });
  el("#refresh-students").addEventListener("click", loadStudents);
  el("#export-orders").addEventListener("click", exportOrders);
  el('#export-orders').hidden = true;
  el('#reload-orders').addEventListener('click', async () => {
    const button = el('#reload-orders'); button.disabled = true;
    try { state.orders = await uniformRequest('listOrders', {}, state.adminToken); renderAll(); }
    catch (error) { alert(error.message); }
    finally { button.disabled = false; }
  });
  el('#logout-teacher').addEventListener('click', () => {
    state.adminLoggedIn = false; state.adminToken = ''; state.orders = [];
    el('#admin-workspace').hidden = true; el('#login-panel').hidden = false;
    ['#reload-orders','#logout-teacher','#export-orders'].forEach(selector => { el(selector).hidden = true; });
    renderAll();
  });
  el("#student-search").addEventListener("input", renderStudents);
  el("#parent-order-form").addEventListener("submit", saveParentOrder);
  el('#parent-order-form').addEventListener('input', () => { state.pendingOrder = null; });
  el("#login-form").addEventListener("submit", loginTeacher);
  el("#save-manual-order").addEventListener("click", saveManualOrder);
  el("#change-student").addEventListener("click", () => {
    state.selectedStudent = null; state.parentCart = {}; state.pendingOrder = null;
    el('#student-search').value = '';
    renderStudents(); renderSelectedStudent(); renderProducts(); renderCartSummary();
  });
  el('#uniform-gender').addEventListener('change', () => {
    state.parentCart = {}; state.pendingOrder = null; renderProducts(); renderCartSummary();
  });
  el('#manual-gender').addEventListener('change', () => {
    state.manualCart = {}; state.pendingManualOrder = null; renderManualProducts(); renderManualSummary();
  });
  el('#manual-student-search').addEventListener('input', () => {
    if (el('#manual-student').value) clearManualStudent(false);
    renderManualStudentSuggestions();
  });
  el('#manual-student-search').addEventListener('focus', renderManualStudentSuggestions);
  el('#manual-student-search').addEventListener('keydown', handleManualStudentKey);
  el('#change-manual-student').addEventListener('click', () => { clearManualStudent(true); el('#manual-student-search').focus(); });
  document.addEventListener('click', event => { if (!el('#manual-student-field').contains(event.target)) closeManualStudentSuggestions(); });
  el('#manual-student-field').addEventListener('focusout', event => {
    if (!el('#manual-student-field').contains(event.relatedTarget)) closeManualStudentSuggestions();
  });
  el('#manual-note').addEventListener('input', () => { state.pendingManualOrder = null; });
  ["#filter-search", "#filter-year", "#filter-class", "#filter-payment", "#filter-delivery"].forEach(
    (selector) => el(selector).addEventListener("input", renderOrdersTable)
  );
  els(".tab").forEach((button) => {
    button.addEventListener("click", () => switchAdminTab(button.dataset.adminTab));
  });
}

async function copyBankAccount() {
  const account = el('#bank-account-number').textContent.trim();
  const status = el('#copy-account-status');
  try {
    try { await navigator.clipboard.writeText(account); }
    catch {
      const input = document.createElement('textarea');
      input.value = account;
      input.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.append(input); input.select();
      const copied = document.execCommand('copy'); input.remove();
      if (!copied) throw new Error('copy unavailable');
    }
    status.textContent = 'Nombor akaun telah disalin.';
  } catch { status.textContent = 'Tidak dapat menyalin. Nombor akaun: ' + account; }
}

function switchMainView(view) {
  els(".nav-button").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  els(".view").forEach((panel) => panel.classList.remove("active-view"));
  el(`#${view}-view`).classList.add("active-view");
  el("#page-title").textContent =
    view === "parent" ? (state.confirmedOrder ? 'Ringkasan tempahan' : 'Borang Tempahan Ibu Bapa') : "Pemantauan Guru";
}

function switchAdminTab(tab) {
  els(".tab").forEach((button) => button.classList.toggle("active", button.dataset.adminTab === tab));
  els(".admin-tab").forEach((panel) => panel.classList.remove("active-admin-tab"));
  el(`#tab-${tab}`).classList.add("active-admin-tab");
}

function renderAll() {
  renderProducts();
  renderCartSummary();
  renderProductTable();
  renderManualProducts();
  renderManualSummary();
  renderDashboard();
  renderPaymentRecords();
  renderOrdersTable();
  renderReports();
}

function renderStudents() {
  const query = el("#student-search").value.trim().toLowerCase();
  const list = el("#student-list");
  el("#student-count").textContent = state.selectedStudent ? '1 murid dipilih' : `${state.students.length} murid`;
  el('#student-search-field').hidden = Boolean(state.selectedStudent);
  el('#change-student').hidden = !state.selectedStudent;
  const visible = state.selectedStudent ? [state.selectedStudent] : state.students
    .filter((student) =>
      [student.name, student.className]
        .join(" ")
        .toLowerCase()
        .includes(query)
    )
    .slice(0, 80);

  if (!visible.length) {
    list.innerHTML = '<div class="empty">Tiada murid ditemui.</div>';
    return;
  }

  list.innerHTML = visible
    .map(
      (student) => `
        <button class="student-card ${state.selectedStudent?.id === student.id ? "active" : ""}" data-student-id="${escapeAttr(student.id)}">
          <strong>${escapeHtml(student.name)}</strong>
          <div class="student-meta">
            <span>${escapeHtml(student.className)}</span>
          </div>
        </button>
      `
    )
    .join("");

  list.querySelectorAll("[data-student-id]").forEach((button) => {
    button.addEventListener("click", () => selectStudent(button.dataset.studentId));
  });
}

function selectStudent(id) {
  state.selectedStudent = state.students.find((student) => student.id === id);
  if (!state.selectedStudent) return;
  state.parentCart = {}; state.pendingOrder = null;
  const payerName = state.selectedStudent.guardian1Name || state.selectedStudent.guardian2Name || "";
  el("#payer-name").value = payerName;
  renderStudents();
  renderSelectedStudent();
  renderProducts(); renderCartSummary();
}

function renderSelectedStudent() {
  const student = state.selectedStudent;
  el('#gender-field').hidden = !student;
  if (!student) {
    el("#selected-student-pill").textContent = "Belum pilih murid";
    el("#selected-student-card").textContent = "Pilih nama murid dahulu untuk mula membuat tempahan.";
    return;
  }
  el("#selected-student-pill").textContent = `${student.className} / Tahap ${Number(student.year) <= 3 ? 1 : 2}`;
  el("#selected-student-card").innerHTML = `
    <strong>${escapeHtml(student.name)}</strong>
    <div class="student-meta">
      <span>Tahun ${escapeHtml(student.year || "-")}</span>
      <span>${escapeHtml(student.className)}</span>
    </div>
    <div class="student-meta">
      <span>Penjaga 1: ${escapeHtml(student.guardian1Name || "-")}</span>
    </div>
  `;
}

function renderProducts() {
  renderProductGrid("#product-grid", state.parentCart, true);
}

function renderManualProducts() {
  const student = state.students.find(student => student.id === el('#manual-student').value);
  const products = availableProducts(student, el('#manual-gender').value);
  const table = el('#manual-products');
  table.innerHTML = products.length ? products.map((product,index) => {
    const line = state.manualCart[product.id] || { size: product.sizes[0], color: product.colors[0] || '', qty: 0 };
    return `<tr data-product-card="${escapeAttr(product.id)}">
      <td>${index+1}</td><td><strong>${escapeHtml(product.name)}</strong></td>
      <td>${product.colors.length ? `<select data-product-color="${escapeAttr(product.id)}" aria-label="Warna ${escapeAttr(product.name)}">${product.colors.map(color => `<option ${color === line.color ? 'selected' : ''}>${escapeHtml(color)}</option>`).join('')}</select>` : '-'}</td>
      <td><select data-product-size="${escapeAttr(product.id)}" aria-label="Saiz ${escapeAttr(product.name)}">${product.sizes.map(size => `<option ${size === line.size ? 'selected' : ''}>${escapeHtml(size)}</option>`).join('')}</select></td>
      <td class="number" data-line-price>${money(unitPrice(product,line.size))}</td>
      <td><input data-product-qty="${escapeAttr(product.id)}" type="number" min="0" max="99" step="1" value="${line.qty}" aria-label="Kuantiti ${escapeAttr(product.name)}" /></td>
      <td class="number" data-line-total>${money(unitPrice(product,line.size)*line.qty)}</td></tr>`;
  }).join('') : '<tr><td colspan="7" class="empty">Pilih murid dahulu.</td></tr>';
  bindProductControls(table, products, state.manualCart, false);
  el('#save-manual-order').disabled = !student;
}

function availableProducts(student, gender) {
  return student ? state.products.filter(p => p.gender === gender && p.years.includes(Number(student.year))) : [];
}

function unitPrice(product, size) {
  return Number(product.sizePrices[size]);
}

function renderProductGrid(selector, cart, updateParentSummary) {
  const grid = el(selector);
  const student = updateParentSummary ? state.selectedStudent : state.students.find(s => s.id === el('#manual-student').value);
  const gender = el(updateParentSummary ? '#uniform-gender' : '#manual-gender').value;
  const products = availableProducts(student, gender);
  grid.innerHTML = products.length ? products.map(product => {
    const line = cart[product.id] || { size: product.sizes[0], color: product.colors[0] || '', qty: 0 };
    return `
      <article class="product-card" data-product-card="${escapeAttr(product.id)}">
        <span class="label">${escapeHtml(product.gender)} / Tahap ${Number(student.year) <= 3 ? 1 : 2}</span>
        <strong>${escapeHtml(product.name)}</strong>
        <span class="price" data-line-price>${money(unitPrice(product, line.size))} / unit</span>
        ${product.colors.length ? `<label>Warna<select data-product-color="${escapeAttr(product.id)}" aria-label="Warna ${escapeAttr(product.name)}">
          ${product.colors.map(color => `<option ${color === line.color ? 'selected' : ''}>${escapeHtml(color)}</option>`).join('')}
        </select></label>` : ''}
        <div class="product-controls">
          <label>Saiz<select data-product-size="${escapeAttr(product.id)}" aria-label="Saiz ${escapeAttr(product.name)}">
            ${product.sizes.map(size => `<option ${size === line.size ? 'selected' : ''}>${escapeHtml(size)}</option>`).join('')}
          </select></label>
          <label>Kuantiti<input data-product-qty="${escapeAttr(product.id)}" type="number" min="0" max="99" step="1" value="${line.qty}" aria-label="Kuantiti ${escapeAttr(product.name)}" /></label>
        </div>
        <span data-line-total>Jumlah: ${money(unitPrice(product, line.size) * line.qty)}</span>
      </article>`;
  }).join('') : '<div class="empty">Pilih murid untuk melihat uniform mengikut tahun.</div>';
  bindProductControls(grid, products, cart, updateParentSummary);
}

function bindProductControls(grid, products, cart, updateParentSummary) {
  grid.querySelectorAll('[data-product-card]').forEach(card => {
    const product = products.find(p => p.id === card.dataset.productCard);
    card.querySelectorAll('input, select').forEach(control => control.addEventListener('input', () => {
      const size = card.querySelector('[data-product-size]').value;
      const qty = Math.min(99, Math.max(0, Math.floor(Number(card.querySelector('[data-product-qty]').value) || 0)));
      cart[product.id] = { size, qty, color: card.querySelector('[data-product-color]')?.value || '' };
      card.querySelector('[data-line-price]').textContent = money(unitPrice(product, size)) + (updateParentSummary ? ' / unit' : '');
      card.querySelector('[data-line-total]').textContent = (updateParentSummary ? 'Jumlah: ' : '') + money(unitPrice(product, size) * qty);
      if (updateParentSummary) state.pendingOrder = null; else state.pendingManualOrder = null;
      if (updateParentSummary) renderCartSummary(); else renderManualSummary();
    }));
  });
}

function getCartItems(cart) {
  return Object.entries(cart).map(([productId, line]) => {
    const product = state.products.find(p => p.id === productId);
    if (!product || !line.qty) return null;
    return { productId, name: product.name, category: product.category, size: line.size,
      color: line.color || '', qty: Number(line.qty), price: unitPrice(product, line.size),
      cost: Number(product.sizeCosts?.[line.size] ?? product.cost ?? 0), delivered: false };
  }).filter(Boolean);
}

function renderCartSummary() {
  const items = getCartItems(state.parentCart);
  const total = itemsTotal(items);
  el('#cart-total').textContent = money(total);
  el('#cart-items').textContent = String(items.reduce((sum, item) => sum + item.qty, 0));
  el('#payment-amount').max = total;
  el('#payment-amount').value = total.toFixed(2);
}

function renderManualSummary() {
  el('#manual-total').textContent = money(itemsTotal(getCartItems(state.manualCart)));
}

async function saveParentOrder(event) {
  event.preventDefault();
  if (!state.selectedStudent) {
    alert("Sila pilih nama murid dahulu.");
    return;
  }
  const items = getCartItems(state.parentCart);
  if (!items.length) {
    alert("Sila masukkan sekurang-kurangnya satu item tempahan.");
    return;
  }

  const paid = Math.max(0, Number(el("#payment-amount").value) || 0);
  const receiptFile = el("#receipt-upload").files[0];
  if (paid > itemsTotal(items)) { alert('Jumlah bayaran melebihi nilai tempahan.'); return; }
  if (paid > 0 && el('#payment-method').value === 'QR' && !receiptFile) {
    alert('Sila lampirkan resit bagi bayaran transfer / QR.'); return;
  }
  if (receiptFile && (!['image/jpeg','image/png','image/webp','application/pdf'].includes(receiptFile.type) || receiptFile.size > 5 * 1024 * 1024)) {
    alert('Resit mestilah JPG, PNG, WEBP atau PDF dan tidak melebihi 5 MB.'); return;
  }
  let receiptData = "";
  if (receiptFile) {
    try {
      receiptData = await fileToDataUrl(receiptFile);
    } catch {
      alert("Resit terlalu besar atau tidak dapat dibaca.");
      return;
    }
  }

  const order = createOrder({
    source: "Ibu bapa",
    student: state.selectedStudent,
    items,
    payerName: el("#payer-name").value.trim(),
    note: el("#order-note").value.trim(),
    payment: paid
      ? {
          amount: paid,
          method: el("#payment-method").value,
          receiptName: receiptFile?.name || "",
          receiptData,
          receiptMimeType: receiptFile?.type || '',
        }
      : null,
  });
  const submit = el('#parent-order-form button[type="submit"]');
  submit.disabled = true;
  const controls = els('#parent-order-form input, #parent-order-form select, #parent-order-form textarea, #uniform-gender, #change-student, #student-list button');
  controls.forEach(control => { control.disabled = true; });
  state.pendingOrder = state.pendingOrder || order;
  state.pendingOrder.gender = el('#uniform-gender').value;
  try {
    const saved = await uniformRequest('saveOrder', { order: state.pendingOrder });
    if (state.adminLoggedIn) state.orders = [saved, ...state.orders.filter(item => item.id !== saved.id)];
    state.confirmedOrder = saved;
    state.pendingOrder = null;
  } catch (error) {
    alert(error.message); return;
  } finally { submit.disabled = false; controls.forEach(control => { control.disabled = false; }); }
  state.parentCart = {};
  el("#parent-order-form").reset();
  renderProducts();
  renderCartSummary();
  renderAll();
  renderParentConfirmation();
}

function createOrder({ source, student, items, payerName = "", payerPhone = "", note = "", payment = null }) {
  const payments = payment
    ? [
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          amount: Number(payment.amount),
          method: payment.method,
          receiptName: payment.receiptName || "",
          receiptData: payment.receiptData || "",
          receiptMimeType: payment.receiptMimeType || '',
          driveFolderId: DRIVE_FOLDER_ID,
        },
      ]
    : [];
  return {
    id: crypto.randomUUID(),
    source,
    createdAt: new Date().toISOString(),
    student,
    year: student.year,
    className: student.className,
    items,
    total: itemsTotal(items),
    payerName,
    payerPhone,
    note,
    payments,
  };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function loginTeacher(event) {
  event.preventDefault();
  const password = el('#teacher-password').value;
  const loginConfig = JSON.parse(el('#teacher-login-config').textContent);
  if (password !== loginConfig.password) { alert('Kata laluan tidak tepat.'); return; }
  const button = el('#login-form button'); button.disabled = true;
  try {
    const session = await uniformRequest('login', { password });
    state.adminToken = session.token;
    state.orders = await uniformRequest('listOrders', {}, state.adminToken);
    el('#teacher-password').value = '';
  } catch (error) { alert(error.message); return; }
  finally { button.disabled = false; }
  state.adminLoggedIn = true;
  ['#reload-orders','#logout-teacher','#export-orders'].forEach(selector => { el(selector).hidden = false; });
  el("#login-panel").hidden = true;
  el("#admin-workspace").hidden = false;
  renderAll();
}

function renderDashboard() {
  const totals = calculateTotals(state.orders);
  el("#metrics").innerHTML = [
    ["Murid membuat tempahan", totals.studentsOrdered],
    ["Nilai tempahan uniform", money(totals.orderValue)],
    ["Kutipan tunai", money(totals.cashPaid)],
    ["Kutipan QR", money(totals.qrPaid)],
    ["Baki belum diterima", money(totals.balance)],
    ["Lebihan / bayaran perlu diurus", money(totals.credit)],
    ["Anggaran untung kasar", money(totals.profit)],
    ["Belum selesai serahan", totals.pendingDelivery],
    ["Selesai bayar", totals.paidOrders],
  ]
    .map(
      ([label, value]) => `
        <div class="metric">
          <span class="label">${label}</span>
          <strong>${value}</strong>
        </div>
      `
    )
    .join("");

  const statusCounts = countBy(state.orders.filter(order => !order.deletedAt), (order) => paymentStatus(order));
  const max = Math.max(1, ...Object.values(statusCounts));
  el("#status-breakdown").innerHTML = ["Belum bayar", "Bayar sebahagian", "Selesai bayar"]
    .map((status) => {
      const count = statusCounts[status] || 0;
      return `
        <div class="bar-row">
          <div class="bar-head"><strong>${status}</strong><span>${count}</span></div>
          <div class="bar"><span style="width:${(count / max) * 100}%"></span></div>
        </div>
      `;
    })
    .join("");
}

function renderRecordCard(order) {
  return `
    <article class="record-card">
      <div class="record-head">
        <div>
          <strong>${escapeHtml(order.student.name)}</strong>
          <div class="student-meta">
            <span>${escapeHtml(order.className)}</span>
            <span>${money(order.total)}</span>
            <span>${escapeHtml(formatDate(order.createdAt))}</span>
          </div>
        </div>
        <span class="status ${statusClass(paymentStatus(order))}">${paymentStatus(order)}</span>
      </div>
      <div class="item-meta">${order.items.map((item) => `${escapeHtml(item.name)} (${escapeHtml(item.size)}) x${item.qty}`).join(", ")}</div>
      ${order.payments.filter(p => p.receiptUrl).map(p => `<a href="${escapeAttr(p.receiptUrl)}" target="_blank" rel="noopener">Lihat resit ${escapeHtml(p.receiptName || '')}</a>`).join('')}
    </article>
  `;
}

function renderProductTable() {
  el('#product-table').innerHTML = state.products.map(product => `
    <tr data-product-row="${escapeAttr(product.id)}">
      <td>${escapeHtml(product.name)}<br><small>${escapeHtml(product.gender)} / Tahun ${product.years.join(', ')}</small></td>
      <td>${escapeHtml(product.category)}</td>
      <td>${product.sizes.map(size => `<label class="size-price-row">${escapeHtml(size)}<input data-price-size="${escapeAttr(size)}" type="number" min="0" step="0.01" value="${product.sizePrices[size]}" aria-label="Harga ${escapeAttr(product.name)} saiz ${escapeAttr(size)}" /></label>`).join('')}</td>
      <td>${product.sizes.map(size => `<label class="size-price-row">${escapeHtml(size)}<input data-cost-size="${escapeAttr(size)}" type="number" min="0" step="0.01" value="${product.sizeCosts?.[size] ?? product.cost ?? 0}" aria-label="Harga kos ${escapeAttr(product.name)} saiz ${escapeAttr(size)}" /></label>`).join('')}</td>
      <td>${escapeHtml(product.sizes.join(', '))}</td>
      <td><button class="ghost-button" data-save-price ${supportsSizeCosts() ? '' : 'disabled title="Kemas kini Apps Script kepada versi 6"'}>Simpan</button></td>
    </tr>`).join('');
  el('#product-table').querySelectorAll('[data-save-price]').forEach(button => button.addEventListener('click', async () => {
    const row = button.closest('[data-product-row]');
    const sizePrices = Object.fromEntries([...row.querySelectorAll('[data-price-size]')].map(input => [input.dataset.priceSize, Number(input.value)]));
    const sizeCosts = Object.fromEntries([...row.querySelectorAll('[data-cost-size]')].map(input => [input.dataset.costSize, Number(input.value)]));
    if ([...row.querySelectorAll('input')].some(input => !input.value.trim() || !input.checkValidity()) || [...Object.values(sizePrices),...Object.values(sizeCosts)].some(price => !Number.isFinite(price) || price < 0)) { alert('Harga tidak sah.'); return; }
    button.disabled = true;
    try {
      state.products = await uniformRequest('saveProduct', { id: row.dataset.productRow, sizePrices, sizeCosts }, state.adminToken);
      renderAll();
    } catch (error) { alert(error.message); }
    finally { button.disabled = false; }
  }));
}

function renderStudentOptions() {
  const student = state.students.find(student => student.id === el('#manual-student').value);
  if (student) selectManualStudent(student.id);
  else clearManualStudent(false);
  if (document.activeElement === el('#manual-student-search')) renderManualStudentSuggestions();
  renderManualProducts(); renderManualSummary();
}

function closeManualStudentSuggestions() {
  el('#manual-student-suggestions').hidden = true;
  el('#manual-student-search').setAttribute('aria-expanded','false');
  el('#manual-student-search').removeAttribute('aria-activedescendant');
  state.manualSuggestionIndex = -1;
}

function renderManualStudentSuggestions() {
  const query = el('#manual-student-search').value.trim().toLowerCase();
  if (!query || el('#manual-student').value) { closeManualStudentSuggestions(); return; }
  const words = query.split(/\s+/);
  state.manualSuggestions = state.students.filter(student => words.every(word => `${student.name} ${student.className}`.toLowerCase().includes(word))).slice(0,30);
  state.manualSuggestionIndex = -1;
  const list = el('#manual-student-suggestions');
  list.innerHTML = state.manualSuggestions.length ? state.manualSuggestions.map((student,index) => `<button type="button" role="option" tabindex="-1" aria-selected="false" id="manual-option-${index}" data-manual-student="${escapeAttr(student.id)}"><strong>${escapeHtml(student.name)}</strong><span>${escapeHtml(student.className)} / Tahun ${escapeHtml(student.year)}</span></button>`).join('') : '<p role="status" class="suggestion-empty">Tiada murid ditemui.</p>';
  list.hidden = false;
  el('#manual-student-search').setAttribute('aria-expanded','true');
  el('#manual-student-search').removeAttribute('aria-activedescendant');
  list.querySelectorAll('[data-manual-student]').forEach(button => {
    button.addEventListener('pointerdown', event => event.preventDefault());
    button.addEventListener('click', () => selectManualStudent(button.dataset.manualStudent));
  });
}

function selectManualStudent(id) {
  const student = state.students.find(student => student.id === id);
  if (!student) return;
  if (el('#manual-student').value !== id) { state.manualCart = {}; state.pendingManualOrder = null; }
  el('#manual-student').value = id;
  el('#manual-student-search').value = student.name;
  el('#manual-student-details').textContent = `${student.className} / Tahun ${student.year} / Tahap ${Number(student.year) <= 3 ? 1 : 2}`;
  el('#change-manual-student').hidden = false;
  closeManualStudentSuggestions(); renderManualProducts(); renderManualSummary();
}

function clearManualStudent(clearText) {
  el('#manual-student').value = '';
  if (clearText) el('#manual-student-search').value = '';
  el('#manual-student-details').textContent = '';
  el('#change-manual-student').hidden = true;
  state.manualCart = {}; state.pendingManualOrder = null;
  closeManualStudentSuggestions(); renderManualProducts(); renderManualSummary();
}

function handleManualStudentKey(event) {
  const list = el('#manual-student-suggestions');
  if (event.key === 'Escape') { closeManualStudentSuggestions(); return; }
  if (!['ArrowDown','ArrowUp','Enter'].includes(event.key) || el('#manual-student').value) return;
  if (list.hidden) renderManualStudentSuggestions();
  if (!state.manualSuggestions.length || list.hidden) return;
  event.preventDefault();
  if (event.key === 'Enter') {
    selectManualStudent(state.manualSuggestions[Math.max(0,state.manualSuggestionIndex)].id); return;
  }
  const count = state.manualSuggestions.length;
  state.manualSuggestionIndex = event.key === 'ArrowDown' ? (state.manualSuggestionIndex+1)%count : (state.manualSuggestionIndex <= 0 ? count-1 : state.manualSuggestionIndex-1);
  list.querySelectorAll('[role="option"]').forEach((option,index) => option.setAttribute('aria-selected',String(index === state.manualSuggestionIndex)));
  const active = el(`#manual-option-${state.manualSuggestionIndex}`);
  el('#manual-student-search').setAttribute('aria-activedescendant',active.id);
  active.scrollIntoView({ block:'nearest' });
}

async function saveManualOrder() {
  if (els('#manual-products input').some(input => !input.checkValidity())) { alert('Kuantiti mestilah nombor bulat antara 0 hingga 99.'); return; }
  const student = state.students.find((item) => item.id === el("#manual-student").value);
  const items = getCartItems(state.manualCart);
  if (!student || !items.length) {
    alert("Pilih murid dan masukkan sekurang-kurangnya satu item.");
    return;
  }
  const order = createOrder({
      source: "Borang manual",
      student,
      items,
      note: el("#manual-note").value.trim(),
    });
  order.gender = el('#manual-gender').value;
  const controls = els('#tab-manual input, #tab-manual select, #tab-manual button');
  controls.forEach(control => { control.disabled = true; });
  state.pendingManualOrder = state.pendingManualOrder || order;
  try {
    const saved = await uniformRequest('saveOrder', { order: state.pendingManualOrder }, state.adminToken);
    state.orders = [saved,...state.orders.filter(order => order.id !== saved.id)]; state.pendingManualOrder = null;
  }
  catch (error) { alert(error.message); return; }
  finally { controls.forEach(control => { control.disabled = false; }); }
  state.manualCart = {};
  el("#manual-note").value = "";
  renderAll();
  alert("Tempahan manual berjaya disimpan.");
}

function renderPaymentRecords() {
  const scope = state.orders.filter(order => Boolean(order.deletedAt) === el('#payment-archived').checked);
  const fillOptions = (selector, values, label) => {
    const select = el(selector), previous = select.value;
    select.innerHTML = `<option value="">${label}</option>` + values.map(value => `<option value="${escapeAttr(value)}">${escapeHtml(value)}</option>`).join('');
    if (values.includes(previous)) select.value = previous;
  };
  fillOptions('#payment-class', unique(scope.map(order => order.className)).sort(), 'Semua kelas');
  fillOptions('#payment-item', unique(scope.flatMap(order => order.items.map(item => item.name))).sort(), 'Semua item');
  const search = el('#payment-search').value.trim().toLowerCase();
  const orders = scope.filter(order => order.student.name.toLowerCase().includes(search)
    && (!el('#payment-class').value || order.className === el('#payment-class').value)
    && (!el('#payment-item').value || order.items.some(item => item.name === el('#payment-item').value))
    && (!el('#payment-status-filter').value || paymentStatus(order) === el('#payment-status-filter').value));
  const totals = calculateTotals(orders);
  el('#payment-summary').innerHTML = `<strong>${orders.length} tempahan${el('#payment-archived').checked ? ' dipadam' : ''}</strong><span>Jumlah: ${money(totals.orderValue)}</span><span>Diterima: ${money(totals.totalPaid)}</span><span>Baki: ${money(totals.balance)}</span>${totals.credit ? `<span class="credit-label">Lebihan / perlu diurus: ${money(totals.credit)}</span>` : ''}`;
  el('#payment-records').innerHTML = orders.length ? orders.map(order => `
    <tr>
      <td><strong>${escapeHtml(order.student.name)}</strong><small class="cell-detail">${escapeHtml(order.className)}<br>${escapeHtml(formatDate(order.createdAt))}</small></td>
      <td class="payment-items">${order.items.map(item => `<div>${escapeHtml(item.name)} <small>${escapeHtml(item.size)}${item.color ? ' / '+escapeHtml(item.color) : ''} &times; ${item.qty}</small></div>`).join('')}</td>
      <td class="number">${money(effectiveTotal(order))}${order.deletedAt ? `<small class="cell-detail">Asal: ${money(order.total)}</small>` : ''}</td><td class="number">${money(paidAmount(order))}</td><td class="number">${money(Math.max(0,effectiveTotal(order)-paidAmount(order)))}${creditAmount(order) ? `<small class="cell-detail credit-label">Lebihan: ${money(creditAmount(order))}</small>` : ''}</td>
      <td><span class="status ${statusClass(paymentStatus(order))}">${paymentStatus(order)}</span></td>
      <td><button class="ghost-button" data-edit-payment="${escapeAttr(order.id)}" aria-label="Kemaskini bayaran ${escapeAttr(order.student.name)}" ${supportsSizeCosts() ? '' : 'disabled title="Kemas kini Apps Script kepada versi 6"'}>Kemaskini</button></td>
    </tr>`).join('') : '<tr><td colspan="7" class="empty">Tiada rekod bayaran sepadan.</td></tr>';
  els('[data-edit-payment]').forEach(button => button.addEventListener('click', () => openPaymentEditor(button.dataset.editPayment)));
}

function openPaymentEditor(id) {
  const order = state.orders.find(order => order.id === id);
  state.editingPayment = structuredClone(order); state.pendingPaymentUpdate = null;
  state.orderDraft = order.items.map((item,index) => ({ index,size:item.size })); state.pendingOrderUpdate = null;
  el('#order-editor-form').reset(); el('#order-editor-error').hidden = true;
  el('#payment-editor-form').reset(); el('#payment-editor-error').hidden = true;
  el('#payment-editor-student').innerHTML = `<strong>${escapeHtml(order.student.name)}</strong><p>${escapeHtml(order.className)} &middot; Jumlah tempahan: ${money(effectiveTotal(order))}${order.deletedAt ? ' &middot; <span class="status unpaid">Tempahan dipadam</span>' : ''}</p>`;
  el('#edit-payment-status').value = paymentStatus(order);
  el('#edit-payment-received').value = paidAmount(order).toFixed(2);
  el('#edit-payment-received').max = Math.max(effectiveTotal(order),paidAmount(order));
  el('#edit-payment-received').readOnly = paymentStatus(order) !== 'Bayar sebahagian' && creditAmount(order) === 0;
  el('#edit-payment-status').querySelector('option:nth-child(2)').disabled = effectiveTotal(order) <= 0;
  el('#payment-history').innerHTML = paymentHistoryHtml(order);
  renderPaymentEditorBalance();
  renderOrderEditor(); switchPaymentEditorMode('payment');
  el('#payment-editor').showModal();
}

function supportsSizeCosts() {
  return state.products.length > 0 && state.products.every(product => product.sizeCosts && product.sizes.every(size => Number.isFinite(product.sizeCosts[size])));
}

function paymentHistoryHtml(order) {
  return order.payments.length ? `<div class="table-wrap"><table class="history-table"><thead><tr><th>Tarikh</th><th>Kaedah</th><th class="number">Amaun</th><th>Resit / catatan</th></tr></thead><tbody>${order.payments.map(payment => `<tr><td>${escapeHtml(formatDate(payment.date))}</td><td>${escapeHtml(payment.method)}${payment.type ? '<small class="cell-detail">'+escapeHtml(payment.type)+'</small>' : ''}</td><td class="number">${money(payment.amount)}</td><td>${payment.receiptUrl ? `<a href="${escapeAttr(payment.receiptUrl)}" target="_blank" rel="noopener">Lihat resit</a>` : ''}${payment.note ? `<span class="cell-detail">${escapeHtml(payment.note)}</span>` : ''}</td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">Belum ada bayaran diterima.</p>';
}

function renderPaymentEditorBalance() {
  const order = state.editingPayment;
  const received = Number(el('#edit-payment-received').value), total = effectiveTotal(order);
  el('#payment-editor-balance').textContent = `Diterima sekarang: ${money(paidAmount(order))} | Baki selepas kemaskini: ${money(Math.max(0,total-received))}${received > total ? ' | Lebihan / perlu diurus: '+money(received-total) : ''}`;
}

async function savePaymentStatus(event) {
  event.preventDefault();
  const order = state.editingPayment, received = Number(el('#edit-payment-received').value);
  const status = received === 0 ? 'Belum bayar' : received < effectiveTotal(order) ? 'Bayar sebahagian' : 'Selesai bayar';
  const errorBox = el('#payment-editor-error'); errorBox.hidden = true;
  if (!Number.isFinite(received) || received < 0 || received > Math.max(effectiveTotal(order),paidAmount(order)) || status !== el('#edit-payment-status').value) {
    errorBox.textContent = 'Jumlah diterima mesti sepadan dengan status bayaran.'; errorBox.hidden = false; return;
  }
  state.pendingPaymentUpdate ||= { orderId: order.id, updateId: crypto.randomUUID(), expectedPaid: paidAmount(order), expectedOrder:JSON.stringify(order), received, status,
    method: el('#edit-payment-method').value, note: el('#edit-payment-note').value.trim() };
  state.editorBusy = true;
  const controls = els('#payment-editor input, #payment-editor select, #payment-editor textarea, #payment-editor button');
  controls.forEach(control => { control.disabled = true; });
  try {
    const saved = await uniformRequest('setPaymentStatus', state.pendingPaymentUpdate, state.adminToken);
    state.orders = state.orders.map(order => order.id === saved.id ? saved : order);
    state.pendingPaymentUpdate = null; el('#payment-editor').close(); renderAll();
  } catch (error) { errorBox.textContent = error.message; errorBox.hidden = false; }
  finally { state.editorBusy = false; controls.forEach(control => { control.disabled = false; }); if (el('#payment-editor').open) renderOrderEditor(); }
}

function switchPaymentEditorMode(mode) {
  el('#payment-editor-form').hidden = mode !== 'payment';
  el('#order-editor-form').hidden = mode !== 'order';
  els('[data-editor-mode]').forEach(button => button.setAttribute('aria-selected',String(button.dataset.editorMode === mode)));
}

function draftOrderItems() {
  const order = state.editingPayment;
  return state.orderDraft.map(draft => {
    const original = order.items[draft.index], product = state.products.find(product => product.id === original.productId);
    return { ...original, size:draft.size, price:draft.size === original.size ? original.price : unitPrice(product,draft.size) };
  });
}

function renderOrderEditor() {
  const order = state.editingPayment, items = draftOrderItems();
  const disabled = !state.orderEditingReady || Boolean(order.deletedAt) || state.editorBusy;
  el('#order-editor-backend').hidden = state.orderEditingReady;
  el('#edit-order-items').innerHTML = state.orderDraft.map((draft,index) => {
    const item = items[index], product = state.products.find(product => product.id === item.productId);
    const sizes = unique([...(product?.sizes || []),order.items[draft.index].size]);
    return `<tr><td><strong>${escapeHtml(item.name)}</strong><small class="cell-detail">${escapeHtml(item.color || '-')}</small></td>
      <td><select data-edit-size="${draft.index}" aria-label="Saiz ${escapeAttr(item.name)} item ${index+1}" ${disabled ? 'disabled' : ''}>${sizes.map(size => `<option ${size === draft.size ? 'selected' : ''}>${escapeHtml(size)}</option>`).join('')}</select></td><td>${item.qty}</td><td class="number">${money(item.price)}</td><td class="number">${money(item.price*item.qty)}</td>
      <td><button type="button" class="icon-button" data-remove-order-item="${draft.index}" aria-label="Padam item ${escapeAttr(item.name)}" title="Padam item ${escapeAttr(item.name)}" ${disabled || items.length <= 1 ? 'disabled' : ''}>${icons.trash}</button></td></tr>`;
  }).join('');
  els('[data-edit-size]').forEach(select => select.addEventListener('change', () => {
    state.orderDraft.find(draft => draft.index === Number(select.dataset.editSize)).size = select.value;
    state.pendingOrderUpdate = null; renderOrderEditor();
  }));
  els('[data-remove-order-item]').forEach(button => button.addEventListener('click', () => {
    state.orderDraft = state.orderDraft.filter(draft => draft.index !== Number(button.dataset.removeOrderItem));
    state.pendingOrderUpdate = null; renderOrderEditor();
  }));
  const total = order.deletedAt ? 0 : itemsTotal(items), paid = paidAmount(order);
  el('#order-editor-summary').innerHTML = `<span>Jumlah baharu: <strong>${money(total)}</strong></span><span>Diterima: ${money(paid)}</span><span>Baki: ${money(Math.max(0,total-paid))}</span>${paid > total ? `<span class="credit-label">Lebihan / perlu diurus: ${money(paid-total)}</span>` : ''}`;
  el('#save-order-items').hidden = Boolean(order.deletedAt);
  el('#delete-order').hidden = Boolean(order.deletedAt);
  el('#restore-order').hidden = !order.deletedAt;
  ['#save-order-items','#delete-order','#restore-order'].forEach(selector => { el(selector).disabled = !state.orderEditingReady || state.editorBusy; });
  el('#order-edit-history').innerHTML = (order.orderUpdates || []).length ? order.orderUpdates.slice().reverse().map(update => `<div class="edit-history-row"><strong>${escapeHtml(update.action === 'deleteOrder' ? 'Tempahan dipadam' : update.action === 'restoreOrder' ? 'Tempahan dipulihkan' : 'Item dikemas kini')}</strong><small class="cell-detail">${escapeHtml(formatDate(update.date))}</small><p>${escapeHtml(update.note)}</p>${(update.changes || []).map(change => `<div>${escapeHtml(change.product)}: ${change.removed ? 'Item dipadam' : escapeHtml(change.fromSize)+' kepada '+escapeHtml(change.toSize)}</div>`).join('')}</div>`).join('') : '<p class="empty">Belum ada pembetulan.</p>';
}

async function saveOrderCorrection(action) {
  if (state.editorBusy || !state.orderEditingReady) return;
  const note = el('#edit-order-note').value.trim(), errorBox = el('#order-editor-error'); errorBox.hidden = true;
  if (!note) { errorBox.textContent = 'Masukkan sebab pembetulan atau pemadaman.'; errorBox.hidden = false; return; }
  const order = state.editingPayment;
  if (action === 'deleteOrder' && !confirm(`Padam tempahan ${order.student.name}? Tempahan boleh dipulihkan. Bayaran ${money(paidAmount(order))} dan resit asal akan dikekalkan.`)) return;
  if (!state.pendingOrderUpdate || state.pendingOrderUpdate.action !== action) state.pendingOrderUpdate = {
    action, payload:{orderId:order.id,updateId:crypto.randomUUID(),expectedOrder:JSON.stringify(order),note,items:structuredClone(state.orderDraft)}
  };
  state.editorBusy = true;
  const controls = els('#payment-editor input, #payment-editor select, #payment-editor textarea, #payment-editor button'); controls.forEach(control => { control.disabled = true; });
  try {
    const saved = await uniformRequest(state.pendingOrderUpdate.action,state.pendingOrderUpdate.payload,state.adminToken);
    state.orders = state.orders.map(order => order.id === saved.id ? saved : order);
    state.pendingOrderUpdate = null;
    if (action !== 'editOrderItems') { el('#payment-archived').checked = action === 'deleteOrder'; el('#payment-status-filter').value = ''; }
    el('#payment-editor').close(); renderAll();
  } catch (error) { errorBox.textContent = error.message; errorBox.hidden = false; }
  finally { state.editorBusy = false; controls.forEach(control => { control.disabled = false; }); if (el('#payment-editor').open) renderOrderEditor(); }
}

function renderParentConfirmation() {
  const order = state.confirmedOrder;
  el('#parent-confirmation .label').textContent = order.deletedAt ? 'Tempahan dipadam' : 'Tempahan berjaya disimpan';
  el('.parent-layout').hidden = true;
  el('#parent-confirmation').hidden = false;
  el('#page-title').textContent = 'Ringkasan tempahan';
  el('#confirmation-content').innerHTML = `
    <dl class="confirmation-meta"><div><dt>Nama murid</dt><dd>${escapeHtml(order.student.name)}</dd></div><div><dt>Tahun / kelas</dt><dd>Tahun ${escapeHtml(order.year)} / ${escapeHtml(order.className)}</dd></div><div><dt>Tarikh tempahan</dt><dd>${escapeHtml(formatDate(order.createdAt))}</dd></div><div><dt>No. tempahan</dt><dd>${escapeHtml(order.id)}</dd></div><div><dt>Nama pembayar</dt><dd>${escapeHtml(order.payerName)}</dd></div></dl>
    <h4>Senarai tempahan</h4><div class="table-wrap"><table class="confirmation-table"><thead><tr><th>Item</th><th>Warna / saiz</th><th class="number">Kuantiti</th><th class="number">Harga seunit</th><th class="number">Jumlah</th></tr></thead><tbody>${order.items.map(item => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.color || '-')} / ${escapeHtml(item.size)}</td><td class="number">${item.qty}</td><td class="number">${money(item.price)}</td><td class="number">${money(item.price*item.qty)}</td></tr>`).join('')}</tbody></table></div>
    ${order.deletedAt ? `<p class="form-error">Tempahan dipadam pada ${escapeHtml(formatDate(order.deletedAt))}: ${escapeHtml(order.deletedReason)}</p>` : ''}
    <div class="confirmation-totals"><div>Jumlah tempahan<strong>${money(effectiveTotal(order))}</strong></div><div>Bayaran diterima<strong>${money(paidAmount(order))}</strong></div><div>Baki bayaran<strong>${money(Math.max(0,effectiveTotal(order)-paidAmount(order)))}</strong></div><div>Status bayaran<span class="status ${statusClass(paymentStatus(order))}">${paymentStatus(order)}</span></div></div>${creditAmount(order) ? `<p class="credit-label">Lebihan / bayaran perlu diurus: ${money(creditAmount(order))}</p>` : ''}
    <h4>Rekod bayaran</h4>${paymentHistoryHtml(order)}
    ${order.note ? `<h4>Catatan</h4><p class="order-note">${escapeHtml(order.note)}</p>` : ''}`;
  el('#parent-confirmation').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function downloadReceipt() {
  const button = el('#download-receipt'); button.disabled = true;
  try {
    const bytes = await createUniformReceiptPdf(state.confirmedOrder);
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    const link = document.createElement('a'); link.href = url;
    link.download = `tempahan-uniform-${state.confirmedOrder.id}.pdf`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch { alert('PDF tidak dapat dijana. Sila cuba semula.'); }
  finally { button.disabled = false; }
}

function renderOrdersTable() {
  const tbody = el("#orders-table");
  const filtered = filteredOrders();
  tbody.innerHTML = filtered.length
    ? filtered
        .map((order) => {
          const paid = paidAmount(order);
          const balance = Math.max(0, effectiveTotal(order) - paid);
          return `
            <tr data-order-id="${escapeAttr(order.id)}">
              <td>
                <strong>${escapeHtml(order.student.name)}</strong><br />
                <span class="student-meta">${escapeHtml(order.source)}</span>
              </td>
              <td>Tahun ${escapeHtml(order.year || "-")}<br />${escapeHtml(order.className)}</td>
              <td>
                ${order.items
                  .map(
                    (item, index) => `
                    <label class="item-meta">
                      <input type="checkbox" data-delivery-item="${index}" ${item.delivered ? "checked" : ""} />
                      ${escapeHtml(item.name)} ${escapeHtml(item.color || '')} ${escapeHtml(item.size)} x${item.qty}
                    </label>
                  `
                  )
                  .join("")}
              </td>
              <td>${money(order.total)}</td>
              <td>${money(paid)}</td>
              <td>${money(balance)}${creditAmount(order) ? `<small class="cell-detail credit-label">Lebihan: ${money(creditAmount(order))}</small>` : ''}</td>
              <td><span class="status ${statusClass(paymentStatus(order))}">${paymentStatus(order)}</span></td>
              <td>${deliveryStatus(order)}</td>
            </tr>
          `;
        })
        .join("")
    : '<tr><td colspan="8"><div class="empty">Tiada tempahan sepadan dengan carian.</div></td></tr>';

  tbody.querySelectorAll("[data-delivery-item]").forEach((checkbox) => {
    checkbox.addEventListener("change", async () => {
      const row = checkbox.closest("[data-order-id]");
      const order = state.orders.find((item) => item.id === row.dataset.orderId);
      checkbox.disabled = true;
      try {
        const saved = await uniformRequest('setDelivery', { orderId: order.id, index: Number(checkbox.dataset.deliveryItem), delivered: checkbox.checked }, state.adminToken);
        state.orders = state.orders.map(item => item.id === saved.id ? saved : item);
      } catch (error) { checkbox.checked = !checkbox.checked; alert(error.message); return; }
      finally { checkbox.disabled = false; }
      renderAll();
    });
  });
}

function filteredOrders() {
  const query = el("#filter-search").value.trim().toLowerCase();
  const year = el("#filter-year").value;
  const className = el("#filter-class").value;
  const pay = el("#filter-payment").value;
  const delivery = el("#filter-delivery").value;
  return state.orders.filter((order) => {
    if (order.deletedAt) return false;
    const matchesQuery = !query || order.student.name.toLowerCase().includes(query);
    const matchesYear = !year || order.year === year;
    const matchesClass = !className || order.className === className;
    const matchesPay = !pay || paymentStatus(order) === pay;
    const matchesDelivery = !delivery || deliveryStatus(order) === delivery;
    return matchesQuery && matchesYear && matchesClass && matchesPay && matchesDelivery;
  });
}

function renderFilters() {
  const years = unique(state.students.map((student) => student.year).filter(Boolean)).sort();
  const classes = unique(state.students.map((student) => student.className).filter(Boolean)).sort();
  el("#filter-year").innerHTML =
    '<option value="">Semua tahun</option>' +
    years.map((year) => `<option>${escapeHtml(year)}</option>`).join("");
  el("#filter-class").innerHTML =
    '<option value="">Semua kelas</option>' +
    classes.map((className) => `<option>${escapeHtml(className)}</option>`).join("");
}

function renderReports() {
  const byClass = countBy(state.orders.filter(order => !order.deletedAt), (order) => order.className || "Tanpa kelas");
  el("#class-report").innerHTML = Object.keys(byClass).length
    ? Object.entries(byClass)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([className, count]) => `<div class="report-row"><strong>${escapeHtml(className)}</strong><span>${count} tempahan</span></div>`)
        .join("")
    : '<div class="empty">Belum ada data kelas.</div>';

  const totals = calculateTotals(state.orders);
  el("#finance-report").innerHTML = [
    ["Jumlah tempahan", money(totals.orderValue)],
    ["Jumlah diterima", money(totals.totalPaid)],
    ["Baki belum diterima", money(totals.balance)],
    ["Lebihan / bayaran perlu diurus", money(totals.credit)],
    ["Kos anggaran", money(totals.costValue)],
    ["Untung kasar", money(totals.profit)],
  ]
    .map(([label, value]) => `<div class="report-row"><strong>${label}</strong><span>${value}</span></div>`)
    .join("");

  const pending = state.orders.filter(
    (order) => !order.deletedAt && (paymentStatus(order) !== "Selesai bayar" || deliveryStatus(order) !== "Selesai diserahkan")
  );
  el("#pending-report").innerHTML = pending.length
    ? pending
        .slice(0, 12)
        .map(
          (order) => `
          <div class="report-row">
            <strong>${escapeHtml(order.student.name)}</strong>
            <span>${paymentStatus(order)} / ${deliveryStatus(order)}</span>
          </div>
        `
        )
        .join("")
    : '<div class="empty">Semua rekod selesai.</div>';
}

function calculateTotals(orders) {
  const active = orders.filter(order => !order.deletedAt);
  const uniqueStudents = unique(active.map((order) => order.student.id));
  const orderValue = active.reduce((sum, order) => sum + Math.round(order.total*100), 0)/100;
  const totalPaid = orders.reduce((sum, order) => sum + Math.round(paidAmount(order)*100), 0)/100;
  const cashPaid = orders.reduce(
    (sum, order) => sum + order.payments.filter((payment) => payment.method === "Tunai").reduce((a, b) => a + Math.round(b.amount*100), 0),
    0
  )/100;
  const qrPaid = totalPaid - cashPaid;
  const costValue = active.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + Math.round(item.cost*100) * item.qty, 0),
    0
  )/100;
  return {
    studentsOrdered: uniqueStudents.length,
    orderValue,
    totalPaid,
    cashPaid,
    qrPaid,
    balance: orders.reduce((sum,order) => sum+Math.max(0,Math.round(effectiveTotal(order)*100)-Math.round(paidAmount(order)*100)),0)/100,
    credit: orders.reduce((sum,order) => sum+Math.round(creditAmount(order)*100),0)/100,
    costValue,
    profit: orderValue - costValue,
    pendingDelivery: active.filter((order) => deliveryStatus(order) !== "Selesai diserahkan").length,
    paidOrders: active.filter((order) => paymentStatus(order) === "Selesai bayar").length,
  };
}

function exportOrders() {
  const header = [
    "Tarikh",
    "Nama murid",
    "Tahun",
    "Kelas",
    "Jumlah item",
    "Jumlah tempahan",
    "Bayaran diterima",
    "Baki",
    "Status bayaran",
    "Status serahan",
    "Catatan",
    "Status tempahan",
    "Jumlah asal",
    "Lebihan / perlu diurus",
  ];
  const rows = state.orders.map((order) => [
    formatDate(order.createdAt),
    order.student.name,
    order.year,
    order.className,
    order.deletedAt ? 0 : order.items.reduce((sum, item) => sum + item.qty, 0),
    effectiveTotal(order),
    paidAmount(order),
    Math.max(0, effectiveTotal(order) - paidAmount(order)),
    paymentStatus(order),
    deliveryStatus(order),
    order.note,
    order.deletedAt ? 'Dipadam' : 'Aktif',
    order.total,
    creditAmount(order),
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `rekod-tempahan-uniform-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function itemsTotal(items) {
  return items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.qty, 0) / 100;
}

function paidAmount(order) {
  return order.payments.reduce((sum, payment) => sum + Math.round(Number(payment.amount || 0) * 100), 0) / 100;
}

function paymentStatus(order) {
  const paid = paidAmount(order);
  if (paid <= 0) return "Belum bayar";
  if (paid < effectiveTotal(order)) return "Bayar sebahagian";
  return "Selesai bayar";
}

function deliveryStatus(order) {
  if (order.deletedAt) return 'Tempahan dipadam';
  return order.items.every((item) => item.delivered) ? "Selesai diserahkan" : "Belum selesai";
}

function effectiveTotal(order) { return order.deletedAt ? 0 : order.total; }
function creditAmount(order) { return Math.max(0,Math.round(paidAmount(order)*100)-Math.round(effectiveTotal(order)*100))/100; }

function statusClass(status) {
  if (status === "Selesai bayar") return "paid";
  if (status === "Bayar sebahagian") return "partial";
  return "unpaid";
}

function unique(values) {
  return [...new Set(values)];
}

function countBy(items, mapper) {
  return items.reduce((counts, item) => {
    const key = mapper(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ms-MY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: 'Asia/Kuala_Lumpur',
  }).format(new Date(value));
}

function money(value) {
  return currency.format(Number(value || 0));
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

boot();
