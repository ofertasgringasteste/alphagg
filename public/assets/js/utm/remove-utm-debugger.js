/**
 * Script para remover o UTM Debugger
 */
(function() {
  // Remover elemento do debugger se existir
  const debuggerElement = document.getElementById('utm-debugger');
  if (debuggerElement) {
    debuggerElement.remove();
    console.log('UTM Debugger removido do DOM');
  }
  
  // Desabilitar a funcionalidade do debugger
  if (window.UtmDebugger) {
    // Sobrescrever com funções vazias
    window.UtmDebugger.init = function() {};
    window.UtmDebugger.toggleVisibility = function() {};
    window.UtmDebugger.log = function() {};
    window.UtmDebugger.active = false;
    
    // Remover eventos de teclado que podem ativar o debugger
    document.removeEventListener('keydown', window.UtmDebugger.handleKeydown);
    
    console.log('UTM Debugger desabilitado');
  }
  
  // Remover qualquer elemento com ID utm-debugger que possa ser criado posteriormente
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.id === 'utm-debugger' || 
            (node.querySelector && node.querySelector('#utm-debugger'))) {
          node.remove();
        }
      });
    });
  });
  
  // Iniciar o observer para monitorar mudanças no DOM
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
})(); 