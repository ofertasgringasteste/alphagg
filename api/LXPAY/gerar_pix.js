/**
 * Endpoint para gerar pagamento PIX via LXPAY (Node.js Serverless Function)
 * Recebe dados do checkout e retorna QR Code PIX
 * Compatível com Vercel Serverless Functions
 */

// Configurações da API LXPAY
const LXPAY_PUBLIC_KEY = process.env.LXPAY_PUBLIC_KEY || 'mathiassmitth1_1766005037499';
const LXPAY_SECRET_KEY = process.env.LXPAY_SECRET_KEY || 'dc6f2a38-06b4-4e5d-9430-607b9e1a2f55';
const LXPAY_API_BASE_URL = 'https://api.lxpay.com.br';
const LXPAY_TIMEOUT = 30000; // 30 segundos em milissegundos

/**
 * Gera um identifier único conforme especificação da API
 * Formato: 26-35 caracteres alfanuméricos (A-Z, 0-9)
 */
function gerarIdentifier() {
    // Timestamp em milissegundos (13 dígitos)
    const timestamp = Math.round(Date.now());
    
    // String aleatória com letras maiúsculas e números
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let random = '';
    for (let i = 0; i < 13; i++) {
        random += caracteres[Math.floor(Math.random() * caracteres.length)];
    }
    
    // Combina timestamp + random = 26 caracteres
    let identifier = timestamp.toString() + random;
    
    // Garante que está entre 26-35 caracteres
    if (identifier.length < 26) {
        identifier = identifier.padEnd(26, '0');
    } else if (identifier.length > 35) {
        identifier = identifier.substring(0, 35);
    }
    
    return identifier;
}

/**
 * Valida CPF
 */
function validarCPF(cpf) {
    cpf = cpf.replace(/[^0-9]/g, '');
    
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
        return false;
    }
    
    for (let t = 9; t < 11; t++) {
        let d = 0;
        for (let c = 0; c < t; c++) {
            d += parseInt(cpf[c]) * ((t + 1) - c);
        }
        d = ((10 * d) % 11) % 10;
        if (parseInt(cpf[t]) !== d) {
            return false;
        }
    }
    
    return true;
}

/**
 * Valida CNPJ
 */
function validarCNPJ(cnpj) {
    cnpj = cnpj.replace(/[^0-9]/g, '');
    
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
        return false;
    }
    
    let length = cnpj.length - 2;
    let numbers = cnpj.substring(0, length);
    let digits = cnpj.substring(length);
    let sum = 0;
    let pos = length - 7;
    
    for (let i = length; i >= 1; i--, pos--) {
        if (pos < 2) {
            pos = 9;
        }
        sum += parseInt(numbers[length - i]) * pos;
    }
    
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits[0])) {
        return false;
    }
    
    length = length + 1;
    numbers = cnpj.substring(0, length);
    sum = 0;
    pos = length - 7;
    
    for (let i = length; i >= 1; i--, pos--) {
        if (pos < 2) {
            pos = 9;
        }
        sum += parseInt(numbers[length - i]) * pos;
    }
    
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits[1])) {
        return false;
    }
    
    return true;
}

/**
 * Valida CPF ou CNPJ
 */
function validarDocumento(document) {
    const documentoLimpo = document.replace(/[^0-9]/g, '');
    
    if (documentoLimpo.length === 11) {
        return validarCPF(documentoLimpo);
    }
    
    if (documentoLimpo.length === 14) {
        return validarCNPJ(documentoLimpo);
    }
    
    return false;
}

/**
 * Gera CPF válido
 */
function gerarCPF() {
    let cpf = '';
    for (let i = 0; i < 9; i++) {
        cpf += Math.floor(Math.random() * 10);
    }
    
    // Calcular primeiro dígito
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf[i]) * (10 - i);
    }
    let resto = soma % 11;
    const digito1 = (resto < 2) ? 0 : 11 - resto;
    cpf += digito1;
    
    // Calcular segundo dígito
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf[i]) * (11 - i);
    }
    resto = soma % 11;
    const digito2 = (resto < 2) ? 0 : 11 - resto;
    cpf += digito2;
    
    // Verificar se é inválido (todos os dígitos iguais)
    const invalidos = [
        '00000000000', '11111111111', '22222222222', '33333333333',
        '44444444444', '55555555555', '66666666666', '77777777777',
        '88888888888', '99999999999'
    ];
    
    if (invalidos.includes(cpf)) {
        return gerarCPF();
    }
    
    return cpf;
}

/**
 * Faz requisição HTTP para a API LXPAY
 */
async function fazerRequisicao(endpoint, method = 'GET', data = null) {
    const url = LXPAY_API_BASE_URL + endpoint;
    
    console.log(`[LXPAY API] 🌐 URL: ${url}`);
    console.log(`[LXPAY API] 📝 Método: ${method}`);
    if (data) {
        console.log(`[LXPAY API] 📦 Payload: ${JSON.stringify(data)}`);
    }
    
    const headers = {
        'Content-Type': 'application/json',
        'x-public-key': LXPAY_PUBLIC_KEY,
        'x-secret-key': LXPAY_SECRET_KEY
    };
    
    const options = {
        method: method,
        headers: headers,
        signal: AbortSignal.timeout(LXPAY_TIMEOUT)
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        const httpCode = response.status;
        const responseText = await response.text();
        
        console.log(`[LXPAY API] 📊 HTTP Code: ${httpCode}`);
        console.log(`[LXPAY API] 📄 Response: ${responseText.substring(0, 500)}`);
        
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (parseError) {
            console.error(`[LXPAY API] ❌ Erro ao decodificar JSON: ${parseError.message}`);
            console.error(`[LXPAY API] 📄 Resposta bruta: ${responseText}`);
            return {
                success: false,
                error: 'Erro ao processar resposta da API',
                http_code: httpCode,
                raw_response: responseText
            };
        }
        
        if (httpCode >= 200 && httpCode < 300) {
            return {
                success: true,
                data: responseData,
                http_code: httpCode
            };
        } else {
            const errorMsg = responseData.message || responseData.error || 'Erro desconhecido';
            console.error(`[LXPAY API] ❌ Erro HTTP ${httpCode}: ${errorMsg}`);
            return {
                success: false,
                error: errorMsg,
                error_code: responseData.errorCode || responseData.error_code || null,
                details: responseData.details || responseData || null,
                http_code: httpCode,
                response: responseData
            };
        }
    } catch (error) {
        console.error(`[LXPAY API] ❌ Erro na requisição: ${error.message}`);
        return {
            success: false,
            error: 'Erro na requisição: ' + error.message,
            http_code: 0
        };
    }
}

/**
 * Gera um pagamento PIX
 */
async function gerarPix(dados) {
    // Validações
    if (!dados.amount || dados.amount <= 0) {
        return {
            success: false,
            error: 'Valor do pagamento inválido'
        };
    }
    
    if (!dados.client || !dados.client.name) {
        return {
            success: false,
            error: 'Nome do cliente é obrigatório'
        };
    }
    
    if (!dados.client || !dados.client.email) {
        return {
            success: false,
            error: 'E-mail do cliente é obrigatório'
        };
    }
    
    if (!dados.client || !dados.client.document) {
        return {
            success: false,
            error: 'CPF/CNPJ do cliente é obrigatório'
        };
    }
    
    // Limpa documento (remove formatação) antes de validar
    const documentoLimpo = dados.client.document.replace(/[^0-9]/g, '');
    dados.client.document = documentoLimpo;
    
    // Valida documento
    if (!validarDocumento(documentoLimpo)) {
        console.error(`[LXPAY API] ❌ CPF/CNPJ inválido: ${documentoLimpo}`);
        return {
            success: false,
            error: 'CPF/CNPJ inválido',
            document: documentoLimpo
        };
    }
    
    // Gera identifier se não fornecido
    if (!dados.identifier) {
        dados.identifier = gerarIdentifier();
    }
    
    // Valida identifier
    if (dados.identifier.length < 26 || dados.identifier.length > 35) {
        return {
            success: false,
            error: 'Identifier deve ter entre 26 e 35 caracteres'
        };
    }
    
    // Monta payload
    const payload = {
        identifier: dados.identifier,
        amount: parseFloat(dados.amount),
        client: {
            name: dados.client.name,
            email: dados.client.email,
            document: dados.client.document
        }
    };
    
    // Adiciona telefone se fornecido
    if (dados.client.phone) {
        payload.client.phone = dados.client.phone.replace(/[^0-9]/g, '');
    }
    
    // Adiciona produtos se fornecido
    if (dados.products && Array.isArray(dados.products) && dados.products.length > 0) {
        payload.products = dados.products;
    }
    
    // Adiciona data de vencimento se fornecido
    if (dados.dueDate) {
        payload.dueDate = dados.dueDate;
    }
    
    // Adiciona callback URL se configurado
    const webhookUrl = process.env.LXPAY_WEBHOOK_URL || 
                      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/LXPAY/webhook.php` : null);
    if (webhookUrl) {
        payload.callbackUrl = webhookUrl;
    }
    
    // Adiciona metadata se fornecido
    if (dados.metadata && typeof dados.metadata === 'object') {
        payload.metadata = dados.metadata;
    }
    
    // Adiciona splits se fornecido
    if (dados.splits && Array.isArray(dados.splits)) {
        payload.splits = dados.splits;
    }
    
    // Faz requisição
    return await fazerRequisicao('/api/v1/gateway/pix/receive', 'POST', payload);
}

/**
 * Obtém URL base do site
 */
function getBaseUrl(req) {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['host'] || req.headers['x-forwarded-host'] || 'localhost';
    return `${protocol}://${host}`;
}

/**
 * Handler principal da serverless function
 */
export default async function handler(req, res) {
    // Log inicial para debug
    console.log(`[gerar_pix.js] 📥 Requisição recebida - Método: ${req.method}, URL: ${req.url}`);
    
    // CORS headers - devem ser enviados primeiro
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.setHeader('Access-Control-Max-Age', '3600');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        console.log('[gerar_pix.js] ✅ OPTIONS preflight - retornando 200');
        return res.status(200).end();
    }
    
    // Apenas aceita POST
    if (req.method !== 'POST') {
        console.error(`[gerar_pix.js] ❌ Método não permitido: ${req.method}`);
        return res.status(405).json({
            success: false,
            error: 'Método não permitido. Use POST.'
        });
    }
    
    try {
        // Lê dados do POST
        const input = req.body || {};
        
        console.log(`[LXPAY] 📥 Dados recebidos (primeiros 500 chars): ${JSON.stringify(input).substring(0, 500)}`);
        
        // Validações básicas
        if (!input || Object.keys(input).length === 0) {
            console.error('[LXPAY] ❌ Dados vazios após decode');
            return res.status(400).json({
                success: false,
                error: 'Dados não fornecidos',
                message: 'Nenhum dado foi enviado na requisição'
            });
        }
        
        // ============================================
        // MAPEAMENTO: Formato checkout → Formato LXPAY
        // ============================================
        
        // Extrair dados do formato do checkout
        // Suporta tanto formato direto quanto formato com objeto 'cliente'
        // Usa Math.round() para evitar problemas com imprecisão de ponto flutuante
        const valor_centavos = input.valor ? Math.round(parseFloat(input.valor)) : 0;
        const nome_cliente = input.nome || input.cliente?.nome || null;
        const email_cliente = input.email || input.cliente?.email || null;
        const cpf_cliente = input.cpf || input.cliente?.cpf || null;
        const telefone_cliente = input.telefone || input.cliente?.telefone || null;
        const itens_carrinho = input.itens || [];
        const endereco_cliente = input.endereco || null;
        const utmParams = input.utmParams || {};
        
        // Log dos dados extraídos
        console.log(`[LXPAY] 📊 Dados extraídos - Valor: ${valor_centavos}, Nome: ${nome_cliente}, Email: ${email_cliente}, CPF: ${cpf_cliente ? 'fornecido' : 'não fornecido'}`);
        
        // Validações
        if (valor_centavos <= 0) {
            console.error(`[LXPAY] ❌ Valor inválido: ${valor_centavos}`);
            throw new Error('Valor inválido');
        }
        
        if (!nome_cliente || !email_cliente) {
            console.error(`[LXPAY] ❌ Dados do cliente incompletos - Nome: ${nome_cliente ? 'OK' : 'VAZIO'}, Email: ${email_cliente ? 'OK' : 'VAZIO'}`);
            throw new Error('Nome e email do cliente são obrigatórios');
        }
        
        // Converter valor de centavos para decimal (LXPAY espera decimal)
        const valor_decimal = valor_centavos / 100;
        
        // Gerar CPF se não fornecido
        let cpf_final = cpf_cliente;
        if (!cpf_final) {
            cpf_final = gerarCPF();
        }
        
        // Limpar CPF (remover formatação)
        cpf_final = cpf_final.replace(/[^0-9]/g, '');
        
        // Validar tamanho do CPF
        if (cpf_final && cpf_final.length !== 11) {
            console.error(`[LXPAY] ⚠️ CPF fornecido com tamanho inválido: ${cpf_final} (tamanho: ${cpf_final.length}). Gerando novo CPF.`);
            cpf_final = gerarCPF();
        }
        
        // Limpar telefone
        let telefone_final = telefone_cliente ? telefone_cliente.replace(/[^0-9]/g, '') : '11999999999';
        
        // Validar telefone (deve ter pelo menos 10 dígitos)
        if (telefone_final.length < 10) {
            console.error(`[LXPAY] ⚠️ Telefone fornecido com tamanho inválido: ${telefone_final} (tamanho: ${telefone_final.length}). Usando telefone padrão.`);
            telefone_final = '11999999999'; // Telefone padrão se inválido
        }
        
        // Preparar estrutura de dados para LXPAY
        const dadosLxpay = {
            amount: valor_decimal,
            client: {
                name: nome_cliente,
                email: email_cliente,
                document: cpf_final
            }
        };
        
        // Adicionar telefone se fornecido
        if (telefone_final) {
            dadosLxpay.client.phone = telefone_final;
        }
        
        // Preparar produtos/itens se houver
        if (itens_carrinho && Array.isArray(itens_carrinho) && itens_carrinho.length > 0) {
            const products = [];
            for (const item of itens_carrinho) {
                // Mapear formato do checkout para formato LXPAY
                let preco = 0;
                if (item.precoPromocional !== undefined) {
                    preco = parseFloat(item.precoPromocional);
                } else if (item.precoOriginal !== undefined) {
                    preco = parseFloat(item.precoOriginal);
                } else if (item.preco !== undefined) {
                    preco = parseFloat(item.preco);
                }
                
                products.push({
                    id: item.id || item.idProduto || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: item.nome || item.nomeProduto || 'Produto',
                    quantity: parseInt(item.quantidade || item.qtdeProduto || 1),
                    price: preco
                });
            }
            if (products.length > 0) {
                dadosLxpay.products = products;
            }
        }
        
        // Preparar metadata
        const metadata = {
            pedido_id: `ped_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fonte: 'alphaburguer',
            timestamp: new Date().toISOString()
        };
        
        // Adicionar endereço no metadata se houver
        if (endereco_cliente) {
            metadata.entrega = endereco_cliente;
        }
        
        // Adicionar parâmetros UTM no metadata
        if (utmParams && typeof utmParams === 'object' && Object.keys(utmParams).length > 0) {
            metadata.utm_params = utmParams;
        }
        
        dadosLxpay.metadata = metadata;
        
        // ============================================
        // GERAR IDENTIFIER (OBRIGATÓRIO)
        // ============================================
        
        // Gerar identifier único conforme especificação da API (26-35 caracteres)
        const identifier = gerarIdentifier();
        dadosLxpay.identifier = identifier;
        
        console.log(`[LXPAY] 🔑 Identifier gerado: ${identifier}`);
        
        // ============================================
        // GERAR PIX VIA API LXPAY
        // ============================================
        
        // Log dos dados que serão enviados para LXPAY
        console.log(`[LXPAY] 📤 Dados preparados para LXPAY: ${JSON.stringify(dadosLxpay)}`);
        
        const resultado = await gerarPix(dadosLxpay);
        
        // Log da resposta
        console.log(`[LXPAY] 📥 Resposta da API: ${JSON.stringify(resultado)}`);
        
        if (!resultado.success) {
            const erro = resultado.error || 'Erro ao gerar PIX na API LXPAY';
            const detalhes = resultado.details ? ' - Detalhes: ' + JSON.stringify(resultado.details) : '';
            const httpCode = resultado.http_code ? ' - HTTP: ' + resultado.http_code : '';
            console.error(`[LXPAY] ❌ Erro: ${erro}${detalhes}${httpCode}`);
            throw new Error(erro);
        }
        
        // Extrair dados da resposta
        const responseData = resultado.data || {};
        console.log(`[LXPAY] 📊 Response Data: ${JSON.stringify(responseData)}`);
        
        // Tentar extrair transactionId de vários campos possíveis
        const transactionId = responseData.transactionId || 
                             responseData.transaction_id || 
                             responseData.id || 
                             responseData.order?.id || 
                             null;
        
        // Tentar extrair código PIX de vários campos possíveis
        const pixData = responseData.pix || responseData.pixCode || null;
        let pixCode = null;
        let qrCodeUrl = null;
        
        // Extrair código PIX da resposta
        if (pixData && typeof pixData === 'object') {
            pixCode = pixData.code || pixData.qrcode || pixData.qrCode || null;
            qrCodeUrl = pixData.qrCodeUrl || pixData.qr_code_image_url || pixData.imageUrl || null;
        } else if (typeof pixData === 'string') {
            pixCode = pixData;
        }
        
        // Se não encontrou no pixData, tentar diretamente na resposta
        if (!pixCode) {
            pixCode = responseData.pixCode || 
                     responseData.qrcode || 
                     responseData.code || 
                     null;
        }
        
        // Gerar URL do QR Code se não fornecida
        if (!qrCodeUrl && pixCode) {
            qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCode)}`;
        }
        
        console.log(`[LXPAY] ✅ Transaction ID: ${transactionId}, PIX Code: ${pixCode ? pixCode.substring(0, 50) + '...' : 'NÃO ENCONTRADO'}`);
        
        if (!transactionId) {
            console.error(`[LXPAY] ❌ Transaction ID não encontrado. Resposta completa: ${JSON.stringify(responseData)}`);
            throw new Error('Transaction ID não retornado pela API LXPAY');
        }
        
        // ============================================
        // NOTA: SQLite não funciona bem em ambiente serverless
        // O webhook irá persistir os dados quando o pagamento for confirmado
        // Por enquanto, apenas retornamos a resposta
        // ============================================
        
        // ============================================
        // RETORNAR RESPOSTA COMPATÍVEL COM FRONTEND
        // ============================================
        
        return res.status(200).json({
            success: true,
            transactionId: transactionId,
            token: transactionId, // Compatibilidade com frontend
            status: 'pending',
            pixCode: pixCode,
            qrcode: pixCode, // Compatibilidade
            qrCodeUrl: qrCodeUrl,
            qr_code_image_url: qrCodeUrl, // Compatibilidade
            pix: {
                code: pixCode
            }
        });
        
    } catch (error) {
        console.error(`[LXPAY] ❌ Exceção capturada: ${error.message}`);
        console.error(`[LXPAY] 🔍 Stack trace: ${error.stack}`);
        
        return res.status(400).json({
            success: false,
            error: error.message,
            message: error.message // Compatibilidade
        });
    }
}

