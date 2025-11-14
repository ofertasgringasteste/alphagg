// Sistema de eventos UTMify independente
class UTMifyEvents {
    constructor() {
        this.apiToken = 'qQMDVJ99ZiXuRlqgSHVyCGMG9hMarzZ0hDVb'; // API Token correto
        this.apiUrl = 'https://api.utmify.com.br/api-credentials/orders';
        this.enabled = true;
        
        console.log('[UTMify Events] Sistema inicializado');
    }

    // Capturar parâmetros UTM usando a função getParams() da UTMify
    getUtmParams() {
        try {
            // Tentar usar getParams() se estiver disponível
            if (typeof getParams === 'function') {
                return getParams();
            }
            
            // Fallback para localStorage
            const utmData = localStorage.getItem('utmify_data');
            if (utmData) {
                return JSON.parse(utmData);
            }
            
            // Fallback para URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            return {
                utm_source: urlParams.get('utm_source'),
                utm_medium: urlParams.get('utm_medium'),
                utm_campaign: urlParams.get('utm_campaign'),
                utm_content: urlParams.get('utm_content'),
                utm_term: urlParams.get('utm_term'),
                src: urlParams.get('src'),
                sck: urlParams.get('sck'),
                xcod: urlParams.get('xcod'),
                fbclid: urlParams.get('fbclid'),
                gclid: urlParams.get('gclid'),
                ttclid: urlParams.get('ttclid')
            };
        } catch (error) {
            console.error('[UTMify Events] Erro ao capturar UTM params:', error);
            return {};
        }
    }

    // Obter IP do cliente
    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.warn('[UTMify Events] Erro ao obter IP:', error);
            return '127.0.0.1'; // IP padrão caso falhe
        }
    }

    // Gerar UUID para produtos
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Enviar evento PIX Gerado
    async enviarPixGerado(dadosTransacao) {
        if (!this.enabled) return;
        
        try {
            console.log('[UTMify Events] Enviando PIX Gerado...', dadosTransacao);
            
            const utmParams = this.getUtmParams();
            const clientIP = await this.getClientIP();
            const amountCents = Math.round((dadosTransacao.amount || 19.99) * 100);
            
            // Cálculo de comissão conforme exemplo
            const gatewayFeeInCents = Math.round(amountCents * 0.04); // 4% taxa
            const userCommissionInCents = amountCents - gatewayFeeInCents;
            const totalPriceInCents = amountCents + gatewayFeeInCents;
            
            const payload = {
                orderId: String(dadosTransacao.token || dadosTransacao.transactionId || 'TRX-' + Date.now()),
                platform: 'GlobalPay', // Conforme exemplo
                paymentMethod: 'pix',
                status: 'waiting_payment',
                createdAt: this.formatDate(new Date()),
                approvedDate: null,
                refundedAt: null,
                customer: {
                    name: dadosTransacao.customer?.name || 'Cliente',
                    email: dadosTransacao.customer?.email || 'cliente@exemplo.com',
                    phone: dadosTransacao.customer?.phone ? String(dadosTransacao.customer.phone).replace(/[^0-9]/g, '') : null,
                    document: dadosTransacao.customer?.document ? String(dadosTransacao.customer.document).replace(/[^0-9]/g, '') : null,
                    country: 'BR',
                    ip: clientIP // Campo obrigatório conforme exemplo
                },
                products: [
                    {
                        id: this.generateUUID(), // UUID único conforme exemplo
                        name: dadosTransacao.productName || 'Produto Alpha Burguer',
                        planId: null,
                        planName: null,
                        quantity: 1,
                        priceInCents: amountCents
                    }
                ],
                trackingParameters: {
                    src: utmParams.src || null,
                    sck: utmParams.sck || null,
                    utm_source: utmParams.utm_source || null,
                    utm_campaign: utmParams.utm_campaign || null,
                    utm_medium: utmParams.utm_medium || null,
                    utm_content: utmParams.utm_content || null,
                    utm_term: utmParams.utm_term || null
                },
                commission: {
                    totalPriceInCents: totalPriceInCents,
                    gatewayFeeInCents: gatewayFeeInCents,
                    userCommissionInCents: userCommissionInCents
                },
                isTest: false
            };

            console.log('[UTMify Events] Payload PIX Gerado:', JSON.stringify(payload, null, 2));
            
            const response = await this.enviarParaUTMify(payload);
            console.log('[UTMify Events] PIX Gerado enviado com sucesso:', response);
            
        } catch (error) {
            console.error('[UTMify Events] Erro ao enviar PIX Gerado:', error);
        }
    }

    // Enviar evento PIX Pago
    async enviarPixPago(dadosTransacao) {
        if (!this.enabled) return;
        
        try {
            console.log('[UTMify Events] Enviando PIX Pago...', dadosTransacao);
            
            const utmParams = this.getUtmParams();
            const clientIP = await this.getClientIP();
            const amountCents = Math.round((dadosTransacao.amount || 19.99) * 100);
            
            // Cálculo de comissão conforme exemplo
            const gatewayFeeInCents = Math.round(amountCents * 0.04); // 4% taxa
            const userCommissionInCents = amountCents - gatewayFeeInCents;
            const totalPriceInCents = amountCents + gatewayFeeInCents;
            
            const payload = {
                orderId: String(dadosTransacao.token || dadosTransacao.transactionId || 'TRX-' + Date.now()),
                platform: 'GlobalPay', // Conforme exemplo
                paymentMethod: 'pix',
                status: 'paid',
                createdAt: this.formatDate(dadosTransacao.createdAt || new Date()),
                approvedDate: this.formatDate(new Date()),
                refundedAt: null,
                customer: {
                    name: dadosTransacao.customer?.name || 'Cliente',
                    email: dadosTransacao.customer?.email || 'cliente@exemplo.com',
                    phone: dadosTransacao.customer?.phone ? String(dadosTransacao.customer.phone).replace(/[^0-9]/g, '') : null,
                    document: dadosTransacao.customer?.document ? String(dadosTransacao.customer.document).replace(/[^0-9]/g, '') : null,
                    country: 'BR',
                    ip: clientIP // Campo obrigatório conforme exemplo
                },
                products: [
                    {
                        id: this.generateUUID(), // UUID único conforme exemplo
                        name: dadosTransacao.productName || 'Produto Alpha Burguer',
                        planId: null,
                        planName: null,
                        quantity: 1,
                        priceInCents: amountCents
                    }
                ],
                trackingParameters: {
                    src: utmParams.src || null,
                    sck: utmParams.sck || null,
                    utm_source: utmParams.utm_source || null,
                    utm_campaign: utmParams.utm_campaign || null,
                    utm_medium: utmParams.utm_medium || null,
                    utm_content: utmParams.utm_content || null,
                    utm_term: utmParams.utm_term || null
                },
                commission: {
                    totalPriceInCents: totalPriceInCents,
                    gatewayFeeInCents: gatewayFeeInCents,
                    userCommissionInCents: userCommissionInCents
                },
                isTest: false
            };

            console.log('[UTMify Events] Payload PIX Pago:', JSON.stringify(payload, null, 2));
            
            const response = await this.enviarParaUTMify(payload);
            console.log('[UTMify Events] PIX Pago enviado com sucesso:', response);
            
        } catch (error) {
            console.error('[UTMify Events] Erro ao enviar PIX Pago:', error);
        }
    }

    // Enviar dados para API UTMify
    async enviarParaUTMify(payload) {
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-token': this.apiToken
            },
            body: JSON.stringify(payload)
        });

        // Capturar resposta detalhada de erro
        const responseText = await response.text();
        let responseData;
        
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            responseData = { message: responseText };
        }

        if (!response.ok) {
            console.error('[UTMify Events] Erro detalhado da API:', {
                status: response.status,
                statusText: response.statusText,
                response: responseData
            });
            throw new Error(`Erro HTTP ${response.status}: ${JSON.stringify(responseData)}`);
        }

        return responseData;
    }

    // Formatar data para o formato esperado pela UTMify (YYYY-MM-DD HH:MM:SS UTC)
    formatDate(date) {
        if (!date) return null;
        
        let dateObj;
        if (typeof date === 'string') {
            dateObj = new Date(date);
        } else {
            dateObj = new Date(date);
        }
        
        // Formato: YYYY-MM-DD HH:MM:SS (UTC)
        const year = dateObj.getUTCFullYear();
        const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getUTCDate()).padStart(2, '0');
        const hours = String(dateObj.getUTCHours()).padStart(2, '0');
        const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
        const seconds = String(dateObj.getUTCSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    // Desabilitar temporariamente
    disable() {
        this.enabled = false;
        console.log('[UTMify Events] Sistema desabilitado');
    }

    // Habilitar novamente
    enable() {
        this.enabled = true;
        console.log('[UTMify Events] Sistema habilitado');
    }
}

// Instância global
window.utmifyEvents = new UTMifyEvents();

// Hook para interceptar sucessos de PIX
(function() {
    // Interceptar quando PIX é gerado com sucesso
    const originalExibirPixGerado = window.exibirPixGeradoPage;
    if (originalExibirPixGerado) {
        window.exibirPixGeradoPage = function(dadosPix) {
            // Chamar função original
            originalExibirPixGerado.call(this, dadosPix);
            
            // Enviar evento para UTMify
            if (window.utmifyEvents && dadosPix.success !== false) {
                // Tentar extrair dados do carrinho se disponível
                let customerData = {
                    name: 'Cliente',
                    email: 'cliente@exemplo.com',
                    document: '00000000000'
                };
                
                // Se dados do carrinho estiverem disponíveis globalmente
                if (window.dadosCheckout && window.dadosCheckout.cliente) {
                    const cliente = window.dadosCheckout.cliente;
                    customerData = {
                        name: cliente.nome || 'Cliente',
                        email: cliente.email || 'cliente@exemplo.com',
                        phone: cliente.telefone || null,
                        document: cliente.cpf || null
                    };
                }
                
                window.utmifyEvents.enviarPixGerado({
                    token: dadosPix.token,                              // String como orderId
                    transactionId: dadosPix.transactionId || dadosPix.monetrixId,
                    amount: dadosPix.amount,
                    customer: customerData
                });
            }
        };
    }

    // Interceptar quando pagamento é confirmado
    const originalExibirPagamentoConfirmado = window.exibirPagamentoConfirmadoPage;
    if (originalExibirPagamentoConfirmado) {
        window.exibirPagamentoConfirmadoPage = function(dadosPagamento) {
            // Chamar função original
            originalExibirPagamentoConfirmado.call(this, dadosPagamento);
            
            // Enviar evento para UTMify
            if (window.utmifyEvents) {
                // Tentar extrair dados do carrinho se disponível
                let customerData = {
                    name: 'Cliente',
                    email: 'cliente@exemplo.com',
                    document: '00000000000'
                };
                
                // Se dados do carrinho estiverem disponíveis globalmente
                if (window.dadosCheckout && window.dadosCheckout.cliente) {
                    const cliente = window.dadosCheckout.cliente;
                    customerData = {
                        name: cliente.nome || 'Cliente',
                        email: cliente.email || 'cliente@exemplo.com',
                        phone: cliente.telefone || null,
                        document: cliente.cpf || null
                    };
                }
                
                window.utmifyEvents.enviarPixPago({
                    token: dadosPagamento.token,                        // String como orderId
                    transactionId: dadosPagamento.transactionId,
                    amount: dadosPagamento.amount,
                    customer: customerData
                });
            }
        };
    }
})();

console.log('[UTMify Events] Sistema carregado e hooks instalados'); 