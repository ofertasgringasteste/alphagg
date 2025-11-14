/**
 * Gerenciador de parâmetros UTM para o projeto Morango02
 * Inspirado no hook useUtm do projeto OIA FINALIZADO
 */

// Objeto para gerenciar parâmetros UTM
const UtmHandler = {
  // Cache dos parâmetros UTM
  utmParams: {},
  
  // Flag para indicar se já foi inicializado
  initialized: false,
  
  // Chave para armazenamento local
  STORAGE_KEY: 'morango02_utm_params',
  
  // Lista de parâmetros UTM para capturar
  utmKeys: [
    'utm_source',
    'utm_medium', 
    'utm_campaign',
    'utm_term',
    'utm_content',
    'fbclid', // Facebook Click ID
    'gclid',  // Google Click ID
    'ttclid', // TikTok Click ID
    'xcod',   // Código personalizado
    'sck'     // Tracking secundário
  ],
  
  /**
   * Inicializa o gerenciador de UTM
   * Carrega valores do localStorage e depois da URL atual
   */
  initialize: function() {
    // Evitar inicialização múltipla
    if (this.initialized) {
      console.log('[UTM Handler] Já inicializado anteriormente.');
      return;
    }
    
    try {
      console.log('[UTM Handler] Inicializando...');
      
      // 1. Carregar do localStorage (se existir)
      this.loadFromStorage();
      
      // 2. Tentar capturar da URL atual (prioridade mais alta)
      this.captureFromUrl();
      
      // 3. Salvar no localStorage para uso futuro
      this.saveToStorage();
      
      // 4. Log dos parâmetros capturados
      console.log('[UTM Handler] Parâmetros UTM: ', this.utmParams);
      
      // Marcar como inicializado
      this.initialized = true;
    } catch (error) {
      console.error('[UTM Handler] Erro durante inicialização:', error);
      // Mesmo com erro, considerar inicializado para evitar loops
      this.initialized = true;
    }
  },
  
  /**
   * Carrega os parâmetros UTM do armazenamento local
   */
  loadFromStorage: function() {
    try {
      // Verificar se o localStorage está disponível
      if (!this.isLocalStorageAvailable()) {
        console.warn('[UTM Handler] localStorage não disponível');
        return;
      }
      
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsedData = JSON.parse(stored);
        
        // Validar dados para garantir que são um objeto válido
        if (parsedData && typeof parsedData === 'object' && !Array.isArray(parsedData)) {
          this.utmParams = parsedData;
          console.log('[UTM Handler] Carregado do localStorage:', this.utmParams);
        } else {
          console.warn('[UTM Handler] Dados inválidos encontrados no localStorage');
          localStorage.removeItem(this.STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('[UTM Handler] Erro ao carregar do localStorage:', error);
      // Em caso de erro, limpar o item no localStorage que pode estar corrompido
      try {
        localStorage.removeItem(this.STORAGE_KEY);
      } catch(e) {
        // Silenciar erro se não conseguir remover
      }
    }
  },
  
  /**
   * Verifica se o localStorage está disponível
   */
  isLocalStorageAvailable: function() {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  },
  
  /**
   * Salva os parâmetros UTM no armazenamento local
   */
  saveToStorage: function() {
    try {
      // Verificar se o localStorage está disponível
      if (!this.isLocalStorageAvailable()) {
        console.warn('[UTM Handler] localStorage não disponível para salvar parâmetros');
        return;
      }
      
      // Verificar se temos parâmetros a salvar
      if (Object.keys(this.utmParams).length === 0) {
        // Se não temos parâmetros e não há nada salvo, não fazer nada
        if (!localStorage.getItem(this.STORAGE_KEY)) {
          return;
        }
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.utmParams));
    } catch (error) {
      console.error('[UTM Handler] Erro ao salvar no localStorage:', error);
    }
  },
  
  /**
   * Captura os parâmetros UTM da URL atual
   */
  captureFromUrl: function() {
    try {
      // Em alguns ambientes, window.location.search pode não estar disponível
      if (!window || !window.location || typeof window.location.search !== 'string') {
        console.warn('[UTM Handler] window.location.search não disponível');
        return false;
      }
      
      const urlParams = new URLSearchParams(window.location.search);
      let updated = false;
      
      this.utmKeys.forEach(key => {
        const value = urlParams.get(key);
        if (value) {
          this.utmParams[key] = value;
          updated = true;
        }
      });
      
      if (updated) {
        console.log('[UTM Handler] Parâmetros capturados da URL:', this.utmParams);
      }
      
      return updated;
    } catch (error) {
      console.error('[UTM Handler] Erro ao capturar da URL:', error);
      return false;
    }
  },
  
  /**
   * Obtém todos os parâmetros UTM
   */
  getAllUtmParams: function() {
    return { ...this.utmParams };
  },
  
  /**
   * Obtém os parâmetros UTM como string de consulta
   */
  getUtmQueryString: function() {
    try {
      return Object.entries(this.utmParams)
        .filter(([_, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
    } catch (error) {
      console.error('[UTM Handler] Erro ao gerar string de consulta:', error);
      return '';
    }
  },
  
  /**
   * Adiciona parâmetros UTM a uma URL
   */
  appendUtmToUrl: function(url) {
    try {
      // Se não temos parâmetros UTM, retornar a URL original
      if (Object.keys(this.utmParams).length === 0) {
        return url;
      }
      
      // Verificar se a URL já contém UTMs
      if (url.includes('utm_')) {
        return url;
      }
      
      // Construir a URL com UTMs
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}${this.getUtmQueryString()}`;
    } catch (error) {
      console.error('[UTM Handler] Erro ao adicionar UTMs à URL:', error);
      return url;
    }
  },
  
  /**
   * Adiciona listener para interceptar navegação por links e preservar UTMs
   */
  setupLinkInterceptor: function() {
    document.addEventListener('click', event => {
      try {
        // Verificar se é um clique em um link
        const target = event.target.closest('a');
        if (!target) return;
        
        // Obter o href do link
        const href = target.getAttribute('href');
        if (!href) return;
        
        // Ignorar links externos, âncoras, javascript: e mailto:
        if (
          href.startsWith('http') ||
          href.startsWith('#') ||
          href.startsWith('javascript:') ||
          href.startsWith('mailto:') ||
          href.startsWith('tel:')
        ) {
          return;
        }
        
        // Adicionar UTM params ao link
        const newHref = this.appendUtmToUrl(href);
        
        // Só modificar se for diferente
        if (newHref !== href) {
          event.preventDefault();
          target.setAttribute('href', newHref);
          // Simular o clique depois de modificar
          setTimeout(() => {
            window.location.href = newHref;
          }, 0);
        }
      } catch (error) {
        console.error('[UTM Handler] Erro ao processar clique em link:', error);
      }
    });
  }
};

// Auto-inicializar o gerenciador quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  UtmHandler.initialize();
  UtmHandler.setupLinkInterceptor();
});

// Exportar o objeto para uso global
window.UtmHandler = UtmHandler; 