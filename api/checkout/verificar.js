/**
 * Verificar status do pagamento via LXPAY (Node.js)
 * Usa WHATWG URL API ao invés de url.parse() (deprecado)
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Content-Type', 'application/json');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ 
                success: false,
                error: 'ID não fornecido' 
            });
        }

        // Limpar ID
        const transactionId = String(id).trim().replace(/[^a-zA-Z0-9\-]/g, '');

        console.log('[Verificar] 🔍 Verificando transação:', transactionId);

        // Configurações da API LXPAY
        const LXPAY_PUBLIC_KEY = process.env.LXPAY_PUBLIC_KEY || 'mathiassmitth1_1766005037499';
        const LXPAY_SECRET_KEY = process.env.LXPAY_SECRET_KEY || 'dc6f2a38-06b4-4e5d-9430-607b9e1a2f55';
        const LXPAY_API_BASE_URL = 'https://api.lxpay.com.br';

        // Usar WHATWG URL API ao invés de url.parse()
        const apiUrl = new URL(`/api/v1/transactions/${encodeURIComponent(transactionId)}`, LXPAY_API_BASE_URL);

        // Fazer requisição para API LXPAY
        const response = await fetch(apiUrl.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-public-key': LXPAY_PUBLIC_KEY,
                'x-secret-key': LXPAY_SECRET_KEY
            }
        });

        if (!response.ok) {
            console.error('[Verificar] ❌ Erro HTTP:', response.status, response.statusText);
            return res.status(response.status).json({
                success: false,
                status: 'error',
                message: `Erro ao consultar API LXPAY: ${response.status} ${response.statusText}`
            });
        }

        const data = await response.json();
        
        // Mapear status da API LXPAY para status do sistema
        let status = 'pending';
        const apiStatus = data.status?.toUpperCase() || '';
        
        if (['PAID', 'CONFIRMED', 'OK'].includes(apiStatus)) {
            status = 'paid';
        } else if (['CANCELLED', 'CANCELED'].includes(apiStatus)) {
            status = 'canceled';
        } else if (['EXPIRED'].includes(apiStatus)) {
            status = 'expired';
        } else if (['FAILED'].includes(apiStatus)) {
            status = 'failed';
        }

        console.log('[Verificar] ✅ Status da transação:', status);

        return res.status(200).json({
            success: true,
            status: status,
            transaction_id: transactionId,
            data: data
        });

    } catch (error) {
        console.error('[Verificar] ❌ Erro:', error.message);
        console.error('[Verificar] ❌ Stack:', error.stack);
        return res.status(500).json({
            success: false,
            status: 'error',
            message: 'Erro ao verificar o status do pagamento: ' + error.message
        });
    }
}

