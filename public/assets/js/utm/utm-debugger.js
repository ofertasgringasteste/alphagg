/**
 * UTM Debugger - Ferramenta para diagnosticar problemas com parâmetros UTM
 * 
 * Este script cria uma interface flutuante para monitorar os parâmetros UTM
 * e a interação entre os diferentes componentes do sistema.
 */

const UtmDebugger = {
  // Estado do debugger
  active: false,
  
  // Referência para o elemento UI do debugger
  debugEl: null,
  
  // Log de eventos
  events: [],
  
  // Inicializa o debugger
  init: function() {
    // Verificar se já inicializamos
    if (this.active) return;
    
    // Criar UI do debugger
    this.createDebuggerUI();
    
    // Monitorar navegação
    this.monitorNavigation();
    
    // Monitorar armazenamento local
    this.monitorStorage();
    
    // Adicionar tecla de atalho (Alt+U)
    this.setupShortcut();
    
    // Registrar que está ativo
    this.active = true;
    this.log('UTM Debugger inicializado');
    
    // Capturar estado inicial
    if (window.UtmHandler) {
      this.log('UtmHandler disponível');
      this.updateUtmDisplay();
    } else {
      this.log('UtmHandler não disponível', 'error');
    }
    
    // Verificar fix-navegacao.js
    if (window.fixNavegacaoAtivo) {
      this.log('fix-navegacao.js detectado e ativo');
    }
    
    // Verificar parâmetros UTM na URL
    this.checkUrlUtms();
  },
  
  // Cria a UI do debugger
  createDebuggerUI: function() {
    // Criar container principal
    const debugContainer = document.createElement('div');
    debugContainer.id = 'utm-debugger';
    debugContainer.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      width: 320px;
      background: rgba(0, 0, 0, 0.8);
      color: #fff;
      border-radius: 5px;
      font-family: monospace;
      font-size: 12px;
      z-index: 9999;
      padding: 10px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
      display: none;
    `;
    
    // Criar cabeçalho
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      cursor: move;
    `;
    
    const title = document.createElement('div');
    title.textContent = '🔍 UTM Debugger';
    title.style.fontWeight = 'bold';
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: #fff;
      cursor: pointer;
      font-size: 14px;
      padding: 0 4px;
    `;
    closeBtn.onclick = () => this.toggleVisibility(false);
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // Conteúdo
    const content = document.createElement('div');
    
    // Seção de UTMs
    const utmSection = document.createElement('div');
    utmSection.style.marginBottom = '10px';
    
    const utmTitle = document.createElement('div');
    utmTitle.textContent = 'Parâmetros UTM:';
    utmTitle.style.cssText = `
      font-weight: bold;
      margin-bottom: 5px;
    `;
    
    const utmContent = document.createElement('div');
    utmContent.id = 'utm-debugger-params';
    utmContent.style.cssText = `
      background: rgba(255, 255, 255, 0.1);
      padding: 5px;
      border-radius: 3px;
      max-height: 80px;
      overflow-y: auto;
    `;
    
    utmSection.appendChild(utmTitle);
    utmSection.appendChild(utmContent);
    
    // Seção de logs
    const logSection = document.createElement('div');
    
    const logTitle = document.createElement('div');
    logTitle.textContent = 'Log de eventos:';
    logTitle.style.cssText = `
      font-weight: bold;
      margin-bottom: 5px;
      display: flex;
      justify-content: space-between;
    `;
    
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Limpar';
    clearBtn.style.cssText = `
      background: none;
      border: none;
      color: #aaa;
      cursor: pointer;
      font-size: 10px;
      text-decoration: underline;
      padding: 0;
    `;
    clearBtn.onclick = () => {
      this.events = [];
      this.updateLogDisplay();
    };
    
    logTitle.appendChild(clearBtn);
    
    const logContent = document.createElement('div');
    logContent.id = 'utm-debugger-log';
    logContent.style.cssText = `
      background: rgba(255, 255, 255, 0.1);
      padding: 5px;
      border-radius: 3px;
      max-height: 120px;
      overflow-y: auto;
    `;
    
    logSection.appendChild(logTitle);
    logSection.appendChild(logContent);
    
    // Adicionar seções ao conteúdo
    content.appendChild(utmSection);
    content.appendChild(logSection);
    
    // Botões de ação
    const actions = document.createElement('div');
    actions.style.cssText = `
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
    `;
    
    const testBtn = document.createElement('button');
    testBtn.textContent = 'Testar Navegação';
    testBtn.style.cssText = `
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 3px;
      padding: 5px 8px;
      cursor: pointer;
      font-size: 11px;
    `;
    testBtn.onclick = () => this.testNavigation();
    
    const generateBtn = document.createElement('button');
    generateBtn.textContent = 'Gerar UTM Teste';
    generateBtn.style.cssText = `
      background: #16a34a;
      color: white;
      border: none;
      border-radius: 3px;
      padding: 5px 8px;
      cursor: pointer;
      font-size: 11px;
    `;
    generateBtn.onclick = () => this.generateTestUtm();
    
    const clearUtmBtn = document.createElement('button');
    clearUtmBtn.textContent = 'Limpar UTMs';
    clearUtmBtn.style.cssText = `
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 3px;
      padding: 5px 8px;
      cursor: pointer;
      font-size: 11px;
    `;
    clearUtmBtn.onclick = () => this.clearUtms();
    
    actions.appendChild(testBtn);
    actions.appendChild(generateBtn);
    actions.appendChild(clearUtmBtn);
    
    // Montar UI completa
    debugContainer.appendChild(header);
    debugContainer.appendChild(content);
    debugContainer.appendChild(actions);
    
    // Adicionar ao documento
    document.body.appendChild(debugContainer);
    
    // Salvar referência
    this.debugEl = debugContainer;
    
    // Tornar movimentável
    this.makeElementDraggable(debugContainer, header);
  },
  
  // Adiciona drag-and-drop ao debugger
  makeElementDraggable: function(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    handle.onmousedown = dragMouseDown;
    
    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      
      pos3 = e.clientX;
      pos4 = e.clientY;
      
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }
    
    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      
      element.style.top = (element.offsetTop - pos2) + 'px';
      element.style.left = (element.offsetLeft - pos1) + 'px';
      element.style.right = 'auto';
      element.style.bottom = 'auto';
    }
    
    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  },
  
  // Monitora a navegação do usuário
  monitorNavigation: function() {
    // Patch para window.location.href
    const originalNavigateTo = Object.getOwnPropertyDescriptor(window.location, 'href').set;
    
    if (originalNavigateTo) {
      try {
        Object.defineProperty(window.location, 'href', {
          set: (url) => {
            this.log(`Navegando para: ${url}`);
            originalNavigateTo.call(window.location, url);
          }
        });
      } catch (error) {
        this.log(`Erro ao monitorar navegação: ${error.message}`, 'error');
      }
    }
    
    // Monitorar cliques em links
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.href) {
        this.log(`Clique em link: ${link.href}`);
      }
      
      // Monitorar botões específicos
      if (e.target.onclick) {
        this.log(`Clique em elemento com onclick: ${e.target.outerHTML.substring(0, 50)}...`);
      }
    });
  },
  
  // Monitora alterações no localStorage
  monitorStorage: function() {
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = (key, value) => {
      if (key.includes('utm')) {
        this.log(`localStorage.setItem('${key}', '${value.substring(0, 30)}${value.length > 30 ? '...' : ''}')`);
        
        // Se o UtmHandler modificou o storage, atualizar o display
        setTimeout(() => this.updateUtmDisplay(), 10);
      }
      originalSetItem.call(localStorage, key, value);
    };
    
    const originalRemoveItem = localStorage.removeItem;
    localStorage.removeItem = (key) => {
      if (key.includes('utm')) {
        this.log(`localStorage.removeItem('${key}')`);
        
        // Se o UtmHandler modificou o storage, atualizar o display
        setTimeout(() => this.updateUtmDisplay(), 10);
      }
      originalRemoveItem.call(localStorage, key);
    };
  },
  
  // Configurar tecla de atalho (Alt+U)
  setupShortcut: function() {
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 'u') {
        this.toggleVisibility();
      }
    });
  },
  
  // Alterna a visibilidade do debugger
  toggleVisibility: function(force) {
    if (this.debugEl) {
      if (typeof force === 'boolean') {
        this.debugEl.style.display = force ? 'block' : 'none';
      } else {
        this.debugEl.style.display = this.debugEl.style.display === 'none' ? 'block' : 'none';
      }
    }
  },
  
  // Adiciona uma entrada ao log
  log: function(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const event = { message, timestamp, type };
    
    this.events.push(event);
    
    // Limitar a 100 eventos
    if (this.events.length > 100) {
      this.events.shift();
    }
    
    // Atualizar display se estiver visível
    if (this.debugEl && this.debugEl.style.display !== 'none') {
      this.updateLogDisplay();
    }
    
    // Log no console também
    const consoleMethod = type === 'error' ? console.error : 
                          type === 'warning' ? console.warn : 
                          console.log;
    consoleMethod(`[UTM Debugger] ${message}`);
  },
  
  // Atualiza a exibição do log
  updateLogDisplay: function() {
    if (!this.debugEl) return;
    
    const logContent = document.getElementById('utm-debugger-log');
    if (!logContent) return;
    
    logContent.innerHTML = '';
    
    // Mostrar eventos do mais recente para o mais antigo
    const reversedEvents = [...this.events].reverse();
    
    for (const event of reversedEvents) {
      const eventEl = document.createElement('div');
      eventEl.style.cssText = `
        margin-bottom: 3px;
        font-size: 11px;
        ${event.type === 'error' ? 'color: #f87171;' : ''}
        ${event.type === 'warning' ? 'color: #fbbf24;' : ''}
      `;
      
      eventEl.innerHTML = `
        <span style="color: #94a3b8;">[${event.timestamp}]</span> ${event.message}
      `;
      
      logContent.appendChild(eventEl);
    }
    
    // Rolar para o mais recente
    logContent.scrollTop = logContent.scrollHeight;
  },
  
  // Atualiza a exibição dos parâmetros UTM
  updateUtmDisplay: function() {
    if (!this.debugEl) return;
    
    const utmContent = document.getElementById('utm-debugger-params');
    if (!utmContent) return;
    
    // Verificar se temos UtmHandler
    if (window.UtmHandler) {
      const utmParams = window.UtmHandler.getAllUtmParams();
      
      if (Object.keys(utmParams).length > 0) {
        // Temos UTMs
        let html = '';
        
        for (const [key, value] of Object.entries(utmParams)) {
          html += `<div><span style="color: #94a3b8;">${key}:</span> ${value}</div>`;
        }
        
        utmContent.innerHTML = html;
      } else {
        // Sem UTMs
        utmContent.innerHTML = '<div style="color: #94a3b8;">Nenhum parâmetro UTM encontrado</div>';
      }
    } else {
      // UtmHandler não disponível
      utmContent.innerHTML = '<div style="color: #f87171;">UtmHandler não disponível!</div>';
    }
  },
  
  // Verifica os parâmetros UTM na URL atual
  checkUrlUtms: function() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];
      
      let foundUtms = false;
      let utmStr = '';
      
      utmKeys.forEach(key => {
        if (urlParams.has(key)) {
          foundUtms = true;
          utmStr += `${key}=${urlParams.get(key)}, `;
        }
      });
      
      if (foundUtms) {
        this.log(`UTMs na URL atual: ${utmStr.slice(0, -2)}`);
      } else {
        this.log('Nenhum UTM na URL atual');
      }
    } catch (error) {
      this.log(`Erro ao verificar UTMs na URL: ${error.message}`, 'error');
    }
  },
  
  // Teste de navegação
  testNavigation: function() {
    try {
      // Verificar página atual
      const currentPage = window.location.pathname.split('/').pop() || 'index.html';
      let targetPage;
      
      // Determinar próxima página
      switch (currentPage) {
        case 'index.html':
          targetPage = 'carrinho.html';
          break;
        case 'carrinho.html':
          targetPage = 'checkout.html';
          break;
        case 'checkout.html':
          targetPage = 'thankyou.html';
          break;
        default:
          targetPage = 'index.html';
      }
      
      this.log(`Testando navegação para: ${targetPage}`);
      
      // Verificar se temos UtmHandler
      if (window.UtmHandler) {
        // Adicionar UTM de teste
        const testUtm = {
          utm_source: 'debugger',
          utm_medium: 'test',
          utm_campaign: 'navigation-test',
          utm_content: currentPage,
          utm_term: new Date().getTime()
        };
        
        window.UtmHandler.utmParams = testUtm;
        window.UtmHandler.saveToStorage();
        
        this.log('UTMs de teste configurados');
      }
      
      // Navegar para a próxima página
      window.location.href = targetPage;
    } catch (error) {
      this.log(`Erro no teste de navegação: ${error.message}`, 'error');
    }
  },
  
  // Gera UTMs de teste e recarrega a página
  generateTestUtm: function() {
    try {
      // Criar UTMs de teste
      const testParams = new URLSearchParams();
      testParams.set('utm_source', 'debugger');
      testParams.set('utm_medium', 'test');
      testParams.set('utm_campaign', 'debugger-test');
      testParams.set('utm_content', 'generated');
      testParams.set('utm_term', new Date().getTime().toString());
      
      // Construir nova URL
      const url = new URL(window.location.href);
      
      // Manter outros parâmetros não-UTM
      const currentParams = new URLSearchParams(window.location.search);
      for (const [key, value] of currentParams.entries()) {
        if (!key.startsWith('utm_')) {
          testParams.set(key, value);
        }
      }
      
      url.search = testParams.toString();
      
      this.log(`Redirecionando para URL com UTMs de teste: ${url.toString()}`);
      
      // Navegar para a mesma página com UTMs
      window.location.href = url.toString();
    } catch (error) {
      this.log(`Erro ao gerar UTMs de teste: ${error.message}`, 'error');
    }
  },
  
  // Limpa os UTMs do localStorage e recarrega a página sem UTMs
  clearUtms: function() {
    try {
      // Limpar do localStorage
      if (window.UtmHandler) {
        window.UtmHandler.utmParams = {};
        window.UtmHandler.saveToStorage();
      }
      
      localStorage.removeItem('morango02_utm_params');
      
      // Construir nova URL sem UTMs
      const url = new URL(window.location.href);
      const params = new URLSearchParams(window.location.search);
      const cleanParams = new URLSearchParams();
      
      // Manter apenas parâmetros não-UTM
      for (const [key, value] of params.entries()) {
        if (!key.startsWith('utm_') && 
            key !== 'fbclid' && 
            key !== 'gclid' && 
            key !== 'ttclid') {
          cleanParams.set(key, value);
        }
      }
      
      url.search = cleanParams.toString();
      
      this.log('UTMs limpos do localStorage');
      this.log(`Redirecionando para URL sem UTMs: ${url.toString()}`);
      
      // Recarregar página sem UTMs
      window.location.href = url.toString();
    } catch (error) {
      this.log(`Erro ao limpar UTMs: ${error.message}`, 'error');
    }
  }
};

// Auto-inicializar quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  // Dar um tempo para os outros scripts carregarem
  setTimeout(() => {
    UtmDebugger.init();
    
    // Mostrar automaticamente se temos UTMs na URL
    const urlParams = new URLSearchParams(window.location.search);
    for (const key of urlParams.keys()) {
      if (key.startsWith('utm_') || key === 'fbclid' || key === 'gclid') {
        UtmDebugger.toggleVisibility(true);
        break;
      }
    }
  }, 500);
});

// Atalho global para acessar o debugger
window.UtmDebugger = UtmDebugger; 