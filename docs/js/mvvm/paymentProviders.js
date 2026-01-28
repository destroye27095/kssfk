/* PaymentProvidersService (docs copy)
   Lightweight copy for docs demo
*/
(function(global){
  class PaymentProvidersService {
    constructor(options = {}){
      this.baseUrl = options.baseUrl || '/api/payments';
      this.providers = [
        { key: 'mpesa', name: 'M-Pesa' },
        { key: 'bank', name: 'Bank Transfer' },
        { key: 'paypal', name: 'PayPal' },
        { key: 'airtel', name: 'Airtel Money' },
        { key: 'telkom', name: 'Telkom' },
        { key: 'vodacom', name: 'Vodacom' },
        { key: 'generic', name: 'Other' }
      ];
    }

    getAvailableProviders(){
      return this.providers.slice();
    }

    getLogoPath(providerKey){
      const sanitized = String(providerKey || 'generic').toLowerCase();
      return `assets/images/payments/${sanitized}.svg`;
    }

    async initiate(providerKey, payload = {}){
      const key = String(providerKey || 'generic').toLowerCase();
      const url = `${this.baseUrl}/initiate/${encodeURIComponent(key)}`;
      const resp = await fetch(url, {
        method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
      });
      if(!resp.ok) throw new Error('Network response was not ok');
      return resp.json();
    }
  }

  global.PaymentProvidersService = PaymentProvidersService;
})(window || this);
