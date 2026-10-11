function uniformRequest(action, payload = {}, token = '') {
  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID();
    const frame = document.createElement('iframe');
    const form = document.createElement('form');
    frame.name = 'uniform_' + requestId;
    frame.hidden = form.hidden = true;
    form.method = 'POST';
    form.action = 'https://script.google.com/macros/s/AKfycbwI3PZTN9u0iHCHNOMrV63Pq4XBflU5dAlR68XogmsG3JWiBRn9AgveaDqV22mNqxvlwg/exec';
    form.target = frame.name;
    const input = document.createElement('input');
    input.name = 'payload';
    input.value = JSON.stringify({ action, payload, token, requestId, origin: location.origin });
    form.append(input);
    const cleanup = () => {
      clearTimeout(timer); window.removeEventListener('message', receive); frame.remove(); form.remove();
    };
    const receive = event => {
      const trusted = event.origin === 'https://script.google.com' || /^https:\/\/[a-z0-9-]+\.googleusercontent\.com$/.test(event.origin);
      if (!trusted || event.data?.channel !== 'uniform-api-v1' || event.data.requestId !== requestId) return;
      cleanup();
      if (event.data.ok) resolve(event.data.result);
      else {
        const error = event.data.error || 'Permintaan gagal.';
        reject(new Error(/getUniformProducts is not defined/.test(error) ? 'Simpanan tempahan belum tersedia. Sila hubungi pihak sekolah.' : error));
      }
    };
    const timer = setTimeout(() => {
      cleanup(); reject(new Error('Tiada pengesahan diterima daripada Apps Script. Semak deployment. Cuba hantar semula borang yang sama untuk menyemak tempahan tanpa pendua.'));
    }, 45000);
    window.addEventListener('message', receive);
    document.body.append(frame, form);
    form.submit();
  });
}
