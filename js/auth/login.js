/* Login UI helper for phone OTP and Google */
(function(global){
  const apiBase = '/api/auth';
  const el = id => document.getElementById(id);

  const LoginUI = {
    init(){
      const sendBtn = el('send-otp-btn');
      const verifyBtn = el('verify-otp-btn');
      const googleBtn = el('google-login-btn');
      if(sendBtn) sendBtn.addEventListener('click', () => this.sendOtp());
      if(verifyBtn) verifyBtn.addEventListener('click', () => this.verifyOtp());
      if(googleBtn) googleBtn.addEventListener('click', () => this.googleAuth());
    },

    async sendOtp(){
      const phone = el('login-phone').value.trim();
      if(!phone){ this.show('Enter phone'); return; }
      try{
        const r = await fetch(`${apiBase}/send-otp`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ phone })});
        const j = await r.json();
        if(r.ok) this.show('OTP sent. Check your phone for the code.');
        else this.show('Error: '+(j.error||r.statusText));
      }catch(e){ this.show('Network error'); console.error(e); }
    },

    async verifyOtp(){
      const phone = el('login-phone').value.trim();
      const code = el('otp-input').value.trim();
      if(!phone || !code){ this.show('Phone and code required'); return; }
      try{
        const r = await fetch(`${apiBase}/verify-otp`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ phone, code })});
        const j = await r.json();
        if(r.ok){
          // if server indicates that the user needs to accept terms, open modal
          if(j.status === 'needs_terms' || j.needsAcceptance){
            this.show('Please accept Terms & Conditions');
            // show the terms modal (signature capture). pass user id and token
            if(window.TermsModal && typeof window.TermsModal.show === 'function'){
              TermsModal.show((j.user && j.user.id) || '', j.token || '');
            } else {
              this.show('Terms modal not available');
            }
            return;
          }

          this.show('Verified. Token: '+(j.token||''));
          // store token locally
          localStorage.setItem('kssfk_token', j.token);
        } else this.show('Error: '+(j.error||r.statusText));
      }catch(e){ this.show('Network error'); console.error(e); }
    },

    async googleAuth(){
      try{
        const r = await fetch(`${apiBase}/google`);
        const j = await r.json();
        if(j.url){ window.location.href = j.url; }
        else this.show('Configure GOOGLE_CLIENT_ID on server');
      }catch(e){ this.show('Network error'); console.error(e); }
    },

    show(msg){ const elMsg = el('login-msg'); if(elMsg) elMsg.textContent = msg; }
  };

  global.LoginUI = LoginUI;
})(window || this);
