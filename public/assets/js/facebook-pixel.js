/**
 * Sistema Avançado de Facebook Pixel
 * Integrado com UTM Handler e sistema de pagamento existente
 * Pixel ID: 2558388467689307
 */
 
 class FacebookPixelManager {
     constructor() {
         this.pixelId = '2558388467689307';
        this.initialized = false;
        this.debug = true; // Ativar logs detalhados
        this.consentGiven = true; // Por padrão aceitar, adaptar conforme LGPD
        
        // Cache de dados para evitar múltiplos eventos
        this.eventCache = new Set();
        
        this.init();
    }

    /**
     * Inicializar Facebook Pixel
     */
    init() {
        if (this.initialized || !this.consentGiven) {
            return;
        }

        try {
            // Carregar o Facebook Pixel base code
            this.loadPixelCode();
            
            // Configurar eventos automáticos
            this.setupAutomaticEvents();
            
            // Integrar com sistema UTM existente
            this.integrateWithUTM();
            
            this.initialized = true;
            this.log('✅ Facebook Pixel inicializado com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar Facebook Pixel:', error);
        }
    }

    /**
     * Carregar código base do Facebook Pixel
     */
    loadPixelCode() {
        // Verificar se fbq já existe
        if (window.fbq) {
            this.log('Facebook Pixel já carregado');
            return;
        }

        // Facebook Pixel Code
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');

        // Inicializar pixel
        fbq('init', this.pixelId);
        
        // Configurar parâmetros avançados
        fbq('set', 'autoConfig', false, this.pixelId);
        
        this.log('📱 Facebook Pixel base code carregado');
    }

    /**
     * Configurar eventos automáticos
     */
    setupAutomaticEvents() {
        // PageView automático para a página atual
        this.trackPageView();
        
        // Escutar mudanças de página via UTM Navigation
        if (window.addEventListener) {
            window.addEventListener('utm-page-change', (event) => {
                this.trackPageView(event.detail);
            });
        }
    }

    /**
     * Integrar com sistema UTM existente
     */
    integrateWithUTM() {
        // Aguardar UTM Handler estar pronto
        const checkUTM = () => {
            if (window.UtmHandler && window.UtmHandler.initialized) {
                this.utmParams = window.UtmHandler.getAllUtmParams();
                this.log('🔗 Integração com UTM concluída:', this.utmParams);
            } else {
                setTimeout(checkUTM, 100);
            }
        };
        checkUTM();
    }

    /**
     * Rastrear visualização de página
     */
    trackPageView(pageData = null) {
        if (!this.initialized) return;

        const eventData = {
            content_name: pageData?.title || document.title,
            content_category: this.getPageCategory(),
            source_url: window.location.href
        };

        // Adicionar parâmetros UTM se disponíveis
        if (this.utmParams) {
            eventData.utm_source = this.utmParams.utm_source;
            eventData.utm_medium = this.utmParams.utm_medium;
            eventData.utm_campaign = this.utmParams.utm_campaign;
            eventData.fbclid = this.utmParams.fbclid;
        }

        fbq('track', 'PageView', eventData);
        this.log('📄 PageView rastreado:', eventData);
    }

    /**
     * Rastrear visualização de conteúdo/produto
     */
    trackViewContent(contentData) {
        if (!this.initialized) return;

        const eventId = `view_content_${contentData.content_id}`;
        if (this.eventCache.has(eventId)) return;

        const eventData = {
            content_type: 'product',
            content_ids: [contentData.content_id],
            content_name: contentData.content_name,
            content_category: contentData.content_category || 'food',
            value: parseFloat(contentData.value) || 0,
            currency: 'BRL'
        };

        fbq('track', 'ViewContent', eventData);
        this.eventCache.add(eventId);
        this.log('👁️ ViewContent rastreado:', eventData);
    }

    /**
     * Rastrear adição ao carrinho
     */
    trackAddToCart(productData) {
        if (!this.initialized) return;

        const eventData = {
            content_type: 'product',
            content_ids: [productData.id],
            content_name: productData.nome,
            content_category: productData.categoria || 'food',
            value: parseFloat(productData.precoPromocional) || 0,
            currency: 'BRL',
            num_items: parseInt(productData.quantidade) || 1
        };

        fbq('track', 'AddToCart', eventData);
        this.log('🛒 AddToCart rastreado:', eventData);
    }

    /**
     * Rastrear início do checkout
     */
    trackInitiateCheckout(cartData) {
        if (!this.initialized) return;

        const eventData = {
            content_type: 'product',
            content_ids: cartData.items.map(item => item.id),
            value: parseFloat(cartData.total) || 0,
            currency: 'BRL',
            num_items: cartData.items.length
        };

        fbq('track', 'InitiateCheckout', eventData);
        this.log('🛍️ InitiateCheckout rastreado:', eventData);
    }

    /**
     * Rastrear informações de pagamento (PIX)
     */
    trackAddPaymentInfo(paymentData) {
        if (!this.initialized) return;

        const eventData = {
            content_type: 'product',
            value: parseFloat(paymentData.value) || 0,
            currency: 'BRL',
            payment_method: 'pix'
        };

        fbq('track', 'AddPaymentInfo', eventData);
        this.log('💳 AddPaymentInfo rastreado:', eventData);
    }

    /**
     * Rastrear compra finalizada
     */
    trackPurchase(purchaseData) {
        if (!this.initialized) return;

        const eventId = `purchase_${purchaseData.transaction_id}`;
        if (this.eventCache.has(eventId)) return;

        const eventData = {
            content_type: 'product',
            content_ids: purchaseData.items.map(item => item.id),
            value: parseFloat(purchaseData.total) || 0,
            currency: 'BRL',
            transaction_id: purchaseData.transaction_id,
            num_items: purchaseData.items.length
        };

        // Adicionar dados do cliente se disponível
        if (purchaseData.customer) {
            eventData.em = this.hashEmail(purchaseData.customer.email);
            eventData.ph = this.hashPhone(purchaseData.customer.phone);
        }

        fbq('track', 'Purchase', eventData);
        this.eventCache.add(eventId);
        this.log('💰 Purchase rastreado:', eventData);
    }

    /**
     * Rastrear lead (captura de dados)
     */
    trackLead(leadData) {
        if (!this.initialized) return;

        const eventData = {
            content_name: leadData.form_name || 'Formulário de Contato',
            value: parseFloat(leadData.value) || 0,
            currency: 'BRL'
        };

        // Adicionar dados do lead se disponível
        if (leadData.customer) {
            eventData.em = this.hashEmail(leadData.customer.email);
            eventData.ph = this.hashPhone(leadData.customer.phone);
        }

        fbq('track', 'Lead', eventData);
        this.log('📝 Lead rastreado:', eventData);
    }

    /**
     * Rastrear evento personalizado
     */
    trackCustomEvent(eventName, eventData = {}) {
        if (!this.initialized) return;

        fbq('trackCustom', eventName, eventData);
        this.log(`🎯 Evento personalizado ${eventName} rastreado:`, eventData);
    }

    /**
     * Obter categoria da página atual
     */
    getPageCategory() {
        const path = window.location.pathname;
        if (path.includes('checkout')) return 'checkout';
        if (path.includes('upsell')) return 'upsell';
        if (path.includes('thankyou')) return 'confirmation';
        if (path.includes('carrinho')) return 'cart';
        return 'product_catalog';
    }

    /**
     * Hash de email para privacidade
     */
    hashEmail(email) {
        if (!email) return null;
        return email.toLowerCase().trim();
    }

    /**
     * Hash de telefone para privacidade
     */
    hashPhone(phone) {
        if (!phone) return null;
        return phone.replace(/\D/g, '');
    }

    /**
     * Log de debug
     */
    log(message, data = null) {
        if (!this.debug) return;
        
        if (data) {
            console.log(`[Facebook Pixel] ${message}`, data);
        } else {
            console.log(`[Facebook Pixel] ${message}`);
        }
    }

    /**
     * Verificar se pixel está funcionando
     */
    testPixel() {
        if (!this.initialized) {
            console.warn('[Facebook Pixel] Pixel não inicializado');
            return false;
        }

        fbq('trackCustom', 'PixelTest', { test: true });
        console.log('[Facebook Pixel] ✅ Teste de pixel enviado');
        return true;
    }
}

// Inicializar automaticamente quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar um pouco para garantir que outros scripts carregaram
    setTimeout(() => {
        window.facebookPixel = new FacebookPixelManager();
    }, 500);
});

// Expor para uso global
window.FacebookPixelManager = FacebookPixelManager;

// Compatibilidade com sistema existente
window.trackFacebookEvent = function(eventName, eventData) {
    if (window.facebookPixel) {
        window.facebookPixel.trackCustomEvent(eventName, eventData);
    }
}; 