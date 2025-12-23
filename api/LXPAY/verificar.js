/**
 * Endpoint para verificar status de uma transação (Node.js Serverless Function)
 * Consulta API LXPAY e retorna status compatível com frontend
 * Compatível com Vercel Serverless Functions
 */

// Configurações da API LXPAY
const LXPAY_PUBLIC_KEY = process.env.LXPAY_PUBLIC_KEY || 'mathiassmitth1_1766005037499';
const LXPAY_SECRET_KEY = process.env.LXPAY_SECRET_KEY || 'dc6f2a38-06b4-4e5d-9430-607b9e1a2f55';
const LXPAY_API_BASE_URL = 'https://api.lxpay.com.br';
const LXPAY_TIMEOUT = 30000; // 30 segundos em milissegundos

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
 * Consulta status de uma transação na API LXPAY
 */
async function consultarTransacao(transactionId) {
    if (!transactionId) {
        return {
            success: false,
            error: 'Transaction ID é obrigatório'
        };
    }
    
    // Usar WHATWG URL API ao invés de url.parse() (deprecado)
    const apiUrl = new URL(`/api/v1/transactions/${encodeURIComponent(transactionId)}`, LXPAY_API_BASE_URL);
    
    return await fazerRequisicao(apiUrl.pathname, 'GET');
}

/**
 * Mapeia status da API LXPAY para formato do sistema
 */
function mapearStatus(statusApi) {
    if (!statusApi) {
        return 'pending';
    }
    
    const statusUpper = statusApi.toUpperCase();
    
    switch (statusUpper) {
        case 'PAID':
        case 'CONFIRMED':
        case 'OK':
        case 'COMPLETED':
            return 'paid';
        case 'PENDING':
        case 'WAITING':
            return 'pending';
        case 'CANCELLED':
        case 'CANCELED':
            return 'cancelled';
        case 'EXPIRED':
            return 'expired';
        case 'FAILED':
        case 'ERROR':
            return 'failed';
        default:
            return 'pending';
    }
}

/**
 * Handler principal da serverless function
 */
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        // Pega transactionId do GET ou POST
        let transactionId = null;
        
        if (req.method === 'GET') {
            transactionId = req.query.id || req.query.transactionId || null;
        } else {
            const body = req.body || {};
            transactionId = body.id || body.transactionId || null;
        }
        
        if (!transactionId) {
            return res.status(400).json({
                success: false,
                status: 'error',
                error: 'Transaction ID é obrigatório',
                message: 'Transaction ID é obrigatório'
            });
        }
        
        // Limpar ID
        transactionId = String(transactionId).trim();
        
        console.log(`[Verificar] 🔍 Verificando transação: ${transactionId}`);
        
        // ============================================
        // CONSULTAR STATUS NA API LXPAY
        // ============================================
        // Nota: SQLite não funciona bem em ambiente serverless
        // Consultamos diretamente a API LXPAY para obter o status mais atualizado
        
        const resultado = await consultarTransacao(transactionId);
        
        if (resultado.success) {
            const data = resultado.data || {};
            const statusApi = data.status || 'pending';
            
            // Mapear status da API para formato do sistema
            const statusSistema = mapearStatus(statusApi);
            
            console.log(`[Verificar] ✅ Status da transação: ${statusSistema} (API: ${statusApi})`);
            
            return res.status(200).json({
                success: true,
                status: statusSistema,
                transaction_id: transactionId,
                source: 'api',
                api_status: statusApi,
                data: data
            });
        } else {
            // Erro ao consultar API - retornar pending
            console.error(`[Verificar] ❌ Erro ao consultar API: ${resultado.error}`);
            
            return res.status(200).json({
                success: true,
                status: 'pending',
                transaction_id: transactionId,
                message: 'Transação não encontrada ou erro ao consultar API',
                error: resultado.error
            });
        }
        
    } catch (error) {
        console.error(`[Verificar] ❌ Exceção capturada: ${error.message}`);
        console.error(`[Verificar] 🔍 Stack trace: ${error.stack}`);
        
        return res.status(400).json({
            success: false,
            status: 'error',
            error: error.message,
            message: error.message
        });
    }
}

