// JavaScript para a página do carrinho
document.addEventListener('DOMContentLoaded', function() {
    feather.replace();
    carregarCarrinhoDoCache();
    atualizarPaginaCarrinho();
});

// Função para atualizar a página do carrinho
function atualizarPaginaCarrinho() {
    const carrinhoVazio = document.getElementById('carrinhoVazio');
    const carrinhoComItens = document.getElementById('carrinhoComItens');
    const botaoFinalizar = document.getElementById('botaoFinalizarFixo');
    
    if (carrinho.length === 0) {
        carrinhoVazio.classList.remove('hidden');
        carrinhoComItens.classList.add('hidden');
        botaoFinalizar.classList.add('hidden');
    } else {
        carrinhoVazio.classList.add('hidden');
        carrinhoComItens.classList.remove('hidden');
        botaoFinalizar.classList.remove('hidden');
        
        atualizarListaItensCarrinho();
        atualizarResumoCarrinhoPage();
    }
    
    feather.replace();
}

// Função para atualizar a lista de itens do carrinho
function atualizarListaItensCarrinho() {
    const listaItens = document.getElementById('listaItensCarrinhoPage');
    listaItens.innerHTML = '';
    
    carrinho.forEach(item => {
        const preco = item.precoPromocional || item.preco;
        const subtotalItem = preco * item.quantidade;
        const temDesconto = item.precoOriginal && item.precoPromocional;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'bg-white rounded-lg shadow-sm border border-gray-200 p-4 item-carrinho';
        
        itemElement.innerHTML = `
            <div class="flex items-start space-x-4">
                <img src="${item.imagem}" alt="${item.nome}" class="w-20 h-20 rounded-lg object-cover flex-shrink-0">
                
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-semibold text-gray-900 text-base leading-tight">${item.nome}</h3>
                        <button onclick="removerDoCarrinhoPage('${item.id}')" 
                            class="text-red-500 hover:text-red-700 ml-2 flex-shrink-0">
                            <i data-feather="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                    
                    ${item.descricao ? `<p class="text-sm text-gray-600 mb-3 line-clamp-2">${item.descricao}</p>` : ''}
                    
                    <div class="flex items-center justify-between">
                        <div class="text-right">
                            ${temDesconto ? `<div class="text-sm text-gray-500 line-through">R$ ${item.precoOriginal.toFixed(2).replace('.', ',')}</div>` : ''}
                            <div class="font-bold text-lg text-green-600">R$ ${preco.toFixed(2).replace('.', ',')}</div>
                            <div class="text-xs text-gray-500">por unidade</div>
                        </div>
                        
                        <div class="flex items-center space-x-3 bg-gray-50 rounded-lg p-2">
                            <button onclick="diminuirQuantidadeCarrinhoPage('${item.id}')" 
                                class="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors">
                                <i data-feather="minus" class="w-4 h-4"></i>
                            </button>
                            <span class="text-lg font-semibold min-w-[2rem] text-center">${item.quantidade}</span>
                            <button onclick="aumentarQuantidadeCarrinhoPage('${item.id}')" 
                                class="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors">
                                <i data-feather="plus" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                        <span class="text-sm text-gray-600">Subtotal:</span>
                        <span class="font-bold text-lg text-gray-900">R$ ${subtotalItem.toFixed(2).replace('.', ',')}</span>
                    </div>
                    
                    ${item.promocao ? `
                        <div class="mt-2">
                            <span class="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                ${item.promocao}
                            </span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        listaItens.appendChild(itemElement);
    });
    
    feather.replace();
}

// Função para atualizar o resumo do carrinho na página
function atualizarResumoCarrinhoPage() {
    const resumoContainer = document.getElementById('resumoCarrinhoPage');
    
    if (carrinho.length === 0) {
        resumoContainer.innerHTML = '<p class="text-gray-500 text-sm">Nenhum item no carrinho</p>';
        return;
    }
    
    const resumoPedido = calcularResumoCompleto();
    
    resumoContainer.innerHTML = `
        <div class="space-y-3">
            <div class="flex items-center justify-between pb-2 border-b border-gray-100">
                <h4 class="font-semibold text-gray-900">Resumo do Pedido</h4>
                <span class="text-sm text-gray-500">${resumoPedido.totalItens} ${resumoPedido.totalItens === 1 ? 'item' : 'itens'}</span>
            </div>
            
            <div class="space-y-2">
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Subtotal:</span>
                    <span class="text-gray-900">R$ ${resumoPedido.subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                
                ${resumoPedido.economiaTotal > 0 ? `
                    <div class="flex justify-between text-sm">
                        <span class="text-green-600 flex items-center">
                            <i data-feather="tag" class="w-3 h-3 mr-1"></i>
                            Desconto aplicado:
                        </span>
                        <span class="text-green-600 font-medium">-R$ ${resumoPedido.economiaTotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                ` : ''}
                
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600 flex items-center">
                        <i data-feather="truck" class="w-3 h-3 mr-1"></i>
                        Taxa de entrega:
                    </span>
                    <span class="text-green-600 font-medium">${resumoPedido.taxaEntrega === 0 ? 'Grátis' : 'R$ ' + resumoPedido.taxaEntrega.toFixed(2).replace('.', ',')}</span>
                </div>
                
                ${resumoPedido.taxaEntrega === 0 ? `
                    <div class="bg-green-50 border border-green-200 rounded-lg p-2 mt-2">
                        <div class="flex items-center text-xs text-green-700">
                            <i data-feather="check-circle" class="w-3 h-3 mr-1"></i>
                            <span>Parabéns! Você ganhou frete grátis</span>
                        </div>
                    </div>
                ` : ''}
                
                <div class="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                    <span class="text-gray-900">Total:</span>
                    <span class="text-red-600">R$ ${resumoPedido.total.toFixed(2).replace('.', ',')}</span>
                </div>
            </div>
        </div>
    `;
    
    feather.replace();
}

// Funções de controle de quantidade específicas para a página
function aumentarQuantidadeCarrinhoPage(produtoId) {
    const item = carrinho.find(item => item.id === produtoId);
    if (item) {
        item.quantidade++;
        salvarCarrinhoNoCache();
        atualizarPaginaCarrinho();
        mostrarFeedbackQuantidade(item.nome, 'aumentou');
    }
}

function diminuirQuantidadeCarrinhoPage(produtoId) {
    const item = carrinho.find(item => item.id === produtoId);
    if (item) {
        if (item.quantidade > 1) {
            item.quantidade--;
            salvarCarrinhoNoCache();
            atualizarPaginaCarrinho();
            mostrarFeedbackQuantidade(item.nome, 'diminuiu');
        } else {
            removerDoCarrinhoPage(produtoId);
        }
    }
}

function removerDoCarrinhoPage(produtoId) {
    const item = carrinho.find(item => item.id === produtoId);
    if (item) {
        // Animação de remoção
        const itemElement = document.querySelector(`[onclick*="${produtoId}"]`).closest('.item-carrinho');
        if (itemElement) {
            itemElement.classList.add('item-removendo');
            setTimeout(() => {
                removerDoCarrinho(produtoId);
                atualizarPaginaCarrinho();
                mostrarFeedbackRemocao(item.nome);
            }, 300);
        }
    }
}

// Função para mostrar feedback de mudança de quantidade
function mostrarFeedbackQuantidade(nomeProduto, acao) {
    const feedback = document.createElement('div');
    feedback.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    feedback.innerHTML = `
        <div class="flex items-center">
            <i data-feather="info" class="w-4 h-4 mr-2"></i>
            <span>Quantidade de ${nomeProduto} ${acao}</span>
        </div>
    `;
    
    document.body.appendChild(feedback);
    feather.replace();
    
    setTimeout(() => {
        feedback.classList.remove('translate-x-full');
    }, 100);
    
    setTimeout(() => {
        feedback.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(feedback);
        }, 300);
    }, 2000);
}

// Função para limpar carrinho com confirmação
function limparCarrinho() {
    if (carrinho.length === 0) return;
    
    if (confirm('Tem certeza que deseja limpar todo o carrinho?')) {
        carrinho = [];
        localStorage.removeItem('carrinho_produtos');
        atualizarPaginaCarrinho();
        
        // Feedback de carrinho limpo
        const feedback = document.createElement('div');
        feedback.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
        feedback.innerHTML = `
            <div class="flex items-center">
                <i data-feather="trash-2" class="w-4 h-4 mr-2"></i>
                <span>Carrinho limpo</span>
            </div>
        `;
        
        document.body.appendChild(feedback);
        feather.replace();
        
        setTimeout(() => {
            feedback.classList.remove('translate-x-full');
        }, 100);
        
        setTimeout(() => {
            feedback.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(feedback);
            }, 300);
        }, 3000);
    }
}

// Funções de navegação
function voltarParaCardapio() {
    window.location.href = 'index.html';
}

function irParaCheckout() {
    if (carrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }
    
    // Garantir que o carrinho esteja salvo no localStorage antes de redirecionar
    salvarCarrinhoNoCache();
    window.location.href = 'checkout.html';
}

// Sobrescrever algumas funções globais para funcionar na página
window.atualizarCarrinho = atualizarPaginaCarrinho;
window.atualizarModalCarrinho = atualizarPaginaCarrinho;