/* PaymentProvidersService
   Provides a registry of payment providers and a simple initiate() wrapper
   that posts to backend endpoints: POST /api/payments/initiate/{providerKey}
   Provider keys: mpesa, bank, paypal, airtel, telkom, vodacom, generic
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

    // payload should include amount, currency, metadata like orderId, returnUrl
    async initiate(providerKey, payload = {}){
      const key = String(providerKey || 'generic').toLowerCase();
      const url = `${this.baseUrl}/initiate/${encodeURIComponent(key)}`;
      try{
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if(!resp.ok){
          const text = await resp.text();
          throw new Error(`${resp.status} ${resp.statusText} - ${text}`);
        }
        return await resp.json();
      }catch(err){
        console.error('PaymentProvidersService.initiate error', err);
        throw err;
      }
    }
  }

  global.PaymentProvidersService = PaymentProvidersService;
})(window || this);
