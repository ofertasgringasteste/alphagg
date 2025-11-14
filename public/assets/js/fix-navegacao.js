/**
 * Fix de navegação para o projeto Morango02
 * 
 * Este script corrige os problemas de navegação entre as páginas:
 * - Página inicial para carrinho
 * - Carrinho para checkout
 * 
 * O problema é causado pelo cache local do navegador e pela forma como os eventos são carregados.
 * 
 * Instruções de uso:
 * 1. Inclua este arquivo em todas as páginas do site
 * 2. Adicione <script src="fix-navegacao.js"></script> antes do fechamento do </body>
 */

// Indicador de que o fix de navegação está ativo
window.fixNavegacaoAtivo = true;

document.addEventListener('DOMContentLoaded', function() {
    console.log("[FIX] Inicializando correção de navegação...");
    
    // Fix para o botão do carrinho na página inicial
    const btnCarrinhoHeader = document.querySelector('button[onclick="abrirCheckout()"]');
    if (btnCarrinhoHeader) {
        console.log("[FIX] Corrigindo botão do carrinho na página inicial");
        
        // Remover handler atual e adicionar novo
        btnCarrinhoHeader.removeAttribute('onclick');
        btnCarrinhoHeader.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("[FIX] Redirecionando para carrinho.html");
            
            // Verificar se temos UTM Handler para preservar parâmetros UTM
            let url = 'carrinho.html';
            if (window.UtmHandler) {
                url = window.UtmHandler.appendUtmToUrl(url);
            }
            
            window.location.href = url;
        });
    }
    
    // Fix para o botão de finalizar pedido na página do carrinho
    const btnFinalizarCarrinho = document.querySelector('button[onclick="irParaCheckout()"]');
    if (btnFinalizarCarrinho) {
        console.log("[FIX] Corrigindo botão de finalizar pedido no carrinho");
        
        // Remover handler atual e adicionar novo
        btnFinalizarCarrinho.removeAttribute('onclick');
        btnFinalizarCarrinho.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Verificar se tem itens no carrinho
            const carrinhoJSON = localStorage.getItem('carrinho_produtos');
            if (!carrinhoJSON || JSON.parse(carrinhoJSON).length === 0) {
                alert('Seu carrinho está vazio!');
                return;
            }
            
            console.log("[FIX] Redirecionando para checkout.html");
            
            // Verificar se temos UTM Handler para preservar parâmetros UTM
            let url = 'checkout.html';
            if (window.UtmHandler) {
                url = window.UtmHandler.appendUtmToUrl(url);
            }
            
            window.location.href = url;
        });
    }
    
    // Fix para o botão de voltar ao cardápio na página do carrinho
    const btnVoltarCarrinho = document.querySelector('button[onclick="voltarParaCardapio()"]');
    if (btnVoltarCarrinho) {
        console.log("[FIX] Corrigindo botão de voltar ao cardápio");
        
        // Remover handler atual e adicionar novo
        btnVoltarCarrinho.removeAttribute('onclick');
        btnVoltarCarrinho.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("[FIX] Redirecionando para index.html");
            
            // Verificar se temos UTM Handler para preservar parâmetros UTM
            let url = 'index.html';
            if (window.UtmHandler) {
                url = window.UtmHandler.appendUtmToUrl(url);
            }
            
            window.location.href = url;
        });
    }
    
    // Verificar se viemos de alguma navegação anterior
    const ultimaNavegacao = sessionStorage.getItem('ultima_navegacao');
    if (ultimaNavegacao) {
        console.log("[FIX] Última navegação detectada:", ultimaNavegacao);
        sessionStorage.removeItem('ultima_navegacao');
    }
    
    // Registrar navegação atual
    const paginaAtual = window.location.pathname.split('/').pop();
    sessionStorage.setItem('ultima_navegacao', paginaAtual);
    console.log("[FIX] Navegação registrada:", paginaAtual);
});

// Override das funções de navegação
if (typeof window.abrirCheckout !== 'function') {
    window.abrirCheckout = function() {
        console.log("[FIX] abrirCheckout() chamado via override");
        
        // Verificar se temos UTM Handler para preservar parâmetros UTM
        let url = 'carrinho.html';
        if (window.UtmHandler) {
            url = window.UtmHandler.appendUtmToUrl(url);
        }
        
        window.location.href = url;
    };
}

if (typeof window.irParaCheckout !== 'function') {
    window.irParaCheckout = function() {
        console.log("[FIX] irParaCheckout() chamado via override");
        
        // Verificar se tem itens no carrinho
        const carrinhoJSON = localStorage.getItem('carrinho_produtos');
        if (!carrinhoJSON || JSON.parse(carrinhoJSON).length === 0) {
            alert('Seu carrinho está vazio!');
            return;
        }
        
        // Verificar se temos UTM Handler para preservar parâmetros UTM
        let url = 'checkout.html';
        if (window.UtmHandler) {
            url = window.UtmHandler.appendUtmToUrl(url);
        }
        
        window.location.href = url;
    };
}

if (typeof window.voltarParaCardapio !== 'function') {
    window.voltarParaCardapio = function() {
        console.log("[FIX] voltarParaCardapio() chamado via override");
        
        // Verificar se temos UTM Handler para preservar parâmetros UTM
        let url = 'index.html';
        if (window.UtmHandler) {
            url = window.UtmHandler.appendUtmToUrl(url);
        }
        
        window.location.href = url;
    };
}

console.log("[FIX] Script de correção de navegação carregado!"); 