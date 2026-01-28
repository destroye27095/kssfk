/* PaymentMethodsView (docs copy) */
(function(global){
  class PaymentMethodsView {
    constructor(containerSelector, providerService, options = {}){
      this.container = document.querySelector(containerSelector);
      if(!this.container) throw new Error('PaymentMethodsView: container not found');
      this.service = providerService;
      this.onInitiateResponse = options.onInitiateResponse || function(){};
      this.onError = options.onError || function(){};
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
          const payload = { amount: 1, currency: 'KES', metadata: {} };
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
      const css = '.pmv-wrap{display:flex;gap:12px;flex-wrap:wrap}.pmv-tile{display:flex;flex-direction:column;align-items:center;padding:8px;border:1px solid #eee;border-radius:8px;background:#fff;cursor:pointer;min-width:120px}.pmv-logo{width:80px;height:44px;object-fit:contain;margin-bottom:6px}.pmv-label{font-size:13px;color:#333}';
      const s = document.createElement('style'); s.id = 'pmv-styles'; s.appendChild(document.createTextNode(css)); document.head.appendChild(s);
    }
  }

  global.PaymentMethodsView = PaymentMethodsView;
})(window || this);
