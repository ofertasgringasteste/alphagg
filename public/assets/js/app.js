// Variáveis globais
let carrinho = [];
let enderecoCliente = null;
let dadosCliente = null;
let taxaEntregaSelecionada = 0;
let paginaAtual = '';

// Detectar em qual página estamos
function detectarPaginaAtual() {
    const path = window.location.pathname;
    const fileName = path.split('/').pop() || 'index.html';
    
    paginaAtual = fileName.toLowerCase();
    console.log("[App] Página atual:", paginaAtual);
    
    return paginaAtual;
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log("[App] Inicializando...");
    
    // Detectar a página atual
    detectarPaginaAtual();
    
    // Verificações defensivas para garantir que os componentes necessários existam
    try {
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
        
        // Carregar dados do cliente e endereço
        verificarCacheEndereco();
        carregarCarrinhoDoCache();
        
        // Atualizar visibilidade do carrinho se existirem itens
        atualizarCarrinho();
        
        // Carregar produtos e informações da loja apenas se os módulos estiverem disponíveis
        // e estivermos na página principal, carrinho ou checkout
        if (typeof PRODUTOS_CONFIG !== 'undefined' && 
            (paginaAtual === 'index.html' || paginaAtual === '' || 
             paginaAtual === 'carrinho.html' || paginaAtual === 'checkout.html')) {
            carregarProdutos();
        }
        
        if (typeof loja !== 'undefined') {
            carregarInformacoesLoja();
        }
        
        // Configurar máscaras e inputs apenas na página principal
        if (paginaAtual === 'index.html' || paginaAtual === '') {
            configurarMascaraCEP();
        }
        
        console.log("[App] Inicialização concluída");
    } catch (error) {
        console.error("[App] Erro durante inicialização:", error);
    }
});

// Função para carregar informações da loja
function carregarInformacoesLoja() {
    // Configurar logo e banner
    const logoLoja = document.getElementById('logoLoja');
    const bannerLoja = document.getElementById('bannerLoja');
    const nomeLoja = document.getElementById('nomeLoja');
    
    if (logoLoja) {
        logoLoja.src = loja.logo;
        logoLoja.alt = loja.nome;
    }
    
    if (bannerLoja) {
        // Se banner for uma cor (começa com #), aplicar como background-color
        if (loja.banner && loja.banner.startsWith('#')) {
            bannerLoja.style.display = 'none';
            bannerLoja.parentElement.style.backgroundColor = loja.banner;
        } else {
            // Se for uma URL, usar como imagem
            bannerLoja.src = loja.banner;
            bannerLoja.style.display = 'block';
        }
    }
    
    if (nomeLoja) {
        nomeLoja.textContent = loja.nome;
    }
    
    // Atualizar elementos do header se existirem
    const elementos = {
        'distanciaLoja': loja.distancia,
        'pedidoMinimo': '15,00',
        'avaliacaoNota': loja.avaliacao,
        'totalAvaliacoes': loja.totalAvaliacoes,
        'nivelLoja': loja.nivel.split(' ')[1], // Extrair apenas o número
        'tempoEntrega': loja.tempoEntrega,
        'statusEntrega': loja.entregaGratis
    };
    
    Object.keys(elementos).forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento && elementos[id]) {
            elemento.textContent = elementos[id];
        }
    });
    
    // Adicionar link do Instagram se disponível
    const instagramLinks = document.querySelectorAll('a[href*="instagram.com"]');
    if (loja.instagram && instagramLinks.length > 0) {
        instagramLinks.forEach(link => {
            link.href = loja.instagram;
        });
    }
    
    // Aplicar cores da marca se definidas
    if (loja.cores) {
        aplicarCoresMarca();
    }
}

// Função para aplicar cores da marca
function aplicarCoresMarca() {
    const root = document.documentElement;
    root.style.setProperty('--cor-primaria', loja.cores.primaria);
    root.style.setProperty('--cor-secundaria', loja.cores.secundaria);
    root.style.setProperty('--cor-destaque', loja.cores.destaque);
}

// Funções de localização por CEP
function verificarCacheEndereco() {
    const enderecoSalvo = localStorage.getItem('endereco_cliente');
    const modalCEP = document.getElementById('modalCEP');
    
    if (enderecoSalvo) {
        enderecoCliente = JSON.parse(enderecoSalvo);
        // Se há endereço salvo, pular modais de localização
        if (modalCEP) {
            modalCEP.classList.add('hidden');
        }
        atualizarDistanciaLoja();
    } else {
        // Mostrar modal de CEP apenas se ele existir na página
        if (modalCEP) {
            modalCEP.classList.remove('hidden');
        }
    }
}

function configurarMascaraCEP() {
    const inputCEP = document.getElementById('inputCEP');
    if (!inputCEP) return; // Se o elemento não existir, sair da função
    
    inputCEP.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
        e.target.value = value;
    });
    
    // Permitir consulta ao pressionar Enter
    inputCEP.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            consultarCEP();
        }
    });
}

async function consultarCEP() {
    const inputCEP = document.getElementById('inputCEP');
    const erroCEP = document.getElementById('erroCEP');
    const cep = inputCEP.value.replace(/\D/g, '');
    
    // Limpar erro anterior
    erroCEP.classList.add('hidden');
    
    // Validar CEP
    if (cep.length !== 8) {
        mostrarErroCEP('CEP deve ter 8 dígitos');
        return;
    }
    
    try {
        // Mostrar loading
        inputCEP.disabled = true;
        
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const dados = await response.json();
        
        if (dados.erro) {
            mostrarErroCEP('CEP não encontrado');
            return;
        }
        
        // Salvar dados do endereço temporariamente
        window.dadosEndereco = dados;
        
        // Mostrar endereço encontrado
        document.getElementById('enderecoEncontrado').innerHTML = `
            <strong>Endereço encontrado:</strong><br>
            ${dados.logradouro}, ${dados.bairro}<br>
            ${dados.localidade} - ${dados.uf}
        `;
        
        // Ir para próximo modal
        document.getElementById('modalCEP').classList.add('hidden');
        document.getElementById('modalNumero').classList.remove('hidden');
        
    } catch (error) {
        mostrarErroCEP('Erro ao consultar CEP. Tente novamente.');
    } finally {
        inputCEP.disabled = false;
    }
}

function mostrarErroCEP(mensagem) {
    const erroCEP = document.getElementById('erroCEP');
    erroCEP.textContent = mensagem;
    erroCEP.classList.remove('hidden');
}

function salvarEndereco() {
    const inputNumero = document.getElementById('inputNumero');
    const numero = inputNumero.value.trim();
    
    if (!numero) {
        alert('Por favor, informe o número da residência');
        return;
    }
    
    // Criar endereço completo
    const enderecoCompleto = {
        cep: window.dadosEndereco.cep,
        logradouro: window.dadosEndereco.logradouro,
        numero: numero,
        bairro: window.dadosEndereco.bairro,
        cidade: window.dadosEndereco.localidade,
        uf: window.dadosEndereco.uf,
        enderecoCompleto: `${window.dadosEndereco.logradouro}, ${numero}, ${window.dadosEndereco.bairro}, ${window.dadosEndereco.localidade} - ${window.dadosEndereco.uf}`
    };
    
    // Salvar no localStorage
    localStorage.setItem('endereco_cliente', JSON.stringify(enderecoCompleto));
    enderecoCliente = enderecoCompleto;
    
    // Mostrar loading
    document.getElementById('modalNumero').classList.add('hidden');
    document.getElementById('modalLoading').classList.remove('hidden');
    
    // Simular busca de loja
    setTimeout(() => {
        const distancia = calcularDistanciaSimulada();
        document.getElementById('distanciaCalculada').textContent = distancia;
        
        document.getElementById('modalLoading').classList.add('hidden');
        document.getElementById('modalSucesso').classList.remove('hidden');
        
        atualizarDistanciaLoja();
        
        // Notificar que um novo endereço foi salvo
        if (typeof onNovoEnderecoSalvo === 'function') {
            onNovoEnderecoSalvo();
        }
    }, 2000);
}

function calcularDistanciaSimulada() {
    // Simular cálculo de distância baseado no CEP
    const distancias = ['1,2km', '1,8km', '2,3km', '2,7km', '3,1km', '3,5km'];
    return distancias[Math.floor(Math.random() * distancias.length)];
}

function atualizarDistanciaLoja() {
    if (!enderecoCliente) return;
    
    // Calcular distância simulada
    const distancia = calcularDistanciaSimulada();
    
    // Atualizar na interface
    const distanciaEl = document.getElementById('distanciaLoja');
    const distanciaCalculadaEl = document.getElementById('distanciaCalculada');
    
    if (distanciaEl) {
        distanciaEl.textContent = `${distancia} km`;
    }
    
    if (distanciaCalculadaEl) {
        distanciaCalculadaEl.textContent = `${distancia} km`;
    }
}

function fecharTodosModais() {
    document.getElementById('modalSucesso').classList.add('hidden');
}

// Funções de produtos
function carregarProdutos() {
    console.log("[App] Carregando produtos...");
    
    // Verificar em qual página estamos
    const paginaAtual = detectarPaginaAtual();
    
    // Carregar seções de produtos apenas na página principal
    if (paginaAtual === 'index.html' || paginaAtual === '') {
        // Verificar se elemento existe antes de tentar carregar
        if (document.getElementById('secoesProdutos')) {
            carregarSecoesProdutos();
        } else {
            console.log("[App] Elemento secoesProdutos não encontrado na página principal");
        }
    } else {
        console.log("[App] Ignorando carregamento de seções de produtos em " + paginaAtual);
    }
}

function carregarSecoesProdutos() {
    const container = document.getElementById('secoesProdutos');
    if (!container) {
        console.log("[App] Elemento secoesProdutos não encontrado");
        return;
    }
    container.innerHTML = '';
    
    Object.keys(produtos).forEach(categoriaKey => {
        if (produtos[categoriaKey] && produtos[categoriaKey].length > 0) {
            const secao = criarSecaoProdutos(categoriaKey);
            container.appendChild(secao);
        }
    });
}

function criarSecaoProdutos(categoriaKey) {
    const categoria = categorias.find(cat => cat.id === categoriaKey) || 
                     { nome: categoriaKey.charAt(0).toUpperCase() + categoriaKey.slice(1), icone: '📦' };
    
    const section = document.createElement('section');
    section.id = `sec-${categoriaKey}`;
    section.className = 'secao-produtos fade-in-up';
    
    // Header da categoria
    const header = document.createElement('div');
    header.className = 'categoria-header';
    header.innerHTML = `
        <span class="categoria-icone">${categoria.icone || '📦'}</span>
        <h2 class="categoria-titulo">${categoria.nome}</h2>
        ${categoria.destaque ? '<span class="categoria-badge">🔥 Popular</span>' : ''}
    `;
    
    // Container dos produtos
    const produtosContainer = document.createElement('div');
    produtosContainer.className = 'produtos-lista shadow-produto';
    produtosContainer.id = `produtos-${categoriaKey}`;
    
    // Carregar produtos da categoria
    produtos[categoriaKey].forEach((produto, index) => {
        const produtoElement = criarElementoProduto(produto);
        produtosContainer.appendChild(produtoElement);
    });
    
    section.appendChild(header);
    section.appendChild(produtosContainer);
    
    return section;
}

function criarElementoProduto(produto) {
    const div = document.createElement('div');
    div.className = `produto-item ${!produto.disponivel ? 'produto-indisponivel' : ''}`;
    div.onclick = () => abrirModalProduto(produto);
    
    // Determinar preço a exibir
    const precoExibir = produto.precoPromocional || produto.preco;
    const temPromocao = produto.precoOriginal && produto.precoPromocional;
    
    // Criar tags do produto
    const tags = [];
    if (produto.maisVendido) tags.push('<span class="tag tag-mais-vendido">Mais vendido</span>');
    if (produto.destaque) tags.push('<span class="tag tag-promocao">🔥 Destaque</span>');
    if (produto.desconto) tags.push('<span class="tag tag-desconto">' + produto.desconto + '% OFF</span>');
    if (produto.promocao) tags.push('<span class="tag tag-novo">' + produto.promocao + '</span>');
    
    // Informações extras
    const infosExtras = [];
    if (produto.peso) infosExtras.push(`<span class="produto-peso">${produto.peso}</span>`);
    if (produto.quantidade) infosExtras.push(`<span class="produto-quantidade">${produto.quantidade} unidades</span>`);
    
    div.innerHTML = `
        <img src="${produto.imagem}" alt="${produto.nome}" class="produto-imagem">
        <div class="produto-conteudo">
            <div class="produto-header">
                <h3 class="produto-titulo">${produto.nome}</h3>
                <div class="produto-preco-container">
                    ${temPromocao ? `<p class="produto-preco-antigo">R$ ${produto.precoOriginal.toFixed(2).replace('.', ',')}</p>` : ''}
                    <p class="produto-preco-atual">R$ ${precoExibir.toFixed(2).replace('.', ',')}</p>
                </div>
            </div>
            
            ${produto.descricao ? `<p class="produto-descricao">${produto.descricao}</p>` : ''}
            
            ${infosExtras.length > 0 ? `<div class="produto-info-extra">${infosExtras.join(' • ')}</div>` : ''}
            
            ${tags.length > 0 ? `<div class="produto-tags">${tags.join('')}</div>` : ''}
            
            ${produto.motivoEscolha ? `<div class="motivo-compra">${produto.motivoEscolha}</div>` : ''}
        </div>
    `;
    
    return div;
}

// Funções removidas - busca não necessária para cardápio simples

// Funções do carrinho aprimoradas
function carregarCarrinhoDoCache() {
        const carrinhoSalvo = localStorage.getItem('carrinho_produtos');
    
        if (carrinhoSalvo) {
        try {
            // Tentar carregar os dados do carrinho
            carrinho = JSON.parse(carrinhoSalvo);
            console.log("[App] Carrinho carregado do cache:", carrinho.length, "item(s)");
            
            // Verificar se o carrinho tem itens e mostrar a barra se necessário
            if (carrinho.length > 0) {
                const carrinhoBar = document.getElementById('carrinhoBar');
                if (carrinhoBar) {
                    carrinhoBar.classList.remove('hidden');
                    
                    // Atualizar valores no resumo
                    const totalCarrinho = calcularTotalCarrinho();
                const totalItens = calcularTotalItens();
                    const resumoTotal = document.getElementById('resumoTotal');
                    
                    if (resumoTotal) {
                        const textoItem = totalItens === 1 ? 'item' : 'itens';
                        resumoTotal.innerHTML = `R$ ${totalCarrinho.toFixed(2).replace('.', ',')} <span class="text-sm font-normal text-gray-600">/ ${totalItens} ${textoItem}</span>`;
                    }
                }
        }
    } catch (error) {
            console.error("[App] Erro ao carregar carrinho do cache:", error);
            carrinho = [];
        }
    } else {
        console.log("[App] Nenhum carrinho encontrado no cache");
        carrinho = [];
    }
}

function salvarCarrinhoNoCache() {
    localStorage.setItem('carrinho_produtos', JSON.stringify(carrinho));
}

function adicionarAoCarrinho(produto, quantidade = 1) {
    // Verificar se o produto já está no carrinho
    const itemExistente = carrinho.find(item => item.id === produto.id);
    
    if (itemExistente) {
        // Se já existe, aumentar quantidade
        itemExistente.quantidade += quantidade;
    } else {
        // Se não existe, adicionar com quantidade informada
        carrinho.push({...produto, quantidade});
    }
    
    // Atualizar interface
    atualizarCarrinho();
    
    // Mostrar barra do carrinho imediatamente
    const carrinhoBar = document.getElementById('carrinhoBar');
    if (carrinhoBar) {
        carrinhoBar.classList.remove('hidden');
    }
    
    // Facebook Pixel - AddToCart Event
    if (window.facebookPixel) {
        window.facebookPixel.trackAddToCart({
            id: produto.id,
            nome: produto.nome,
            categoria: produto.categoria,
            precoPromocional: produto.precoPromocional,
            quantidade: quantidade
        });
    }
    
    // Feedback visual
    mostrarFeedbackAdicao(produto.nome, quantidade);
}

function removerDoCarrinho(produtoId) {
    const itemRemovido = carrinho.find(item => item.id === produtoId);
    carrinho = carrinho.filter(item => item.id !== produtoId);
    
    salvarCarrinhoNoCache();
    atualizarResumoTempoReal();
    
    if (itemRemovido) {
        mostrarFeedbackRemocao(itemRemovido.nome);
    }
}

function atualizarQuantidade(produtoId, novaQuantidade) {
    const item = carrinho.find(item => item.id === produtoId);
    if (item) {
        if (novaQuantidade <= 0) {
            removerDoCarrinho(produtoId);
        } else {
            item.quantidade = novaQuantidade;
            salvarCarrinhoNoCache();
            atualizarResumoTempoReal();
        }
    }
}

function aumentarQuantidadeCarrinho(produtoId) {
    const item = carrinho.find(item => item.id === produtoId);
    if (item) {
        item.quantidade++;
        salvarCarrinhoNoCache();
        atualizarCarrinho();
    }
}

function diminuirQuantidadeCarrinho(produtoId) {
    const item = carrinho.find(item => item.id === produtoId);
    if (item) {
        if (item.quantidade > 1) {
            item.quantidade--;
            salvarCarrinhoNoCache();
            atualizarCarrinho();
        } else {
            removerDoCarrinho(produtoId);
        }
    }
}

function calcularTotalCarrinho() {
    return carrinho.reduce((sum, item) => {
        const preco = item.precoPromocional || item.preco;
        return sum + (preco * item.quantidade);
    }, 0);
}

function calcularTotalItens() {
    return carrinho.reduce((sum, item) => sum + item.quantidade, 0);
}

function atualizarCarrinho() {
    // Atualizar contagem no ícone do carrinho
    const contadorCarrinho = document.querySelector('.contador-carrinho');
    if (contadorCarrinho) {
        const totalItens = calcularTotalItens();
        contadorCarrinho.textContent = totalItens > 0 ? totalItens : '';
        contadorCarrinho.classList.toggle('hidden', totalItens <= 0);
    }
    
    // Atualizar barra fixa do carrinho
    const carrinhoBar = document.getElementById('carrinhoBar');
    if (carrinhoBar) {
        const totalItens = calcularTotalItens();
        const totalCarrinho = calcularTotalCarrinho();
        
        // Mostrar ou esconder a barra do carrinho
        carrinhoBar.classList.toggle('hidden', totalItens <= 0);
        
        // Atualizar resumo no carrinho
        const resumoTotal = document.getElementById('resumoTotal');
        if (resumoTotal) {
            const textoItem = totalItens === 1 ? 'item' : 'itens';
            resumoTotal.innerHTML = `R$ ${totalCarrinho.toFixed(2).replace('.', ',')} <span class="text-sm font-normal text-gray-600">/ ${totalItens} ${textoItem}</span>`;
        }
    }
    
    // Atualizar modal do carrinho, se estiver aberto
    const modalCarrinho = document.getElementById('modalCarrinho');
    if (modalCarrinho && !modalCarrinho.classList.contains('hidden')) {
        atualizarModalCarrinho();
    }
    
    // Atualizar outros resumos (checkout, etc), apenas se existirem
    try {
        atualizarTodosResumos();
    } catch (error) {
        // Ignorar erros se alguns elementos não existirem
        console.debug('Alguns elementos para resumo não existem nesta página', error);
    }
    
    // Salvar carrinho atualizado no localStorage
    salvarCarrinhoNoCache();
}

function limparCarrinho() {
    carrinho = [];
    localStorage.removeItem('carrinho_produtos');
    atualizarCarrinho();
    fecharCheckout();
}

function obterResumoCarrinho() {
    return {
        itens: carrinho,
        total: calcularTotalCarrinho(),
        totalItens: calcularTotalItens(),
        subtotal: calcularTotalCarrinho(),
        desconto: 0,
        taxaEntrega: 0 // Entrega grátis
    };
}

// Funções de feedback visual
function mostrarFeedbackAdicao(nomeProduto, quantidade) {
    // Criar notificação temporária
    const feedback = document.createElement('div');
    feedback.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    feedback.innerHTML = `
        <div class="flex items-center">
            <i data-feather="check-circle" class="w-4 h-4 mr-2"></i>
            <span>${quantidade}x ${nomeProduto} adicionado${quantidade > 1 ? 's' : ''} ao carrinho</span>
        </div>
    `;
    
    document.body.appendChild(feedback);
    feather.replace();
    
    // Animar entrada
    setTimeout(() => {
        feedback.classList.remove('translate-x-full');
    }, 100);
    
    // Remover após 3 segundos
    setTimeout(() => {
        feedback.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(feedback);
        }, 300);
    }, 3000);
}

function mostrarFeedbackRemocao(nomeProduto) {
    const feedback = document.createElement('div');
    feedback.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    feedback.innerHTML = `
        <div class="flex items-center">
            <i data-feather="x-circle" class="w-4 h-4 mr-2"></i>
            <span>${nomeProduto} removido do carrinho</span>
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

// Variáveis do modal de produto
let produtoAtual = null;
let quantidadeAtual = 1;

// Funções de modal de produto
function abrirModalProduto(produto) {
    produtoAtual = produto;
    quantidadeAtual = 1;
    
    // Facebook Pixel - ViewContent Event
    if (window.facebookPixel) {
        window.facebookPixel.trackViewContent({
            content_id: produto.id,
            content_name: produto.nome,
            content_category: produto.categoria,
            value: produto.precoPromocional || produto.preco
        });
    }
    
    // Preencher informações do produto
    document.getElementById('modalProdutoImagem').src = produto.imagem;
    document.getElementById('modalProdutoImagem').alt = produto.nome;
    document.getElementById('modalProdutoNome').textContent = produto.nome;
    document.getElementById('modalProdutoDescricao').textContent = produto.descricao || '';
    
    // Criar tags do produto
    const tagsContainer = document.getElementById('modalProdutoTags');
    tagsContainer.innerHTML = '';
    
    const tags = [];
    if (produto.maisVendido) tags.push('<span class="tag tag-mais-vendido">Mais vendido</span>');
    if (produto.destaque) tags.push('<span class="tag tag-promocao">🔥 Destaque</span>');
    if (produto.desconto) tags.push('<span class="tag tag-desconto">' + produto.desconto + '% OFF</span>');
    if (produto.promocao) tags.push('<span class="tag tag-novo">' + produto.promocao + '</span>');
    
    tagsContainer.innerHTML = tags.join('');
    
    // Informações extras
    const infosContainer = document.getElementById('modalProdutoInfos');
    const infosExtras = [];
    if (produto.peso) infosExtras.push(`Peso: ${produto.peso}`);
    if (produto.quantidade) infosExtras.push(`${produto.quantidade} unidades`);
    if (produto.tipo) infosExtras.push(`Tipo: ${produto.tipo}`);
    if (produto.tamanho) infosExtras.push(`Tamanho: ${produto.tamanho}`);
    
    infosContainer.textContent = infosExtras.join(' • ');
    
    // Preços
    const precoOriginal = document.getElementById('modalProdutoPrecoOriginal');
    const precoAtual = document.getElementById('modalProdutoPrecoAtual');
    
    if (produto.precoOriginal && produto.precoPromocional) {
        precoOriginal.textContent = `R$ ${produto.precoOriginal.toFixed(2).replace('.', ',')}`;
        precoOriginal.classList.remove('hidden');
        precoAtual.textContent = `R$ ${produto.precoPromocional.toFixed(2).replace('.', ',')}`;
    } else {
        precoOriginal.classList.add('hidden');
        const preco = produto.precoPromocional || produto.preco;
        precoAtual.textContent = `R$ ${preco.toFixed(2).replace('.', ',')}`;
    }
    
    // Resetar quantidade
    document.getElementById('quantidadeProduto').textContent = quantidadeAtual;
    atualizarTotalProduto();
    
    // Mostrar modal
    document.getElementById('modalProduto').classList.remove('hidden');
    
    // Atualizar ícones do Feather
    feather.replace();
}

function fecharModalProduto() {
    document.getElementById('modalProduto').classList.add('hidden');
    produtoAtual = null;
    quantidadeAtual = 1;
}

function diminuirQuantidade() {
    if (quantidadeAtual > 1) {
        quantidadeAtual--;
        document.getElementById('quantidadeProduto').textContent = quantidadeAtual;
        atualizarTotalProduto();
    }
}

function aumentarQuantidade() {
    quantidadeAtual++;
    document.getElementById('quantidadeProduto').textContent = quantidadeAtual;
    atualizarTotalProduto();
}

function atualizarTotalProduto() {
    if (produtoAtual) {
        const preco = produtoAtual.precoPromocional || produtoAtual.preco;
        const total = preco * quantidadeAtual;
        document.getElementById('totalProduto').textContent = `- R$ ${total.toFixed(2).replace('.', ',')}`;
    }
}

function adicionarProdutoAoCarrinho() {
    if (produtoAtual) {
        adicionarAoCarrinho(produtoAtual, quantidadeAtual);
        fecharModalProduto();
    }
}

// Funções do modal de carrinho
function abrirCheckout() {
    // Verificar se há itens no carrinho
    if (carrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }
    
    // Facebook Pixel - InitiateCheckout Event
    if (window.facebookPixel) {
        const cartData = {
            items: carrinho.map(item => ({
                id: item.id,
                name: item.nome,
                category: item.categoria,
                quantity: item.quantidade,
                value: item.precoPromocional || item.preco
            })),
            total: calcularTotalCarrinho()
        };
        window.facebookPixel.trackInitiateCheckout(cartData);
    }
    
    console.log("[App] Redirecionando para a página do carrinho");
    
    // Redirecionar para página do carrinho, preservando parâmetros UTM se existirem
    let url = 'carrinho.html';
    
    // Preservar parâmetros UTM se estiverem disponíveis
    if (typeof UTMHandler !== 'undefined' && UTMHandler.getParametersForURL) {
        url = UTMHandler.getParametersForURL(url);
    } else {
        // Tentar preservar os parâmetros da URL atual
        const currentParams = new URLSearchParams(window.location.search);
        if (currentParams.toString()) {
            url += '?' + currentParams.toString();
        }
    }
    
    window.location.href = url;
}

function fecharCarrinho() {
    document.getElementById('modalCarrinho').classList.add('hidden');
}

function atualizarModalCarrinho() {
    const listaItens = document.getElementById('listaItensCarrinho');
    const subtotal = document.getElementById('subtotalCarrinho');
    const total = document.getElementById('totalCarrinho');
    
    // Limpar lista atual
    listaItens.innerHTML = '';
    
    if (carrinho.length === 0) {
        listaItens.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i data-feather="shopping-cart" class="w-12 h-12 mx-auto mb-4 text-gray-300"></i>
                <p>Seu carrinho está vazio</p>
            </div>
        `;
        subtotal.textContent = 'R$ 0,00';
        total.textContent = 'R$ 0,00';
        return;
    }
    
    // Adicionar cada item
    carrinho.forEach(item => {
        const preco = item.precoPromocional || item.preco;
        const subtotalItem = preco * item.quantidade;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'flex items-center space-x-3 bg-white p-3 rounded-lg border';
        itemElement.innerHTML = `
            <img src="${item.imagem}" alt="${item.nome}" class="w-16 h-16 object-cover rounded-lg">
            <div class="flex-1">
                <h4 class="font-medium text-sm">${item.nome}</h4>
                <p class="text-green-600 font-semibold">R$ ${preco.toFixed(2).replace('.', ',')}</p>
                <div class="flex items-center space-x-2 mt-2">
                    <button onclick="diminuirQuantidadeCarrinho('${item.id}')" class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                        -
                    </button>
                    <span class="text-sm font-medium min-w-[1.5rem] text-center">${item.quantidade}</span>
                    <button onclick="aumentarQuantidadeCarrinho('${item.id}')" class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                        +
                    </button>
                </div>
            </div>
            <div class="text-right">
                <p class="font-semibold">R$ ${subtotalItem.toFixed(2).replace('.', ',')}</p>
                <button onclick="removerDoCarrinho('${item.id}')" class="text-red-500 text-sm mt-1 hover:text-red-700">
                    Remover
                </button>
            </div>
        `;
        
        listaItens.appendChild(itemElement);
    });
    
    // Atualizar totais
    const totalCarrinho = calcularTotalCarrinho();
    subtotal.textContent = `R$ ${totalCarrinho.toFixed(2).replace('.', ',')}`;
    total.textContent = `R$ ${totalCarrinho.toFixed(2).replace('.', ',')}`;
}

// Sobrescrever a função atualizarCarrinho para também atualizar o modal se estiver aberto
const atualizarCarrinhoOriginal = atualizarCarrinho;
atualizarCarrinho = function() {
    atualizarCarrinhoOriginal();
    
    // Se o modal do carrinho estiver aberto, atualizá-lo também
    const modalCarrinho = document.getElementById('modalCarrinho');
    if (modalCarrinho && !modalCarrinho.classList.contains('hidden')) {
        atualizarModalCarrinho();
    }
    
    // Se o modal de checkout estiver aberto, atualizar o resumo também
    const modalCheckout = document.getElementById('modalCheckout');
    if (modalCheckout && !modalCheckout.classList.contains('hidden')) {
        atualizarResumoCheckout();
    }
};

// Função para exibir resumo final na confirmação do pedido
function exibirResumoFinalPedido() {
    const resumoFinalContainer = document.getElementById('resumoFinalPedido');
    const enderecoEntregaElement = document.getElementById('enderecoEntrega');
    const protocoloElement = document.getElementById('protocoloPedido');
    
    if (!resumoFinalContainer) return;
    
    // Limpar container
    resumoFinalContainer.innerHTML = '';
    
    // Calcular resumo completo
    const resumoPedido = calcularResumoCompleto();
    
    // Criar header do resumo final
    const headerDiv = document.createElement('div');
    headerDiv.className = 'mb-4 pb-2 border-b border-green-300';
    headerDiv.innerHTML = `
        <div class="flex items-center justify-between">
            <h6 class="font-semibold text-green-800">Pedido Confirmado</h6>
            <span class="text-xs text-green-600">${resumoPedido.totalItens} ${resumoPedido.totalItens === 1 ? 'item' : 'itens'}</span>
        </div>
    `;
    
    // Criar seção detalhada de itens
    const itensDiv = document.createElement('div');
    itensDiv.className = 'mb-4 space-y-2';
    
    resumoPedido.itens.forEach(item => {
        const temDesconto = item.precoOriginal && item.precoPromocional;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'flex items-start justify-between py-2 border-b border-green-100 last:border-b-0';
        itemDiv.innerHTML = `
            <div class="flex-1">
                <div class="flex items-center space-x-2 mb-1">
                    <span class="font-medium text-green-800">${item.quantidade}x</span>
                    <span class="text-green-700">${item.nome}</span>
                </div>
                <div class="text-xs text-green-600 space-x-2">
                    <span>Unit: R$ ${item.precoUnitario.toFixed(2).replace('.', ',')}</span>
                    ${temDesconto ? `<span class="line-through text-green-500">R$ ${item.precoOriginalUnitario.toFixed(2).replace('.', ',')}</span>` : ''}
                    ${item.economiaItem > 0 ? `<span class="font-medium">• Economia: R$ ${item.economiaItem.toFixed(2).replace('.', ',')}</span>` : ''}
                </div>
                ${item.promocao ? `<div class="mt-1"><span class="inline-block bg-green-200 text-green-800 text-xs px-2 py-1 rounded">${item.promocao}</span></div>` : ''}
            </div>
            <div class="text-right">
                <div class="font-semibold text-green-800">R$ ${item.subtotalItem.toFixed(2).replace('.', ',')}</div>
            </div>
        `;
        itensDiv.appendChild(itemDiv);
    });
    
    // Criar linha de separação
    const separadorDiv = document.createElement('div');
    separadorDiv.className = 'border-t border-green-300 my-3 pt-3';
    
    // Criar totais detalhados
    const totaisDiv = document.createElement('div');
    totaisDiv.className = 'space-y-2';
    
    // Subtotal
    const subtotalDiv = document.createElement('div');
    subtotalDiv.className = 'flex justify-between text-sm';
    subtotalDiv.innerHTML = `
        <span class="text-green-700">Subtotal:</span>
        <span class="text-green-800">R$ ${resumoPedido.subtotal.toFixed(2).replace('.', ',')}</span>
    `;
    totaisDiv.appendChild(subtotalDiv);
    
    // Desconto (se houver)
    if (resumoPedido.economiaTotal > 0) {
        const descontoDiv = document.createElement('div');
        descontoDiv.className = 'flex justify-between text-sm';
        descontoDiv.innerHTML = `
            <span class="text-green-600 flex items-center">
                <i data-feather="tag" class="w-3 h-3 mr-1"></i>
                Desconto aplicado:
            </span>
            <span class="text-green-600 font-medium">-R$ ${resumoPedido.economiaTotal.toFixed(2).replace('.', ',')}</span>
        `;
        totaisDiv.appendChild(descontoDiv);
    }
    
    // Entrega
    const entregaDiv = document.createElement('div');
    entregaDiv.className = 'flex justify-between text-sm';
    entregaDiv.innerHTML = `
        <span class="text-green-700 flex items-center">
            <i data-feather="truck" class="w-3 h-3 mr-1"></i>
            Taxa de entrega:
        </span>
        <span class="text-green-800 font-medium">${resumoPedido.taxaEntrega === 0 ? 'Grátis' : 'R$ ' + resumoPedido.taxaEntrega.toFixed(2).replace('.', ',')}</span>
    `;
    totaisDiv.appendChild(entregaDiv);
    
    // Total final destacado
    const totalDiv = document.createElement('div');
    totalDiv.className = 'flex justify-between font-bold text-base border-t border-green-400 pt-3 mt-3 bg-green-50 -mx-2 px-2 py-2 rounded';
    totalDiv.innerHTML = `
        <span class="text-green-800">Total Pago:</span>
        <span class="text-green-800 text-lg">R$ ${resumoPedido.total.toFixed(2).replace('.', ',')}</span>
    `;
    totaisDiv.appendChild(totalDiv);
    
    // Informações adicionais
    const infoDiv = document.createElement('div');
    infoDiv.className = 'mt-4 pt-3 border-t border-green-200';
    
    // Data e hora do pedido
    const agora = new Date();
    const dataHora = agora.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    infoDiv.innerHTML = `
        <div class="text-xs text-green-600 space-y-1">
            <div class="flex justify-between">
                <span>Data do pedido:</span>
                <span class="font-medium">${dataHora}</span>
            </div>
            <div class="flex justify-between">
                <span>Método de pagamento:</span>
                <span class="font-medium">PIX</span>
            </div>
            <div class="flex justify-between">
                <span>Status:</span>
                <span class="font-medium text-green-700">Pago ✓</span>
            </div>
        </div>
    `;
    
    // Adicionar tudo ao container
    resumoFinalContainer.appendChild(headerDiv);
    resumoFinalContainer.appendChild(itensDiv);
    resumoFinalContainer.appendChild(separadorDiv);
    resumoFinalContainer.appendChild(totaisDiv);
    resumoFinalContainer.appendChild(infoDiv);
    
    // Atualizar endereço de entrega
    if (enderecoCliente && enderecoEntregaElement) {
        enderecoEntregaElement.textContent = enderecoCliente.enderecoCompleto || 
            `${enderecoCliente.logradouro}, ${enderecoCliente.numero}, ${enderecoCliente.bairro}, ${enderecoCliente.cidade} - ${enderecoCliente.uf}`;
    }
    
    // Gerar protocolo do pedido
    if (protocoloElement) {
        const protocolo = gerarProtocoloPedido();
        protocoloElement.textContent = protocolo;
    }
    
    // Atualizar ícones do Feather
    feather.replace();
}

// Função para gerar protocolo do pedido
function gerarProtocoloPedido() {
    const agora = new Date();
    const timestamp = agora.getTime().toString().slice(-6);
    const prefixo = 'PG'; // Phamella Gourmet
    return `${prefixo}${timestamp}`;
}

// Função para atualizar resumo em tempo real durante modificações
function atualizarResumoTempoReal() {
    // Atualizar resumo no checkout se estiver aberto
    const modalCheckout = document.getElementById('modalCheckout');
    if (modalCheckout && !modalCheckout.classList.contains('hidden')) {
        atualizarResumoCheckout();
    }
    
    // Atualizar modal do carrinho se estiver aberto
    const modalCarrinho = document.getElementById('modalCarrinho');
    if (modalCarrinho && !modalCarrinho.classList.contains('hidden')) {
        atualizarModalCarrinho();
    }
    
    // Atualizar carrinho fixo
    atualizarCarrinho();
    
    // Atualizar qualquer outro resumo visível
    atualizarTodosResumos();
}

// Função para atualizar todos os resumos visíveis
function atualizarTodosResumos() {
    // Verificar se há outros elementos de resumo que precisam ser atualizados
    const resumoElements = document.querySelectorAll('[id*="resumo"], [class*="resumo"]');
    
    resumoElements.forEach(element => {
        if (element.id === 'resumoPedidoCheckout') {
            // Já atualizado pela função atualizarResumoCheckout
            return;
        }
        
        // Atualizar outros elementos de resumo se necessário
        if (element.classList.contains('resumo-tempo-real')) {
            atualizarResumoGenerico(element);
        }
    });
}

// Função genérica para atualizar resumos em elementos específicos
function atualizarResumoGenerico(elemento) {
    if (!elemento || carrinho.length === 0) return;
    
    const resumoPedido = calcularResumoCompleto();
    
    // Atualizar conteúdo básico do resumo
    elemento.innerHTML = `
        <div class="text-sm space-y-1">
            <div class="flex justify-between">
                <span>Itens (${resumoPedido.totalItens}):</span>
                <span>R$ ${resumoPedido.subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
            ${resumoPedido.economiaTotal > 0 ? `
                <div class="flex justify-between text-green-600">
                    <span>Desconto:</span>
                    <span>-R$ ${resumoPedido.economiaTotal.toFixed(2).replace('.', ',')}</span>
                </div>
            ` : ''}
            <div class="flex justify-between">
                <span>Entrega:</span>
                <span class="text-green-600">${resumoPedido.taxaEntrega === 0 ? 'Grátis' : 'R$ ' + resumoPedido.taxaEntrega.toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="flex justify-between font-bold border-t pt-1">
                <span>Total:</span>
                <span>R$ ${resumoPedido.total.toFixed(2).replace('.', ',')}</span>
            </div>
        </div>
    `;
}

// Função para criar resumo compacto do pedido (para uso em diferentes contextos)
function criarResumoCompacto() {
    if (carrinho.length === 0) {
        return '<p class="text-gray-500 text-sm">Nenhum item no carrinho</p>';
    }
    
    const resumoPedido = calcularResumoCompleto();
    
    return `
        <div class="bg-gray-50 rounded-lg p-3 text-sm">
            <div class="flex justify-between items-center mb-2">
                <span class="font-medium text-gray-900">Resumo do Pedido</span>
                <span class="text-xs text-gray-500">${resumoPedido.totalItens} ${resumoPedido.totalItens === 1 ? 'item' : 'itens'}</span>
            </div>
            
            <div class="space-y-1 mb-3">
                ${resumoPedido.itens.slice(0, 3).map(item => `
                    <div class="flex justify-between text-xs">
                        <span class="truncate pr-2">${item.quantidade}x ${item.nome}</span>
                        <span class="flex-shrink-0">R$ ${item.subtotalItem.toFixed(2).replace('.', ',')}</span>
                    </div>
                `).join('')}
                ${resumoPedido.itens.length > 3 ? `
                    <div class="text-xs text-gray-500 text-center">
                        +${resumoPedido.itens.length - 3} ${resumoPedido.itens.length - 3 === 1 ? 'item' : 'itens'} adicional${resumoPedido.itens.length - 3 === 1 ? '' : 'is'}
                    </div>
                ` : ''}
            </div>
            
            <div class="space-y-1 pt-2 border-t border-gray-200">
                <div class="flex justify-between">
                    <span class="text-gray-600">Subtotal:</span>
                    <span>R$ ${resumoPedido.subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                ${resumoPedido.economiaTotal > 0 ? `
                    <div class="flex justify-between text-green-600">
                        <span>Desconto:</span>
                        <span>-R$ ${resumoPedido.economiaTotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                ` : ''}
                <div class="flex justify-between">
                    <span class="text-gray-600">Entrega:</span>
                    <span class="text-green-600">${resumoPedido.taxaEntrega === 0 ? 'Grátis' : 'R$ ' + resumoPedido.taxaEntrega.toFixed(2).replace('.', ',')}</span>
                </div>
                <div class="flex justify-between font-bold text-base border-t border-gray-300 pt-2 mt-2">
                    <span>Total:</span>
                    <span class="text-red-600">R$ ${resumoPedido.total.toFixed(2).replace('.', ',')}</span>
                </div>
            </div>
        </div>
    `;
}

// Função para obter dados do resumo para uso em APIs ou outras integrações
function obterDadosResumo() {
    const resumoPedido = calcularResumoCompleto();
    
    return {
        itens: resumoPedido.itens.map(item => ({
            id: item.id,
            nome: item.nome,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            precoOriginal: item.precoOriginalUnitario,
            subtotal: item.subtotalItem,
            economia: item.economiaItem,
            promocao: item.promocao || null
        })),
        totais: {
            subtotal: resumoPedido.subtotal,
            descontoTotal: resumoPedido.economiaTotal,
            taxaEntrega: resumoPedido.taxaEntrega,
            total: resumoPedido.total,
            totalItens: resumoPedido.totalItens
        },
        entrega: {
            gratuita: resumoPedido.taxaEntrega === 0,
            valor: resumoPedido.taxaEntrega,
            endereco: enderecoCliente
        }
    };
}

// Variáveis do checkout
let etapaAtualCheckout = 1;

// Funções de checkout
function iniciarCheckout() {
    if (carrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }
    
    // Redirecionar para página de checkout
    window.location.href = 'checkout.html';
}

function fecharCheckout() {
    document.getElementById('modalCheckout').classList.add('hidden');
    limparFormularioCheckout();
}

function configurarMascaraTelefone() {
    const inputTelefone = document.getElementById('telefoneCliente');
    inputTelefone.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{2})(\d)/, '($1) $2');
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
        e.target.value = value;
    });
}

function mostrarEtapaCheckout(etapa) {
    // Ocultar todas as etapas
    document.getElementById('checkoutEtapa1').classList.add('hidden');
    document.getElementById('checkoutEtapa2').classList.add('hidden');
    document.getElementById('checkoutEtapa3').classList.add('hidden');
    
    // Mostrar etapa atual
    document.getElementById(`checkoutEtapa${etapa}`).classList.remove('hidden');
    
    // Atualizar indicadores visuais
    atualizarIndicadoresEtapa(etapa);
    
    // Atualizar texto do botão
    const btnProxima = document.getElementById('btnProximaEtapa');
    if (etapa === 1) {
        btnProxima.textContent = 'Continuar';
    } else if (etapa === 2) {
        btnProxima.textContent = 'Finalizar Pedido';
    } else if (etapa === 3) {
        btnProxima.textContent = 'Pagar com PIX';
    }
    
    // Atualizar resumo do pedido para a nova etapa
    atualizarResumoCheckout();
    
    // Atualizar ícones do Feather
    feather.replace();
}

function atualizarIndicadoresEtapa(etapaAtiva) {
    for (let i = 1; i <= 3; i++) {
        const indicador = document.getElementById(`etapa${i}`);
        const circulo = indicador.querySelector('div');
        
        if (i <= etapaAtiva) {
            // Etapa ativa ou concluída
            indicador.classList.remove('opacity-50');
            circulo.classList.remove('bg-gray-300', 'text-gray-600');
            circulo.classList.add('bg-red-600', 'text-white');
        } else {
            // Etapa futura
            indicador.classList.add('opacity-50');
            circulo.classList.remove('bg-red-600', 'text-white');
            circulo.classList.add('bg-gray-300', 'text-gray-600');
        }
    }
}

function proximaEtapaCheckout() {
    if (etapaAtualCheckout === 1) {
        if (validarEtapa1()) {
            salvarDadosEtapa1();
            etapaAtualCheckout = 2;
            mostrarEtapaCheckout(2);
            carregarEnderecoEtapa2();
            // Atualizar resumo após mudança de etapa
            atualizarResumoCheckout();
        }
    } else if (etapaAtualCheckout === 2) {
        if (validarEtapa2()) {
            etapaAtualCheckout = 3;
            mostrarEtapaCheckout(3);
            iniciarPagamentoPix();
            // Atualizar resumo após mudança de etapa
            atualizarResumoCheckout();
        }
    } else if (etapaAtualCheckout === 3) {
        // Processar pagamento
        processarPagamento();
    }
}

function validarEtapa1() {
    const nome = document.getElementById('nomeCliente').value.trim();
    const telefone = document.getElementById('telefoneCliente').value.trim();
    
    let valido = true;
    
    // Validar nome
    if (!nome) {
        mostrarErro('erroNome', 'Nome é obrigatório');
        valido = false;
    } else if (nome.length < 2) {
        mostrarErro('erroNome', 'Nome deve ter pelo menos 2 caracteres');
        valido = false;
    } else {
        ocultarErro('erroNome');
    }
    
    // Validar telefone
    if (!telefone) {
        mostrarErro('erroTelefone', 'Telefone é obrigatório');
        valido = false;
    } else if (!validarFormatoTelefone(telefone)) {
        mostrarErro('erroTelefone', 'Formato de telefone inválido');
        valido = false;
    } else {
        ocultarErro('erroTelefone');
    }
    
    return valido;
}

function validarFormatoTelefone(telefone) {
    const regex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    return regex.test(telefone);
}

function mostrarErro(elementoId, mensagem) {
    const elemento = document.getElementById(elementoId);
    elemento.textContent = mensagem;
    elemento.classList.remove('hidden');
}

function ocultarErro(elementoId) {
    const elemento = document.getElementById(elementoId);
    elemento.classList.add('hidden');
}

function salvarDadosEtapa1() {
    const nome = document.getElementById('nomeCliente').value.trim();
    const telefone = document.getElementById('telefoneCliente').value.trim();
    
    // Gerar email e CPF automaticamente
    const email = 'clienteteste@gmail.com';
    const cpf = gerarCPFValido();
    
    dadosCliente = {
        nome: nome,
        telefone: telefone,
        email: email,
        cpf: cpf
    };
    
    console.log('Dados do cliente salvos:', dadosCliente);
}

function gerarCPFValido() {
    // Função para gerar CPF válido (similar à do PHP)
    let cpf = '';
    for (let i = 0; i < 9; i++) {
        cpf += Math.floor(Math.random() * 10);
    }
    
    // Calcular primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf[i]) * (10 - i);
    }
    let resto = soma % 11;
    let digito1 = resto < 2 ? 0 : 11 - resto;
    cpf += digito1;
    
    // Calcular segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf[i]) * (11 - i);
    }
    resto = soma % 11;
    let digito2 = resto < 2 ? 0 : 11 - resto;
    cpf += digito2;
    
    return cpf;
}

function atualizarResumoCheckout() {
    const resumoContainer = document.getElementById('resumoPedidoCheckout');
    const totalElement = document.getElementById('totalCheckout');
    
    if (!resumoContainer || !totalElement) return;
    
    // Limpar container
    resumoContainer.innerHTML = '';
    
    if (carrinho.length === 0) {
        resumoContainer.innerHTML = '<p class="text-gray-500 text-sm">Nenhum item no carrinho</p>';
        totalElement.textContent = 'R$ 0,00';
        return;
    }
    
    // Calcular valores
    const resumoPedido = calcularResumoCompleto();
    
    // Criar header do resumo
    const headerSection = document.createElement('div');
    headerSection.className = 'mb-3 pb-2 border-b border-gray-100';
    headerSection.innerHTML = `
        <div class="flex items-center justify-between">
            <h6 class="font-medium text-gray-900 text-sm">Itens do Pedido</h6>
            <span class="text-xs text-gray-500">${resumoPedido.totalItens} ${resumoPedido.totalItens === 1 ? 'item' : 'itens'}</span>
        </div>
    `;
    
    // Criar seção de itens
    const itensSection = document.createElement('div');
    itensSection.className = 'space-y-3 mb-4';
    
    // Adicionar cada item com mais detalhes
    resumoPedido.itens.forEach(item => {
        const temDesconto = item.precoOriginal && item.precoPromocional;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'bg-gray-50 rounded-lg p-3';
        
        itemElement.innerHTML = `
            <div class="flex items-start space-x-3">
                <img src="${item.imagem}" alt="${item.nome}" class="w-12 h-12 rounded-lg object-cover flex-shrink-0">
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start mb-1">
                        <h6 class="font-medium text-gray-900 text-sm truncate pr-2">${item.nome}</h6>
                        <div class="text-right flex-shrink-0">
                            <div class="font-semibold text-gray-900 text-sm">R$ ${item.subtotalItem.toFixed(2).replace('.', ',')}</div>
                            ${temDesconto ? `<div class="text-xs text-gray-500 line-through">R$ ${(item.precoOriginalUnitario * item.quantidade).toFixed(2).replace('.', ',')}</div>` : ''}
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center text-xs text-gray-600">
                        <div class="flex items-center space-x-2">
                            <span>Qtd: ${item.quantidade}</span>
                            <span>•</span>
                            <span>Unit: R$ ${item.precoUnitario.toFixed(2).replace('.', ',')}</span>
                        </div>
                        ${item.economiaItem > 0 ? `<span class="text-green-600 font-medium">Economia: R$ ${item.economiaItem.toFixed(2).replace('.', ',')}</span>` : ''}
                    </div>
                    
                    ${item.promocao ? `<div class="mt-1"><span class="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">${item.promocao}</span></div>` : ''}
                </div>
            </div>
        `;
        
        itensSection.appendChild(itemElement);
    });
    
    // Criar seção de totais
    const totaisSection = document.createElement('div');
    totaisSection.className = 'space-y-2 pt-3 border-t border-gray-200';
    
    // Subtotal
    const subtotalElement = document.createElement('div');
    subtotalElement.className = 'flex justify-between text-sm';
    subtotalElement.innerHTML = `
        <span class="text-gray-600">Subtotal</span>
        <span class="text-gray-900">R$ ${resumoPedido.subtotal.toFixed(2).replace('.', ',')}</span>
    `;
    totaisSection.appendChild(subtotalElement);
    
    // Desconto total (se houver)
    if (resumoPedido.economiaTotal > 0) {
        const descontoElement = document.createElement('div');
        descontoElement.className = 'flex justify-between text-sm';
        descontoElement.innerHTML = `
            <span class="text-green-600 flex items-center">
                <i data-feather="tag" class="w-3 h-3 mr-1"></i>
                Desconto aplicado
            </span>
            <span class="text-green-600 font-medium">-R$ ${resumoPedido.economiaTotal.toFixed(2).replace('.', ',')}</span>
        `;
        totaisSection.appendChild(descontoElement);
    }
    
    // Taxa de entrega
    const entregaElement = document.createElement('div');
    entregaElement.className = 'flex justify-between text-sm';
    entregaElement.innerHTML = `
        <span class="text-gray-600 flex items-center">
            <i data-feather="truck" class="w-3 h-3 mr-1"></i>
            Taxa de entrega
        </span>
        <span class="text-green-600 font-medium">${resumoPedido.taxaEntrega === 0 ? 'Grátis' : 'R$ ' + resumoPedido.taxaEntrega.toFixed(2).replace('.', ',')}</span>
    `;
    totaisSection.appendChild(entregaElement);
    
    // Informação de entrega grátis
    if (resumoPedido.taxaEntrega === 0) {
        const infoEntregaElement = document.createElement('div');
        infoEntregaElement.className = 'bg-green-50 border border-green-200 rounded-lg p-2 mt-2';
        infoEntregaElement.innerHTML = `
            <div class="flex items-center text-xs text-green-700">
                <i data-feather="check-circle" class="w-3 h-3 mr-1"></i>
                <span>Parabéns! Você ganhou frete grátis</span>
            </div>
        `;
        totaisSection.appendChild(infoEntregaElement);
    }
    
    // Total final
    const totalFinalElement = document.createElement('div');
    totalFinalElement.className = 'flex justify-between text-base font-bold pt-3 border-t border-gray-300 mt-3';
    totalFinalElement.innerHTML = `
        <span class="text-gray-900">Total a Pagar</span>
        <span class="text-red-600">R$ ${resumoPedido.total.toFixed(2).replace('.', ',')}</span>
    `;
    totaisSection.appendChild(totalFinalElement);
    
    // Adicionar seções ao container
    resumoContainer.appendChild(headerSection);
    resumoContainer.appendChild(itensSection);
    resumoContainer.appendChild(totaisSection);
    
    // Atualizar total no elemento principal
    totalElement.textContent = `R$ ${resumoPedido.total.toFixed(2).replace('.', ',')}`;
    
    // Atualizar ícones do Feather
    feather.replace();
}

// Função auxiliar para calcular resumo completo do pedido
function calcularResumoCompleto() {
    let subtotalOriginal = 0;
    let subtotalFinal = 0;
    let descontoTotal = 0;
    let totalItens = 0;
    let economiaTotal = 0;
    
    carrinho.forEach(item => {
        const precoOriginal = item.precoOriginal || item.preco;
        const precoFinal = item.precoPromocional || item.preco;
        const quantidade = item.quantidade;
        
        subtotalOriginal += precoOriginal * quantidade;
        subtotalFinal += precoFinal * quantidade;
        totalItens += quantidade;
        
        // Calcular economia individual do item
        if (item.precoOriginal && item.precoPromocional) {
            economiaTotal += (item.precoOriginal - item.precoPromocional) * quantidade;
        }
    });
    
    descontoTotal = subtotalOriginal - subtotalFinal;
    const taxaEntrega = taxaEntregaSelecionada || 0; // Entrega grátis por padrão
    const total = subtotalFinal + taxaEntrega;
    
    return {
        subtotal: subtotalFinal,
        subtotalOriginal: subtotalOriginal,
        descontoTotal: descontoTotal,
        economiaTotal: economiaTotal,
        taxaEntrega: taxaEntrega,
        total: total,
        totalItens: totalItens,
        itens: carrinho.map(item => ({
            ...item,
            precoUnitario: item.precoPromocional || item.preco,
            precoOriginalUnitario: item.precoOriginal || item.preco,
            subtotalItem: (item.precoPromocional || item.preco) * item.quantidade,
            economiaItem: item.precoOriginal && item.precoPromocional ? 
                (item.precoOriginal - item.precoPromocional) * item.quantidade : 0
        }))
    };
}

function voltarParaCarrinho() {
    fecharCheckout();
    abrirCheckout();
}

function limparFormularioCheckout() {
    document.getElementById('nomeCliente').value = '';
    document.getElementById('telefoneCliente').value = '';
    ocultarErro('erroNome');
    ocultarErro('erroTelefone');
    etapaAtualCheckout = 1;
}

// Funções da Etapa 2 - Endereço
function carregarEnderecoEtapa2() {
    const enderecoSalvoDiv = document.getElementById('enderecoSalvo');
    const semEnderecoDiv = document.getElementById('semEndereco');
    
    if (enderecoCliente) {
        // Mostrar endereço salvo
        enderecoSalvoDiv.innerHTML = `
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex items-start">
                    <i data-feather="check-circle" class="w-5 h-5 text-green-600 mt-0.5 mr-3"></i>
                    <div class="flex-1">
                        <h5 class="font-semibold text-green-800 mb-2">Endereço Confirmado</h5>
                        <p class="text-sm text-green-700">
                            ${enderecoCliente.logradouro}, ${enderecoCliente.numero}<br>
                            ${enderecoCliente.bairro}<br>
                            ${enderecoCliente.cidade} - ${enderecoCliente.uf}<br>
                            CEP: ${enderecoCliente.cep}
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                <div class="flex items-center">
                    <i data-feather="truck" class="w-4 h-4 text-blue-600 mr-2"></i>
                    <span class="text-sm text-blue-800">Entrega grátis • Tempo estimado: 30-45 min</span>
                </div>
            </div>
        `;
        
        enderecoSalvoDiv.classList.remove('hidden');
        semEnderecoDiv.classList.add('hidden');
    } else {
        // Mostrar que não há endereço
        enderecoSalvoDiv.classList.add('hidden');
        semEnderecoDiv.classList.remove('hidden');
    }
    
    feather.replace();
}

function validarEtapa2() {
    if (!enderecoCliente) {
        alert('Por favor, informe seu endereço de entrega.');
        return false;
    }
    
    // Validar se o endereço tem todos os campos necessários
    const camposObrigatorios = ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'uf'];
    for (let campo of camposObrigatorios) {
        if (!enderecoCliente[campo]) {
            alert('Endereço incompleto. Por favor, informe um endereço válido.');
            return false;
        }
    }
    
    return true;
}

function alterarEndereco() {
    // Limpar endereço atual
    enderecoCliente = null;
    localStorage.removeItem('endereco_cliente');
    
    // Fechar checkout
    fecharCheckout();
    
    // Mostrar modal de CEP
    document.getElementById('modalCEP').classList.remove('hidden');
    
    // Limpar campo de CEP
    document.getElementById('inputCEP').value = '';
}

function solicitarNovoEndereco() {
    alterarEndereco();
}

// Função para ser chamada quando um novo endereço é salvo
function onNovoEnderecoSalvo() {
    // Esta função será chamada quando o usuário salvar um novo endereço
    // Verificar se estamos no checkout
    const modalCheckout = document.getElementById('modalCheckout');
    if (modalCheckout && !modalCheckout.classList.contains('hidden') && etapaAtualCheckout === 2) {
        // Recarregar a etapa 2 com o novo endereço
        carregarEnderecoEtapa2();
    }
}

// Variáveis do pagamento PIX
let transacaoAtual = null;
let intervalVerificacao = null;

// Função de teste para verificar conectividade
async function testarConectividade() {
    try {
        console.log('Testando conectividade com o servidor...');
        const response = await fetch('./checkout/teste-simples.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ teste: 'conectividade' })
        });
        
        const resultado = await response.json();
        console.log('Teste de conectividade:', resultado);
        return resultado.success;
    } catch (error) {
        console.error('Erro no teste de conectividade:', error);
        return false;
    }
}

// Funções da Etapa 3 - Pagamento PIX
async function iniciarPagamentoPix() {
    // Mostrar estado de carregamento
    document.getElementById('gerandoPix').classList.remove('hidden');
    document.getElementById('pixGerado').classList.add('hidden');
    document.getElementById('pagamentoConfirmado').classList.add('hidden');
    
    try {
        // Primeiro, testar conectividade
        const conectividadeOk = await testarConectividade();
        if (!conectividadeOk) {
            throw new Error('Não foi possível conectar com o servidor. Verifique se o servidor está rodando.');
        }
        // Capturar parâmetros UTM da URL
        const utmParams = capturarParametrosUTM();
        
        // Preparar dados para o pagamento
        const dadosPagamento = {
            cliente: dadosCliente,
            endereco: enderecoCliente,
            pedido: obterResumoCarrinho(),
            utmParams: utmParams
        };
        
        console.log('Iniciando pagamento PIX com dados:', dadosPagamento);
        
        // Preparar dados para envio
        const dadosEnvio = {
            nome: dadosCliente.nome,
            telefone: dadosCliente.telefone,
            email: dadosCliente.email,
            cpf: dadosCliente.cpf,
            endereco: enderecoCliente,
            valor: Math.round(calcularTotalCarrinho() * 100), // Converter para centavos
            itens: carrinho,
            ...utmParams
        };
        
        console.log('Dados sendo enviados para pagamento.php:', dadosEnvio);
        
        // Chamar API de pagamento
        const response = await fetch('./checkout/pagamento.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dadosEnvio)
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        let resultado;
        try {
            resultado = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Erro ao fazer parse da resposta:', parseError);
            throw new Error('Resposta inválida do servidor: ' + responseText);
        }
        
        if (resultado.success) {
            transacaoAtual = {
                id: resultado.token,
                pixCode: resultado.pixCode,
                qrCodeUrl: resultado.qrCodeUrl,
                valor: resultado.valor
            };
            
            exibirPixGerado(resultado);
            iniciarVerificacaoPagamento();
        } else {
            throw new Error(resultado.message || 'Erro ao gerar PIX');
        }
        
    } catch (error) {
        console.error('Erro ao gerar PIX:', error);
        alert('Erro ao gerar PIX. Tente novamente.');
        
        // Voltar para etapa anterior
        etapaAtualCheckout = 2;
        mostrarEtapaCheckout(2);
    }
}

function capturarParametrosUTM() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        utm_source: urlParams.get('utm_source') || '',
        utm_medium: urlParams.get('utm_medium') || '',
        utm_campaign: urlParams.get('utm_campaign') || '',
        utm_content: urlParams.get('utm_content') || '',
        utm_term: urlParams.get('utm_term') || '',
        xcod: urlParams.get('xcod') || '',
        sck: urlParams.get('sck') || ''
    };
}

function exibirPixGerado(dadosPix) {
    // Ocultar loading
    document.getElementById('gerandoPix').classList.add('hidden');
    
    // Exibir PIX gerado
    document.getElementById('pixGerado').classList.remove('hidden');
    
    // Configurar QR Code
    if (dadosPix.qrCodeUrl) {
        document.getElementById('qrCodeImage').src = dadosPix.qrCodeUrl;
    }
    
    // Configurar código PIX
    document.getElementById('codigoPix').value = dadosPix.pixCode || '';
    
    // Atualizar ícones
    feather.replace();
}

function copiarCodigoPix() {
    const codigoPix = document.getElementById('codigoPix').value;
    
    if (codigoPix) {
        navigator.clipboard.writeText(codigoPix).then(() => {
            mostrarNotificacaoCopiado();
        }).catch(() => {
            // Fallback para navegadores mais antigos
            const input = document.getElementById('codigoPix');
            input.select();
            document.execCommand('copy');
            mostrarNotificacaoCopiado();
        });
    }
}

function mostrarNotificacaoCopiado() {
    const notificacao = document.createElement('div');
    notificacao.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    notificacao.innerHTML = `
        <div class="flex items-center">
            <i data-feather="check" class="w-4 h-4 mr-2"></i>
            <span>Código PIX copiado!</span>
        </div>
    `;
    
    document.body.appendChild(notificacao);
    feather.replace();
    
    setTimeout(() => {
        notificacao.classList.remove('translate-x-full');
    }, 100);
    
    setTimeout(() => {
        notificacao.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(notificacao);
        }, 300);
    }, 3000);
}

function iniciarVerificacaoPagamento() {
    if (!transacaoAtual) return;
    
    // Verificar status a cada 3 segundos
    intervalVerificacao = setInterval(async () => {
        try {
            const response = await fetch(`./api/checkout/verificar.js?id=${transacaoAtual.id}`);
            const resultado = await response.json();
            
            if (resultado.success) {
                if (resultado.status === 'paid' || resultado.status === 'PAID' || 
                    resultado.status === 'approved' || resultado.status === 'APPROVED') {
                    
                    // Pagamento confirmado
                    clearInterval(intervalVerificacao);
                    exibirPagamentoConfirmado(resultado);
                }
            }
        } catch (error) {
            console.error('Erro ao verificar pagamento:', error);
        }
    }, 3000);
}

function exibirPagamentoConfirmado(dadosPagamento) {
    // Ocultar PIX gerado
    document.getElementById('pixGerado').classList.add('hidden');
    
    // Mostrar confirmação
    document.getElementById('pagamentoConfirmado').classList.remove('hidden');
    
    // Exibir resumo final do pedido
    exibirResumoFinalPedido();
    
    // Gerar protocolo do pedido
    const protocolo = `PED-${Date.now().toString().slice(-6)}`;
    document.getElementById('protocoloPedido').textContent = protocolo;
    
    // Atualizar resumo do checkout uma última vez
    atualizarResumoCheckout();
    
    // Limpar carrinho após um tempo
    setTimeout(() => {
        limparCarrinho();
    }, 10000); // Aumentado para 10 segundos para dar tempo de ver o resumo
    
    // Atualizar botão
    const btnProxima = document.getElementById('btnProximaEtapa');
    btnProxima.textContent = 'Fechar';
    btnProxima.onclick = () => {
        fecharCheckout();
        // Opcional: redirecionar para página de acompanhamento
    };
    
    feather.replace();
}

function processarPagamento() {
    // Esta função agora é chamada quando o usuário clica em "Pagar com PIX"
    // Mas o pagamento já foi iniciado automaticamente
    console.log('Pagamento já foi iniciado automaticamente');
}

// Limpar intervalo quando o checkout for fechado
const fecharCheckoutOriginal = fecharCheckout;
fecharCheckout = function() {
    if (intervalVerificacao) {
        clearInterval(intervalVerificacao);
        intervalVerificacao = null;
    }
    
    fecharCheckoutOriginal();
};

// Funções auxiliares
function formatarPreco(preco) {
    return `R$ ${preco.toFixed(2).replace('.', ',')}`;
}

function mascaraTelefone(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/(\d{2})(\d)/, '($1) $2');
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
    input.value = value;
}

function mascaraCep(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
    input.value = value;
}