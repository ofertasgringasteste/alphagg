/**
 * Processamento de pagamento PIX IN via Abyssal Pay (Node.js)
 * 
 * Este arquivo processa requisições de pagamento PIX e gera QR Code
 */

// Configurações da API Abyssal Pay
const ABYSSALPAY_TOKEN = 'b0c1ebed-0c39-41e6-85b5-1b479c5b8c71';
const ABYSSALPAY_SECRET = 'e32cffc6-e822-4e4b-b625-9dcac3ed51db';
const ABYSSALPAY_DEPOSIT_ENDPOINT = 'https://abyssalpay.com/api/wallet/deposit/payment';

// Função para gerar CPF válido
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

// Função para obter URL do webhook
function getWebhookUrl(req) {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['host'] || req.headers['x-forwarded-host'] || 'localhost';
    return `${protocol}://${host}/api/abyssalpay-webhook.js`;
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Content-Type', 'application/json');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Validar método HTTP
    if (!['POST', 'GET'].includes(req.method)) {
        return res.status(405).json({
            success: false,
            error: 'Método não permitido. Use POST.',
            method: req.method
        });
    }

    try {
        // Nota: SQLite não funciona bem no Vercel serverless
        // Por enquanto, vamos pular o banco de dados e apenas processar o pagamento
        // O webhook irá atualizar o status quando necessário

        // Receber dados do frontend
        const input = req.body || {};
        
        console.log('[AbyssalPay] 🚀 Iniciando processamento de pagamento');
        console.log('[AbyssalPay] 📝 Método:', req.method);
        console.log('[AbyssalPay] 📦 Input recebido:', JSON.stringify(input));

        // Validar e processar dados
        const valor = parseFloat(input.valor) || 0;
        if (valor <= 0) {
            throw new Error('Valor inválido');
        }

        const valor_decimal = valor / 100;
        const nome_cliente = input.nome || null;
        const telefone_cliente = input.telefone || "11999999999";
        const email_cliente = input.email || "clienteteste@gmail.com";
        const cpf_cliente = input.cpf || null;

        // Parâmetros UTM
        const utmParams = {
            utm_source: input.utm_source || input.utmParams?.utm_source || null,
            utm_medium: input.utm_medium || input.utmParams?.utm_medium || null,
            utm_campaign: input.utm_campaign || input.utmParams?.utm_campaign || null,
            utm_content: input.utm_content || input.utmParams?.utm_content || null,
            utm_term: input.utm_term || input.utmParams?.utm_term || null,
            xcod: input.xcod || input.utmParams?.xcod || null,
            sck: input.sck || input.utmParams?.sck || null,
            fbclid: input.fbclid || input.utmParams?.fbclid || null,
            gclid: input.gclid || input.utmParams?.gclid || null,
            ttclid: input.ttclid || input.utmParams?.ttclid || null
        };

        // Filtrar valores nulos/vazios
        Object.keys(utmParams).forEach(key => {
            if (utmParams[key] === null || utmParams[key] === '') {
                delete utmParams[key];
            }
        });

        console.log('[AbyssalPay] 📊 Parâmetros UTM recebidos:', JSON.stringify(utmParams));

        // Gerar dados do cliente se não fornecidos
        let nome_final = nome_cliente;
        if (!nome_final) {
            const nomes_masculinos = [
                'João', 'Pedro', 'Lucas', 'Miguel', 'Arthur', 'Gabriel', 'Bernardo', 'Rafael',
                'Gustavo', 'Felipe', 'Daniel', 'Matheus', 'Bruno', 'Thiago', 'Carlos'
            ];
            const nomes_femininos = [
                'Maria', 'Ana', 'Julia', 'Sofia', 'Isabella', 'Helena', 'Valentina', 'Laura',
                'Alice', 'Manuela', 'Beatriz', 'Clara', 'Luiza', 'Mariana', 'Sophia'
            ];
            const sobrenomes = [
                'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves',
                'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho',
                'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa'
            ];

            const genero = Math.floor(Math.random() * 2);
            const nome = genero ? 
                nomes_masculinos[Math.floor(Math.random() * nomes_masculinos.length)] :
                nomes_femininos[Math.floor(Math.random() * nomes_femininos.length)];
            const sobrenome1 = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
            const sobrenome2 = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
            nome_final = `${nome} ${sobrenome1} ${sobrenome2}`;
        }

        const email = email_cliente;
        const cpf = cpf_cliente || gerarCPF();
        
        // Remover caracteres não numéricos
        const telefone_limpo = telefone_cliente.replace(/\D/g, '');
        const cpf_limpo = cpf.replace(/\D/g, '');

        console.log('[AbyssalPay] 📝 Preparando dados para envio:', JSON.stringify({
            valor: valor_decimal,
            nome: nome_final,
            email: email,
            cpf: cpf_limpo,
            telefone: telefone_limpo
        }));

        // Preparar URL do postback
        const postbackUrl = getWebhookUrl(req);

        // Estrutura de dados para Abyssal Pay
        const data = {
            token: ABYSSALPAY_TOKEN,
            secret: ABYSSALPAY_SECRET,
            postback: postbackUrl,
            amount: valor_decimal,
            debtor_name: nome_final,
            email: email,
            debtor_document_number: cpf_limpo,
            phone: telefone_limpo,
            method_pay: "pix"
        };

        console.log('[AbyssalPay] 🌐 URL da requisição:', ABYSSALPAY_DEPOSIT_ENDPOINT);
        console.log('[AbyssalPay] 📦 Dados enviados:', JSON.stringify(data));

        // Fazer requisição para Abyssal Pay
        const response = await fetch(ABYSSALPAY_DEPOSIT_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const httpCode = response.status;
        const responseText = await response.text();

        console.log('[AbyssalPay] 📊 HTTP Status Code:', httpCode);
        console.log('[AbyssalPay] 📄 Resposta bruta:', responseText);

        if (httpCode !== 200 && httpCode !== 201) {
            console.error('[AbyssalPay] ❌ Erro HTTP:', httpCode);
            console.error('[AbyssalPay] 📄 Resposta de erro:', responseText);
            throw new Error(`Erro na API Abyssal Pay: HTTP ${httpCode} - ${responseText}`);
        }

        const result = JSON.parse(responseText);
        
        if (!result) {
            throw new Error('Resposta vazia da API Abyssal Pay');
        }

        if (!result.idTransaction) {
            console.error('[AbyssalPay] ❌ Resposta da API não contém ID da transação');
            console.error('[AbyssalPay] 📄 Estrutura recebida:', JSON.stringify(result, null, 2));
            throw new Error('ID da transação não encontrado na resposta');
        }

        const idTransaction = result.idTransaction;
        const qrcode = result.qrcode || '';
        let qr_code_image_url = result.qr_code_image_url || '';

        // Se não tiver URL da imagem mas tiver código, gerar QR code
        if (!qr_code_image_url && qrcode) {
            qr_code_image_url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrcode)}`;
        }

        // Nota: Banco de dados será atualizado pelo webhook
        // Por enquanto, apenas logamos a transação
        console.log('[AbyssalPay] 💳 Transação criada com sucesso:', idTransaction);
        console.log('[AbyssalPay] 📊 Dados da transação:', JSON.stringify({
            transaction_id: idTransaction,
            status: 'pending',
            valor: valor,
            nome: nome_final,
            email: email,
            cpf: cpf_limpo,
            telefone: telefone_limpo,
            utm_params: utmParams,
            created_at: new Date().toISOString()
        }));

        // Preparar resposta
        const responseData = {
            success: true,
            token: idTransaction,
            transactionId: idTransaction,
            pixCode: qrcode,
            qrcode: qrcode,
            qrCodeUrl: qr_code_image_url,
            qr_code_image_url: qr_code_image_url,
            valor: valor,
            status: 'pending',
            logs: {
                utmParams: utmParams,
                transacao: {
                    valor: valor,
                    cliente: nome_final,
                    email: email,
                    cpf: cpf_limpo,
                    telefone: telefone_limpo
                },
                abyssalpayResponse: result
            }
        };

        console.log('[AbyssalPay] 📤 Enviando resposta ao frontend:', JSON.stringify(responseData));
        
        return res.status(200).json(responseData);

    } catch (error) {
        console.error('[AbyssalPay] ❌ Erro:', error.message);
        console.error('[AbyssalPay] 🔍 Stack trace:', error.stack);
        
        return res.status(500).json({
            success: false,
            message: 'Erro ao gerar o PIX: ' + error.message,
            error_details: {
                message: error.message,
                stack: error.stack
            }
        });
    }
}

