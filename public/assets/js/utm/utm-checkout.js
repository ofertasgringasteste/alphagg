/**
 * Integração de UTM com o processo de checkout
 * Este script garante que os parâmetros UTM sejam passados para a API de pagamento
 */

const UtmCheckout = {
  /**
   * Inicializa a integração UTM-Checkout
   */
  initialize: function() {
    console.log('[UTM Checkout] Inicializando...');
    
    // Modificar as funções de pagamento para incluir UTM params
    this.overridePaymentFunctions();
    
    console.log('[UTM Checkout] Inicializado com sucesso');
  },
  
  /**
   * Sobrescreve funções relacionadas ao pagamento
   */
  overridePaymentFunctions: function() {
    try {
      // 1. Override para iniciarPagamentoPix em app.js
      if (typeof window.iniciarPagamentoPix === 'function') {
        console.log('[UTM Checkout] Modificando iniciarPagamentoPix');
        
        const originalInitPix = window.iniciarPagamentoPix;
        
        window.iniciarPagamentoPix = async function() {
          try {
            // Verificar se temos parâmetros UTM
            if (window.UtmHandler) {
              // Obter parâmetros UTM atuais
              const utmParams = window.UtmHandler.getAllUtmParams();
              
              // Se estamos manipulando dadosPagamento globalmente, adicionar UTMs
              if (typeof dadosPagamento !== 'undefined') {
                console.log('[UTM Checkout] Adicionando UTMs ao dadosPagamento global');
                dadosPagamento.utmParams = utmParams;
              }
            }
          } catch (error) {
            console.error('[UTM Checkout] Erro ao adicionar UTMs ao pagamento:', error);
          }
          
          // Chamar função original
          return await originalInitPix.apply(this, arguments);
        };
      }
      
      // 2. Override para iniciarPagamentoPixPage em checkout-page.js
      if (typeof window.iniciarPagamentoPixPage === 'function') {
        console.log('[UTM Checkout] Modificando iniciarPagamentoPixPage');
        
        const originalInitPixPage = window.iniciarPagamentoPixPage;
        
        window.iniciarPagamentoPixPage = async function() {
          try {
            // Função definida no checkout-page.js que prepara os dados
            // Verificar se temos UTMs para adicionar aos dados do pagamento
            if (window.UtmHandler) {
              // Hook para adicionar os parâmetros UTM antes da chamada API
              const prepareUtmParams = () => {
                if (typeof dadosPagamento !== 'undefined') {
                  console.log('[UTM Checkout] Adicionando UTMs ao dadosPagamento em iniciarPagamentoPixPage');
                  const utmParams = window.UtmHandler.getAllUtmParams();
                  dadosPagamento.utmParams = utmParams;
                }
              };
              
              // Executar em um setTimeout para garantir que seja chamado após a preparação dos dados
              setTimeout(prepareUtmParams, 0);
            }
          } catch (error) {
            console.error('[UTM Checkout] Erro ao adicionar UTMs ao pagamento na página:', error);
          }
          
          // Chamar função original
          return await originalInitPixPage.apply(this, arguments);
        };
      }
    } catch (error) {
      console.error('[UTM Checkout] Erro ao modificar funções de pagamento:', error);
    }
  },
  
  /**
   * Verifica se existem parâmetros UTM salvos antes de prosseguir para o checkout
   */
  validateCheckout: function() {
    try {
      if (!window.UtmHandler) {
        return true;
      }
      
      // Verificar se temos UTMs salvos
      const utmParams = window.UtmHandler.getAllUtmParams();
      const hasUtmParams = Object.keys(utmParams).length > 0;
      
      if (!hasUtmParams) {
        console.warn('[UTM Checkout] Nenhum parâmetro UTM encontrado antes do checkout');
        
        // Adicionar valores padrão para fonte desconhecida
        window.UtmHandler.utmParams = {
          utm_source: 'direct',
          utm_medium: 'none',
          utm_campaign: 'organic'
        };
        
        window.UtmHandler.saveToStorage();
        console.log('[UTM Checkout] Parâmetros UTM padrão definidos');
      }
      
      return true;
    } catch (error) {
      console.error('[UTM Checkout] Erro ao validar checkout:', error);
      return true; // Permitir checkout mesmo em caso de erro
    }
  },
  
  /**
   * Adiciona parâmetros UTM ao objeto de pagamento
   */
  addUtmToPayment: function(paymentData) {
    try {
      if (!window.UtmHandler || !paymentData) {
        return paymentData;
      }
      
      // Obter parâmetros UTM
      const utmParams = window.UtmHandler.getAllUtmParams();
      
      // Adicionar ao objeto de pagamento
      paymentData.utmParams = utmParams;
      
      console.log('[UTM Checkout] UTMs adicionados ao objeto de pagamento:', utmParams);
      
      return paymentData;
    } catch (error) {
      console.error('[UTM Checkout] Erro ao adicionar UTMs ao pagamento:', error);
      return paymentData;
    }
  }
};

// Auto-inicializar quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  // Verificar se UtmHandler está disponível
  if (window.UtmHandler) {
    UtmCheckout.initialize();
  } else {
    console.error('[UTM Checkout] UtmHandler não encontrado. Carregue utm-handler.js primeiro.');
    
    // Tentar inicializar quando UtmHandler estiver disponível
    const checkInterval = setInterval(() => {
      if (window.UtmHandler) {
        UtmCheckout.initialize();
        clearInterval(checkInterval);
      }
    }, 500);
    
    // Limpar intervalo após 10 segundos se UtmHandler não for encontrado
    setTimeout(() => clearInterval(checkInterval), 10000);
  }
});

// Exportar para uso global
window.UtmCheckout = UtmCheckout; 