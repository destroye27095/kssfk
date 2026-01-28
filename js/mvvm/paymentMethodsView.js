/* PaymentMethodsView
   Renders payment provider logo tiles into a container and handles clicks.
   Usage:
     const svc = new PaymentProvidersService();
     const view = new PaymentMethodsView('#payment-methods-block', svc, {
       onInitiateResponse: (r) => console.log(r),
       onError: (e) => console.error(e)
     });
     view.render();
*/
(function(global){
  class PaymentMethodsView {
    constructor(containerSelector, providerService, options = {}){
      this.container = document.querySelector(containerSelector);
      if(!this.container) throw new Error('PaymentMethodsView: container not found');
      this.service = providerService;
      this.onInitiateResponse = options.onInitiateResponse || function(){ };
      this.onError = options.onError || function(){ };
      this.classPrefix = options.classPrefix || 'pmv';
    }

    buildTile(provider){
      const div = document.createElement('button');
      div.setAttribute('type','button');
      div.className = `${this.classPrefix}-tile`;
      div.dataset.key = provider.key;

      const img = document.createElement('img');
      img.className = `${this.classPrefix}-logo`;
      img.alt = provider.name;
      img.src = this.service.getLogoPath(provider.key);

      const label = document.createElement('div');
      label.className = `${this.classPrefix}-label`;
      label.textContent = provider.name;

      div.appendChild(img);
      div.appendChild(label);

      div.addEventListener('click', async (e) => {
        div.disabled = true;
        try{
          // default payload: example, in real use pass real amount and metadata
          const payload = { amount: 0, currency: 'KES', metadata: {} };
          const resp = await this.service.initiate(provider.key, payload);
          this.onInitiateResponse(resp, provider);
        }catch(err){
          this.onError(err, provider);
        }finally{
          div.disabled = false;
        }
      });

      return div;
    }

    render(){
      const providers = this.service.getAvailableProviders();
      this.container.innerHTML = '';
      const wrapper = document.createElement('div');
      wrapper.className = `${this.classPrefix}-wrap`;
      providers.forEach(p => wrapper.appendChild(this.buildTile(p)));
      this.container.appendChild(wrapper);
      this._attachStyles();
    }

    _attachStyles(){
      if(document.getElementById('payment-methods-styles')) return;
      const css = `
        .pmv-wrap{display:flex;gap:12px;flex-wrap:wrap}
        .pmv-tile{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px;border:1px solid #eee;border-radius:8px;background:#fff;cursor:pointer;min-width:110px}
        .pmv-tile:disabled{opacity:.6;cursor:progress}
        .pmv-logo{width:64px;height:40px;object-fit:contain;margin-bottom:6px}
        .pmv-label{font-size:12px;color:#333}
      `;
      const style = document.createElement('style');
      style.id = 'payment-methods-styles';
      style.appendChild(document.createTextNode(css));
      document.head.appendChild(style);
    }
  }

  global.PaymentMethodsView = PaymentMethodsView;
})(window || this);
