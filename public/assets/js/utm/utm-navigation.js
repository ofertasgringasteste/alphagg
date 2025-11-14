/**
 * Componente de navegação que preserva parâmetros UTM
 * Inspirado no UtmNavigation.tsx do projeto OIA FINALIZADO
 */

const UtmNavigation = {
  /**
   * Inicializa o componente de navegação
   */
  initialize: function() {
    console.log('[UTM Navigation] Inicializando...');
    
    // Verificar se fix-navegacao.js já está cuidando da navegação
    if (typeof window.fixNavegacaoAtivo === 'undefined') {
      // Interceptar funções de navegação existentes
      this.overrideNavigationFunctions();
    } else {
      console.log('[UTM Navigation] fix-navegacao.js já está ativo, adaptando comportamento');
      this.adaptToFixNavegacao();
    }
    
    // Adicionar listeners de navegação
    this.setupNavigationListeners();
  },
  
  /**
   * Adapta o comportamento para funcionar com fix-navegacao.js
   */
  adaptToFixNavegacao: function() {
    try {
      // Modificar fix-navegacao.js para preservar UTMs
      if (window.abrirCheckout && !window.abrirCheckoutOriginal) {
        console.log('[UTM Navigation] Adaptando fix-navegacao.js para preservar UTMs');
        
        // Salvar referências originais
        window.abrirCheckoutOriginal = window.abrirCheckout;
        window.irParaCheckoutOriginal = window.irParaCheckout;
        window.voltarParaCardapioOriginal = window.voltarParaCardapio;
        
        // Sobrescrever para adicionar UTMs
        window.abrirCheckout = function() {
          console.log('[UTM Navigation] abrirCheckout adaptado chamado');
          
          // Salvar UTMs antes de navegar
          if (window.UtmHandler) {
            window.UtmHandler.saveToStorage();
          }
          
          // Chamar função original
          return window.abrirCheckoutOriginal();
        };
        
        window.irParaCheckout = function() {
          console.log('[UTM Navigation] irParaCheckout adaptado chamado');
          
          // Salvar UTMs antes de navegar
          if (window.UtmHandler) {
            window.UtmHandler.saveToStorage();
          }
          
          // Chamar função original
          return window.irParaCheckoutOriginal();
        };
        
        window.voltarParaCardapio = function() {
          console.log('[UTM Navigation] voltarParaCardapio adaptado chamado');
          
          // Salvar UTMs antes de navegar
          if (window.UtmHandler) {
            window.UtmHandler.saveToStorage();
          }
          
          // Chamar função original
          return window.voltarParaCardapioOriginal();
        };
      }
    } catch (error) {
      console.error('[UTM Navigation] Erro ao adaptar para fix-navegacao.js:', error);
    }
  },
  
  /**
   * Sobrescreve funções de navegação do site para preservar UTMs
   */
  overrideNavigationFunctions: function() {
    try {
      // Lista de funções de navegação para modificar
      const navigationFunctions = [
        'abrirCheckout',
        'irParaCheckout',
        'voltarParaCardapio',
        'fecharModalProduto',
        'iniciarCheckout',
        'fecharCheckout'
      ];
      
      // Para cada função, criar um wrapper que adiciona UTMs
      navigationFunctions.forEach(funcName => {
        // Verificar se a função existe
        if (typeof window[funcName] === 'function') {
          console.log(`[UTM Navigation] Modificando função: ${funcName}`);
          
          // Guardar referência à função original
          const originalFunc = window[funcName];
          
          // Sobrescrever com nova função que adiciona UTMs
          window[funcName] = function(...args) {
            console.log(`[UTM Navigation] Chamada interceptada: ${funcName}`);
            
            // Salvar UTMs no storage antes de navegar
            if (window.UtmHandler) {
              window.UtmHandler.saveToStorage();
            }
            
            // Executar função original
            const result = originalFunc.apply(this, args);
            
            // Se a função retornar um valor não-undefined, retorná-lo
            if (result !== undefined) {
              return result;
            }
          };
        }
      });
      
      // Override específico para funções críticas de navegação
      this.overrideCheckoutNavigation();
      
      console.log('[UTM Navigation] Funções de navegação modificadas');
    } catch (error) {
      console.error('[UTM Navigation] Erro ao modificar funções:', error);
    }
  },
  
  /**
   * Override específico para funções de navegação do checkout
   */
  overrideCheckoutNavigation: function() {
    // 1. Sobrescrever window.location.href para preservar UTMs
    // Comentando essa parte para evitar conflitos com fix-navegacao.js
    /*
    const originalNavigateTo = Object.getOwnPropertyDescriptor(window.location, 'href').set;
    
    if (originalNavigateTo) {
      try {
        Object.defineProperty(window.location, 'href', {
          set: function(url) {
            // Verificar se temos UTMs para adicionar e se a URL é interna
            if (
              window.UtmHandler && 
              !url.startsWith('http') && 
              !url.startsWith('//') && 
              !url.startsWith('#') && 
              !url.startsWith('javascript:') && 
              !url.startsWith('mailto:') && 
              !url.startsWith('tel:')
            ) {
              console.log('[UTM Navigation] Modificando navegação para:', url);
              url = window.UtmHandler.appendUtmToUrl(url);
            }
            
            // Chamar o setter original
            originalNavigateTo.call(this, url);
          }
        });
      } catch (error) {
        console.error('[UTM Navigation] Erro ao sobrescrever window.location.href:', error);
      }
    }
    */
  },
  
  /**
   * Configura listeners para navegação na página
   */
  setupNavigationListeners: function() {
    try {
      // 1. Interceptar formulários para adicionar UTMs como campos ocultos
      document.addEventListener('submit', event => {
        const form = event.target;
        
        // Verificar se é um formulário e se não é externo
        if (
          form.tagName === 'FORM' && 
          window.UtmHandler && 
          (!form.action || !form.action.startsWith('http'))
        ) {
          // Obter parâmetros UTM
          const utmParams = window.UtmHandler.getAllUtmParams();
          
          // Adicionar cada parâmetro UTM como campo oculto
          Object.entries(utmParams).forEach(([key, value]) => {
            if (value) {
              // Verificar se o campo já existe
              let input = form.querySelector(`input[name="${key}"]`);
              
              if (!input) {
                // Criar novo campo
                input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                form.appendChild(input);
              }
              
              // Definir valor
              input.value = value;
            }
          });
        }
      });
      
      // 2. Interceptar eventos de clique em botões específicos do carrinho
      document.addEventListener('click', event => {
        // Botões específicos que queremos interceptar
        const target = event.target;
        
        // Verificar se o clique foi em um botão específico do carrinho
        // Não usar closest() para evitar problemas com fix-navegacao.js
        if (target && target.getAttribute && target.getAttribute('onclick') === 'abrirCheckout()') {
          console.log('[UTM Navigation] Botão abrirCheckout() detectado');
          
          // Salvar UTMs no storage antes de navegar
          if (window.UtmHandler) {
            window.UtmHandler.saveToStorage();
          }
        }
      });
    } catch (error) {
      console.error('[UTM Navigation] Erro ao configurar listeners:', error);
    }
  }
};

// Auto-inicializar quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  // Verificar se UtmHandler está disponível
  if (window.UtmHandler) {
    UtmNavigation.initialize();
  } else {
    console.error('[UTM Navigation] UtmHandler não encontrado. Carregue utm-handler.js primeiro.');
    
    // Tentar inicializar quando UtmHandler estiver disponível
    const checkInterval = setInterval(() => {
      if (window.UtmHandler) {
        UtmNavigation.initialize();
        clearInterval(checkInterval);
      }
    }, 500);
    
    // Limpar intervalo após 5 segundos se UtmHandler não for encontrado
    setTimeout(() => clearInterval(checkInterval), 5000);
  }
});

// Exportar para uso global
window.UtmNavigation = UtmNavigation; 