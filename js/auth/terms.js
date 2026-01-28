/* Terms modal and signature capture */
(function(global){
  const modal = () => document.getElementById('terms-modal');
  const el = id => document.getElementById(id);
  const apiBase = '/api/auth';

  let isDrawing = false;
  let lastX = 0, lastY = 0;

  function initCanvas() {
    const canvas = el('tc-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    function draw(x,y){
      ctx.lineTo(x,y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x,y);
    }

    canvas.addEventListener('pointerdown', (e)=>{
      isDrawing = true;
      const r = canvas.getBoundingClientRect();
      lastX = e.clientX - r.left; lastY = e.clientY - r.top;
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
    });
    canvas.addEventListener('pointermove', (e)=>{
      if(!isDrawing) return;
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left; const y = e.clientY - r.top;
      draw(x,y);
    });
    canvas.addEventListener('pointerup', ()=>{ isDrawing = false; ctx.beginPath(); });
    canvas.addEventListener('pointercancel', ()=>{ isDrawing = false; ctx.beginPath(); });

    el('tc-clear').addEventListener('click', ()=>{ ctx.clearRect(0,0,canvas.width,canvas.height); });
  }

  async function acceptTerms() {
    const userId = el('tc-user-id').value;
    const token = el('tc-token').value;
    const name = el('tc-name').value.trim();
    if(!name) return alert('Please enter your full name');
    const canvas = el('tc-canvas');
    const dataUrl = canvas.toDataURL('image/png');
    try{
      const r = await fetch(`${apiBase}/accept-terms`, {
        method: 'POST', headers: { 'Content-Type':'application/json', ...(token?{ 'Authorization': 'Bearer '+token }: {}) },
        body: JSON.stringify({ userId, name, signatureDataUrl: dataUrl })
      });
      const j = await r.json();
      if(r.ok){
        // close modal and store token
        hide();
        if(token) localStorage.setItem('kssfk_token', token);
        alert('Terms accepted. You may continue.');
      } else {
        alert('Failed to accept terms: '+(j.error||r.statusText));
      }
    }catch(e){ console.error(e); alert('Network error'); }
  }

  function show(userId, token){
    const m = modal(); if(!m) return;
    el('tc-user-id').value = userId || '';
    el('tc-token').value = token || '';
    el('tc-name').value = '';
    const canvas = el('tc-canvas');
    if(canvas){ const ctx = canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height); }
    m.style.display = 'flex';
  }

  function hide(){ const m = modal(); if(m) m.style.display = 'none'; }

  function init(){
    const m = modal(); if(!m) return;
    initCanvas();
    el('tc-save').addEventListener('click', acceptTerms);
    el('tc-cancel').addEventListener('click', hide);
  }

  global.TermsModal = { init, show, hide };
  // auto-init on DOM ready
  document.addEventListener('DOMContentLoaded', ()=>{ try{ TermsModal.init(); }catch(e){} });
})(window || this);
