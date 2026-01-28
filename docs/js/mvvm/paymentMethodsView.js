/* PaymentMethodsView (docs copy) */
(function(global){
  class PaymentMethodsView {
    constructor(containerSelector, providerService, options = {}){
      this.container = document.querySelector(containerSelector);
      if(!this.container) throw new Error('PaymentMethodsView: container not found');
      this.service = providerService;
      this.onInitiateResponse = options.onInitiateResponse || function(){};
      this.onError = options.onError || function(){};
      this.getPayload = options.getPayload || (provider => ({ amount: 0, currency: 'KES', metadata: {} }));
    }

    buildTile(provider){
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'pmv-tile'; btn.dataset.key = provider.key;

      const img = document.createElement('img'); img.className = 'pmv-logo'; img.alt = provider.name; img.src = this.service.getLogoPath(provider.key);
      const label = document.createElement('div'); label.className = 'pmv-label'; label.textContent = provider.name;
      btn.appendChild(img); btn.appendChild(label);

      btn.addEventListener('click', async ()=>{
        btn.disabled = true;
        try{
          const payload = this.getPayload(provider) || { amount: 1, currency: 'KES', metadata: {} };
          const resp = await this.service.initiate(provider.key, payload);
          this.onInitiateResponse(resp, provider);
        }catch(err){ this.onError(err, provider); }
        finally{ btn.disabled = false; }
      });

      return btn;
    }

    render(){
      const providers = this.service.getAvailableProviders();
      this.container.innerHTML = '';
      const wrap = document.createElement('div'); wrap.className = 'pmv-wrap';
      providers.forEach(p => wrap.appendChild(this.buildTile(p)));
      this.container.appendChild(wrap);
      this._attachStyles();
    }

    _attachStyles(){
      if(document.getElementById('pmv-styles')) return;
      const css = '.pmv-wrap{display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start}.pmv-tile{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px;border-radius:12px;background:#fff;cursor:pointer;min-width:140px;box-shadow:0 6px 18px rgba(15,23,42,0.06);transition:transform .18s ease,box-shadow .18s ease}.pmv-tile:hover{transform:translateY(-6px) scale(1.02);box-shadow:0 12px 30px rgba(15,23,42,0.12)}.pmv-tile:active{transform:translateY(-2px)}.pmv-tile:disabled{opacity:.6;cursor:progress}.pmv-logo{width:88px;height:48px;object-fit:contain;margin-bottom:8px;border-radius:6px}.pmv-label{font-size:13px;color:#222;font-weight:600}.pmv-sub{font-size:12px;color:#666;margin-top:6px}.pmv-controls{display:flex;gap:8px;align-items:center;margin-bottom:12px}.pmv-amount{width:160px;padding:8px 10px;border-radius:8px;border:1px solid #e6e9ee}';
      const s = document.createElement('style'); s.id = 'pmv-styles'; s.appendChild(document.createTextNode(css)); document.head.appendChild(s);
    }
  }

  global.PaymentMethodsView = PaymentMethodsView;
})(window || this);
