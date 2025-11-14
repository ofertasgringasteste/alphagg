// JavaScript para a página de checkout
let etapaAtualCheckoutPage = 1;
let intervalVerificacaoPage = null;

document.addEventListener('DOMContentLoaded', function () {
    feather.replace();
    
    // Garantir que o carrinho seja carregado corretamente do localStorage
    const carrinhoSalvo = localStorage.getItem('carrinho_produtos');
    if (carrinhoSalvo) {
        try {
            carrinho = JSON.parse(carrinhoSalvo);
        } catch (error) {
            console.error('Erro ao carregar carrinho do cache:', error);
            carrinho = [];
        }
    }

    // Verificar se há itens no carrinho
    if (!carrinho || carrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        window.location.href = 'carrinho.html';
        return;
    }

    inicializarCheckoutPage();
});

// Função para inicializar a página de checkout
function inicializarCheckoutPage() {
    etapaAtualCheckoutPage = 1;
    mostrarEtapaCheckoutPage(1);
    configurarMascaraTelefonePage();
    atualizarResumoCheckoutPage();

    // Focar no primeiro campo
    setTimeout(() => {
        document.getElementById('nomeClientePage').focus();
    }, 100);
}

// Função para mostrar etapa específica
function mostrarEtapaCheckoutPage(etapa) {
    // Ocultar todas as etapas
    document.getElementById('checkoutEtapa1Page').classList.add('hidden');
    document.getElementById('checkoutEtapa2Page').classList.add('hidden');
    document.getElementById('checkoutEtapa3Page').classList.add('hidden');

    // Mostrar etapa atual
    document.getElementById(`checkoutEtapa${etapa}Page`).classList.remove('hidden');

    // Atualizar indicadores visuais
    atualizarIndicadoresEtapaPage(etapa);

    // Atualizar texto do botão
    const btnProxima = document.getElementById('btnProximaEtapaPage');
    const textoBotao = document.getElementById('textoBotaoEtapa');

    if (etapa === 1) {
        textoBotao.textContent = 'Continuar';
        btnProxima.onclick = () => proximaEtapaCheckoutPage();
    } else if (etapa === 2) {
        textoBotao.textContent = 'Finalizar Pedido';
        btnProxima.onclick = () => proximaEtapaCheckoutPage();
    } else if (etapa === 3) {
        textoBotao.textContent = 'Aguardando Pagamento...';
        btnProxima.disabled = true;
        btnProxima.classList.add('opacity-50', 'cursor-not-allowed');
    }

    // Atualizar resumo
    atualizarResumoCheckoutPage();

    feather.replace();
}

// Função para atualizar indicadores de etapa
function atualizarIndicadoresEtapaPage(etapaAtiva) {
    for (let i = 1; i <= 3; i++) {
        const indicador = document.getElementById(`etapa${i}Indicator`);
        const circulo = indicador.querySelector('div');
        const texto = indicador.querySelector('span');

        if (i <= etapaAtiva) {
            // Etapa ativa ou concluída
            indicador.classList.remove('opacity-50');
            circulo.classList.remove('bg-gray-300', 'text-gray-600');
            circulo.classList.add('bg-red-600', 'text-white');
            texto.classList.remove('text-gray-600');
            texto.classList.add('text-gray-900', 'font-medium');
        } else {
            // Etapa futura
            indicador.classList.add('opacity-50');
            circulo.classList.remove('bg-red-600', 'text-white');
            circulo.classList.add('bg-gray-300', 'text-gray-600');
            texto.classList.remove('text-gray-900', 'font-medium');
            texto.classList.add('text-gray-600');
        }
    }
}

// Função para avançar para próxima etapa
function proximaEtapaCheckoutPage() {
    if (etapaAtualCheckoutPage === 1) {
        if (validarEtapa1Page()) {
            salvarDadosEtapa1Page();
            etapaAtualCheckoutPage = 2;
            mostrarEtapaCheckoutPage(2);
            carregarEnderecoEtapa2Page();
        }
    } else if (etapaAtualCheckoutPage === 2) {
        if (validarEtapa2Page()) {
            etapaAtualCheckoutPage = 3;
            mostrarEtapaCheckoutPage(3);
            iniciarPagamentoPixPage();
        }
    }
}

// Função para configurar máscara de telefone
function configurarMascaraTelefonePage() {
    const inputTelefone = document.getElementById('telefoneClientePage');
    inputTelefone.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{2})(\d)/, '($1) $2');
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
        e.target.value = value;
    });
}

// Função para validar etapa 1
function validarEtapa1Page() {
    const nome = document.getElementById('nomeClientePage').value.trim();
    const telefone = document.getElementById('telefoneClientePage').value.trim();

    let valido = true;

    // Validar nome
    if (!nome) {
        mostrarErroPage('erroNomePage', 'Nome é obrigatório');
        valido = false;
    } else if (nome.length < 2) {
        mostrarErroPage('erroNomePage', 'Nome deve ter pelo menos 2 caracteres');
        valido = false;
    } else {
        ocultarErroPage('erroNomePage');
    }

    // Validar telefone
    if (!telefone) {
        mostrarErroPage('erroTelefonePage', 'Telefone é obrigatório');
        valido = false;
    } else if (telefone.length < 14) {
        mostrarErroPage('erroTelefonePage', 'Telefone deve estar completo');
        valido = false;
    } else {
        ocultarErroPage('erroTelefonePage');
    }

    return valido;
}

// Função para salvar dados da etapa 1
function salvarDadosEtapa1Page() {
    dadosCliente = {
        nome: document.getElementById('nomeClientePage').value.trim(),
        telefone: document.getElementById('telefoneClientePage').value.trim(),
        email: 'clienteteste@gmail.com', // Necessário para a API PIX
        cpf: gerarCPF() // Necessário para a API PIX
    };
}

// Função para gerar CPF válido para API PIX
function gerarCPF() {
    // Gera um CPF aleatório válido para testes
    const n = 9;
    const n1 = Math.floor(Math.random() * n);
    const n2 = Math.floor(Math.random() * n);
    const n3 = Math.floor(Math.random() * n);
    const n4 = Math.floor(Math.random() * n);
    const n5 = Math.floor(Math.random() * n);
    const n6 = Math.floor(Math.random() * n);
    const n7 = Math.floor(Math.random() * n);
    const n8 = Math.floor(Math.random() * n);
    const n9 = Math.floor(Math.random() * n);
    
    let d1 = n9 * 2 + n8 * 3 + n7 * 4 + n6 * 5 + n5 * 6 + n4 * 7 + n3 * 8 + n2 * 9 + n1 * 10;
    d1 = 11 - (d1 % 11);
    if (d1 >= 10) d1 = 0;
    
    let d2 = d1 * 2 + n9 * 3 + n8 * 4 + n7 * 5 + n6 * 6 + n5 * 7 + n4 * 8 + n3 * 9 + n2 * 10 + n1 * 11;
    d2 = 11 - (d2 % 11);
    if (d2 >= 10) d2 = 0;
    
    return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}${n9}${d1}${d2}`;
}

// Função para carregar endereço na etapa 2
function carregarEnderecoEtapa2Page() {
    const enderecoSalvoDiv = document.getElementById('enderecoSalvoPage');
    const semEnderecoDiv = document.getElementById('semEnderecoPage');

    if (enderecoCliente) {
        enderecoSalvoDiv.innerHTML = `
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex items-start">
                    <i data-feather="check-circle" class="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0"></i>
                    <div class="flex-1">
                        <h5 class="font-semibold text-green-800 mb-2">Endereço Confirmado</h5>
                        <div class="text-sm text-green-700 space-y-1">
                            <p><strong>${enderecoCliente.logradouro}, ${enderecoCliente.numero}</strong></p>
                            <p>${enderecoCliente.bairro}</p>
                            <p>${enderecoCliente.cidade} - ${enderecoCliente.uf}</p>
                            <p>CEP: ${enderecoCliente.cep}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        enderecoSalvoDiv.classList.remove('hidden');
        semEnderecoDiv.classList.add('hidden');
    } else {
        enderecoSalvoDiv.classList.add('hidden');
        semEnderecoDiv.classList.remove('hidden');
    }

    feather.replace();
}

// Função para validar etapa 2
function validarEtapa2Page() {
    if (!enderecoCliente) {
        alert('Por favor, informe seu endereço de entrega');
        return false;
    }
    return true;
}

// Função para iniciar pagamento PIX
async function iniciarPagamentoPixPage() {
    // Mostrar indicador de carregamento
    document.getElementById('gerandoPixPage').classList.remove('hidden');
    document.getElementById('pixGeradoPage').classList.add('hidden');
    document.getElementById('pagamentoConfirmadoPage').classList.add('hidden');
    
    // Facebook Pixel - AddPaymentInfo Event
    if (window.facebookPixel) {
        const totalValue = calcularResumoCompleto().total;
        window.facebookPixel.trackAddPaymentInfo({
            value: totalValue,
            currency: 'BRL'
        });
    }
    
    try {
        console.log("Iniciando pagamento PIX...");
        
        // Garantir que temos os dados do cliente
        if (!dadosCliente || !dadosCliente.nome || !dadosCliente.email) {
            throw new Error("Dados do cliente incompletos");
        }
        
        // Verificar se o carrinho tem itens
        if (!carrinho || carrinho.length === 0) {
            throw new Error("Carrinho vazio");
        }
        
        // Preparar dados para o pagamento
        const dadosPagamento = {
            cliente: dadosCliente,
            endereco: enderecoCliente,
            itens: carrinho,
            resumo: calcularResumoCompleto(),
            valor: calcularResumoCompleto().total * 100, // Valor em centavos
            nome: dadosCliente.nome,
            telefone: dadosCliente.telefone,
            email: dadosCliente.email,
            cpf: dadosCliente.cpf,
            utmParams: capturarParametrosUTM()
        };

        console.log("Enviando dados para API PIX:", dadosPagamento);
        
        // Determinar caminho correto para o endpoint (Abyssal Pay)
        const apiUrl = window.location.pathname.includes('/checkout.html') ? 
            'api/checkout/abyssalpay-pagamento.js' : 
            'api/checkout/abyssalpay-pagamento.js';

        console.log("Fazendo requisição para Abyssal Pay:", apiUrl);
        
        // Fazer a requisição para a API Abyssal Pay
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dadosPagamento)
            });

            if (!response.ok) {
                console.error("Resposta não-ok da API:", response.status, response.statusText);
                throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
            }

            const resposta = await response.json();
            console.log("Resposta da API PIX:", resposta);

            if (resposta.success) {
                exibirPixGeradoPage(resposta);
                iniciarVerificacaoPagamentoPage(resposta.transactionId || resposta.token);
            } else {
                throw new Error(resposta.message || 'Erro ao gerar PIX');
            }
        } catch (fetchError) {
            console.error("Erro na requisição fetch:", fetchError);
            
            try {
                // Tentar rota alternativa (fallback para API antiga se necessário)
                console.log("Tentando rota alternativa...");
                const alternativeResponse = await fetch('../api/checkout/abyssalpay-pagamento.js', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dadosPagamento)
                });
                
                if (!alternativeResponse.ok) {
                    throw new Error(`Erro na API alternativa: ${alternativeResponse.status}`);
                }
                
                const alternativeData = await alternativeResponse.json();
                console.log("Resposta da API alternativa:", alternativeData);
                
                if (alternativeData.success) {
                    exibirPixGeradoPage(alternativeData);
                    iniciarVerificacaoPagamentoPage(alternativeData.transactionId || alternativeData.token);
                } else {
                    throw new Error(alternativeData.message || 'Erro ao gerar PIX (rota alternativa)');
                }
            } catch (alternativeError) {
                console.error("Erro na rota alternativa:", alternativeError);
                throw new Error("Erro ao gerar PIX: " + alternativeError.message);
            }
        }
    } catch (error) {
        console.error('Erro ao gerar PIX:', error);
        alert('Erro ao gerar PIX. Tente novamente: ' + error.message);

        // Voltar para etapa anterior
        etapaAtualCheckoutPage = 2;
        mostrarEtapaCheckoutPage(2);
    }
}

// Função para exibir PIX gerado
function exibirPixGeradoPage(dadosPix) {
    document.getElementById('gerandoPixPage').classList.add('hidden');
    document.getElementById('pixGeradoPage').classList.remove('hidden');

    console.log("Exibindo dados PIX:", dadosPix);

    // Preencher dados do PIX
    const qrCodeImage = document.getElementById('qrCodeImagePage');
    const codigoPixInput = document.getElementById('codigoPixPage');
    
    if (dadosPix.qrCodeUrl) {
        qrCodeImage.src = dadosPix.qrCodeUrl;
        qrCodeImage.style.width = '200px';
        qrCodeImage.style.height = '200px';
        qrCodeImage.style.display = 'block';
        qrCodeImage.style.margin = '0 auto';
        qrCodeImage.style.border = '1px solid #eee';
        qrCodeImage.style.padding = '10px';
        qrCodeImage.style.backgroundColor = '#fff';
        qrCodeImage.style.borderRadius = '8px';
        qrCodeImage.onerror = function() {
            console.error("Erro ao carregar imagem QR code");
            // Usar QR Code Generator via API do QR Server
            const pixCode = dadosPix.pixCode || dadosPix.code || 
                            (dadosPix.pix && dadosPix.pix.qrcode) || 
                            dadosPix.qrcode || '';
            if (pixCode) {
                this.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(pixCode)}`;
            }
        };
    } else if (dadosPix.pixCode) {
        // Se não tiver imagem QR Code mas tiver o código PIX, gerar QR code com QR Server
        qrCodeImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(dadosPix.pixCode)}`;
        qrCodeImage.style.width = '150px';
        qrCodeImage.style.height = '150px';
        qrCodeImage.style.display = 'block';
        qrCodeImage.style.margin = '0 auto';
        qrCodeImage.style.border = '1px solid #eee';
        qrCodeImage.style.padding = '10px';
        qrCodeImage.style.backgroundColor = '#fff';
        qrCodeImage.style.borderRadius = '8px';
    }
    
    // O código PIX pode estar em campos diferentes dependendo da API
    const pixCode = dadosPix.pixCode || dadosPix.code || 
                   (dadosPix.pix && dadosPix.pix.qrcode) || 
                   dadosPix.qrcode || '';
    if (pixCode) {
        codigoPixInput.value = pixCode;
    } else {
        console.error("Código PIX não encontrado na resposta", dadosPix);
        codigoPixInput.value = "Erro ao gerar código PIX";
    }

    feather.replace();
}

// Função para copiar código PIX
function copiarCodigoPixPage() {
    const codigoPix = document.getElementById('codigoPixPage');
    codigoPix.select();
    document.execCommand('copy');

    // Feedback visual
    const feedback = document.createElement('div');
    feedback.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    feedback.innerHTML = `
        <div class="flex items-center">
            <i data-feather="check" class="w-4 h-4 mr-2"></i>
            <span>Código PIX copiado!</span>
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

// Função para iniciar verificação de pagamento
function iniciarVerificacaoPagamentoPage(transactionId) {
    let tentativas = 0;
    const maxTentativas = 60; // 5 minutos (5 segundos * 60)

    console.log(`Iniciando verificação do pagamento: ${transactionId}`);
    
    intervalVerificacaoPage = setInterval(async () => {
        tentativas++;
        console.log(`Verificando pagamento (tentativa ${tentativas}/${maxTentativas})`);

        try {
            // Fazer chamada real para API de verificação
            const response = await fetch(`api/checkout/verificar.js?id=${transactionId}`);
            if (!response.ok) {
                throw new Error(`Erro na API de verificação: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`Status do pagamento: ${data.status}`, data);
            
            // Atualizar status na interface
            const statusElement = document.getElementById('statusPagamentoPage');
            
            if (data.status === 'paid' || data.status === 'approved' || data.status === 'completed') {
                // Pagamento aprovado
                clearInterval(intervalVerificacaoPage);
                exibirPagamentoConfirmadoPage({
                    transactionId: transactionId,
                    status: 'paid',
                    paidAt: new Date().toISOString()
                });
            } 
            else if (data.status === 'pending' || data.status === 'waiting_payment') {
                // Ainda aguardando pagamento
                statusElement.innerHTML = `
                    <div class="flex items-center">
                        <div class="animate-pulse w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                        <span class="text-sm font-medium text-yellow-800">Aguardando pagamento... (${tentativas})</span>
                    </div>
                `;
            } 
            else if (data.status === 'error' || data.status === 'failed' || data.status === 'canceled' || data.status === 'refunded') {
                // Pagamento falhou
                clearInterval(intervalVerificacaoPage);
                statusElement.innerHTML = `
                    <div class="flex items-center">
                        <div class="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                        <span class="text-sm font-medium text-red-800">Pagamento falhou: ${data.message || 'Erro desconhecido'}</span>
                    </div>
                `;
                
                // Não voltamos para etapa anterior automaticamente para o usuário poder ver a mensagem
            }
            
            // Verificar timeout
            if (tentativas >= maxTentativas) {
                clearInterval(intervalVerificacaoPage);
                alert('Tempo limite para pagamento excedido. Você pode tentar escanear o código novamente ou iniciar um novo pedido.');
            }

        } catch (error) {
            console.error('Erro ao verificar pagamento:', error);
            
            // Se houver muitos erros consecutivos, podemos parar de verificar
            if (tentativas >= 10) {
                clearInterval(intervalVerificacaoPage);
                alert('Não foi possível verificar o status do pagamento. Por favor, atualize a página ou entre em contato com o suporte.');
            }
        }
    }, 5000); // Verificar a cada 5 segundos
}

// Função para exibir pagamento confirmado
function exibirPagamentoConfirmadoPage(dadosPagamento) {
    document.getElementById('pixGeradoPage').classList.add('hidden');
    document.getElementById('pagamentoConfirmadoPage').classList.remove('hidden');

    // Exibir resumo final
    exibirResumoFinalPedidoPage();

    // Gerar protocolo
    const protocolo = `PG${Date.now().toString().slice(-6)}`;
    document.getElementById('protocoloPedidoPage').textContent = protocolo;

    // Atualizar endereço de entrega
    if (enderecoCliente) {
        document.getElementById('enderecoEntregaPage').textContent =
            `${enderecoCliente.logradouro}, ${enderecoCliente.numero}, ${enderecoCliente.bairro}, ${enderecoCliente.cidade} - ${enderecoCliente.uf}`;
    }

    // Atualizar botão
    const btnProxima = document.getElementById('btnProximaEtapaPage');
    const textoBotao = document.getElementById('textoBotaoEtapa');
    textoBotao.textContent = 'Finalizar';
    btnProxima.disabled = false;
    btnProxima.classList.remove('opacity-50', 'cursor-not-allowed');
    btnProxima.onclick = () => {
        // Limpar carrinho e ir para página de agradecimento
        limparCarrinho();
        window.location.href = 'thankyou.html';
    };

    feather.replace();
}

// Função para exibir resumo final do pedido
function exibirResumoFinalPedidoPage() {
    const resumoContainer = document.getElementById('resumoFinalPedidoPage');
    const resumoPedido = calcularResumoCompleto();

    resumoContainer.innerHTML = `
        <div class="space-y-3">
            <div class="space-y-2">
                ${resumoPedido.itens.map(item => `
                    <div class="flex justify-between items-center py-1 border-b border-green-100 last:border-b-0">
                        <div class="flex-1">
                            <div class="flex items-center space-x-2 mb-1">
                                <span class="font-medium text-green-800">${item.quantidade}x</span>
                                <span class="text-green-700">${item.nome}</span>
                            </div>
                            <div class="text-xs text-green-600">
                                Unit: R$ ${item.precoUnitario.toFixed(2).replace('.', ',')}
                                ${item.economiaItem > 0 ? ` • Economia: R$ ${item.economiaItem.toFixed(2).replace('.', ',')}` : ''}
                            </div>
                        </div>
                        <div class="font-semibold text-green-800">
                            R$ ${item.subtotalItem.toFixed(2).replace('.', ',')}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="border-t border-green-300 pt-3 space-y-2">
                <div class="flex justify-between text-sm">
                    <span class="text-green-700">Subtotal:</span>
                    <span class="text-green-800">R$ ${resumoPedido.subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                
                ${resumoPedido.economiaTotal > 0 ? `
                    <div class="flex justify-between text-sm">
                        <span class="text-green-600">Desconto aplicado:</span>
                        <span class="text-green-600 font-medium">-R$ ${resumoPedido.economiaTotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                ` : ''}
                
                <div class="flex justify-between text-sm">
                    <span class="text-green-700">Taxa de entrega:</span>
                    <span class="text-green-800 font-medium">${resumoPedido.taxaEntrega === 0 ? 'Grátis' : 'R$ ' + resumoPedido.taxaEntrega.toFixed(2).replace('.', ',')}</span>
                </div>
                
                <div class="flex justify-between font-bold text-base border-t border-green-400 pt-2 bg-green-50 -mx-2 px-2 py-2 rounded">
                    <span class="text-green-800">Total Pago:</span>
                    <span class="text-green-800 text-lg">R$ ${resumoPedido.total.toFixed(2).replace('.', ',')}</span>
                </div>
            </div>
        </div>
    `;
}

// Função para atualizar resumo do checkout
function atualizarResumoCheckoutPage() {
    const resumoContainer = document.getElementById('resumoCheckoutPage');
    const totalElement = document.getElementById('totalCheckoutPage');

    if (carrinho.length === 0) {
        resumoContainer.innerHTML = '<p class="text-gray-500 text-sm">Nenhum item no carrinho</p>';
        totalElement.textContent = 'R$ 0,00';
        return;
    }

    const resumoPedido = calcularResumoCompleto();

    resumoContainer.innerHTML = `
        <div class="space-y-3">
            <div class="space-y-2 max-h-32 overflow-y-auto">
                ${resumoPedido.itens.slice(0, 3).map(item => `
                    <div class="flex justify-between text-sm">
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
            
            <div class="space-y-1 pt-2 border-t border-gray-200 text-sm">
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
            </div>
        </div>
    `;

    totalElement.textContent = `R$ ${resumoPedido.total.toFixed(2).replace('.', ',')}`;
}

// Funções auxiliares
function mostrarErroPage(elementoId, mensagem) {
    const elemento = document.getElementById(elementoId);
    elemento.textContent = mensagem;
    elemento.classList.remove('hidden');
}

function ocultarErroPage(elementoId) {
    const elemento = document.getElementById(elementoId);
    elemento.classList.add('hidden');
}

function capturarParametrosUTM() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        utm_source: urlParams.get('utm_source') || '',
        utm_medium: urlParams.get('utm_medium') || '',
        utm_campaign: urlParams.get('utm_campaign') || '',
        utm_content: urlParams.get('utm_content') || '',
        utm_term: urlParams.get('utm_term') || ''
    };
}

// Funções de navegação
function voltarParaCarrinho() {
    window.location.href = 'carrinho.html';
}

function solicitarNovoEndereco() {
    window.location.href = 'index.html#endereco';
}

function alterarEndereco() {
    if (confirm('Deseja alterar seu endereço? Você será redirecionado para a página inicial.')) {
        localStorage.removeItem('endereco_cliente');
        window.location.href = 'index.html';
    }
}

// Limpar intervalo quando sair da página
window.addEventListener('beforeunload', function () {
    if (intervalVerificacaoPage) {
        clearInterval(intervalVerificacaoPage);
    }
});

// Função para chamar diretamente a API Monetrix (Fallback)
async function chamarAPIMonetrixDireta(dadosPagamento) {
    console.log("Executando fallback direto para API Monetrix...");
    
    // Calcular valor total em centavos
    const valorTotal = Math.round(dadosPagamento.resumo.total * 100);
    
    // Preparar payload no formato original da API
    const payloadMonetrix = {
        "amount": valorTotal,
        "currency": "BRL",
        "paymentMethod": "pix",
        "pix": {
            "expiresIn": 60
        },
        "items": dadosPagamento.itens.map(item => ({
            "title": item.nome || "Produto",
            "unitPrice": Math.round((item.precoPromocional || item.precoUnitario || 0) * 100),
            "quantity": item.quantidade || 1,
            "tangible": false
        })),
        "customer": {
            "name": dadosPagamento.cliente.nome || "Fernando Alves",
            "email": dadosPagamento.cliente.email || "shpf0001@gmail.com",
            "document": {
                "type": "cpf",
                "number": dadosPagamento.cliente.cpf?.replace(/[^0-9]/g, '') || "90283363207"
            }
        }
    };
    
    console.log("Payload para API Monetrix:", payloadMonetrix);
    
    try {
        // Fazer requisição direta para API Monetrix
        const response = await fetch('https://api.monetrix.store/v1/transactions', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'authorization': 'Basic ' + btoa('pk_ouwx4hvdzP2IcG-qH-KG4tBeF7_rhkba_HYje6SsTjHo5umn:sk__Q39xQdSt6qPoM9gOBb5EKXeG0i-3Fo1pMP77BiWS7Fygjng'),
                'content-type': 'application/json'
            },
            body: JSON.stringify(payloadMonetrix)
        });
        
        const responseData = await response.json();
        console.log("Resposta da API Monetrix:", responseData);
        
        if (response.ok && responseData.id) {
            // Extrair dados do PIX da resposta
            const pixCode = responseData.pix?.qrcode || responseData.pix?.qr_code || responseData.pixCode || '';
            const qrCodeUrl = responseData.pix?.imageUrl || responseData.pix?.image_url || 
                            (pixCode ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(pixCode)}` : '');
            
            return {
                success: true,
                transactionId: responseData.id,
                pixCode: pixCode,
                qrCodeUrl: qrCodeUrl,
                amount: valorTotal / 100,
                status: responseData.status || 'pending',
                message: 'PIX gerado via fallback direto para API Monetrix'
            };
        } else {
            throw new Error(responseData.message || `Erro HTTP ${response.status}`);
        }
    } catch (error) {
        console.error("Erro na chamada direta da API Monetrix:", error);
        throw new Error("Falha na comunicação com API Monetrix: " + error.message);
    }
}