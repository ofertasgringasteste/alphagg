/**
 * Verificar status do pagamento (Node.js)
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
            return res.status(400).json({ error: 'ID não fornecido' });
        }

        // Limpar ID
        const transactionId = String(id).trim().replace(/[^a-zA-Z0-9\-]/g, '');

        // Nota: Como não temos banco de dados no Vercel serverless,
        // vamos retornar um status padrão "pending"
        // O webhook atualizará o status quando o pagamento for confirmado
        // Em produção, você deve usar um banco de dados externo (PostgreSQL, MongoDB, etc.)

        console.log('[Verificar] 🔍 Verificando transação:', transactionId);

        // Por enquanto, retornamos pending
        // Em produção, você deve consultar um banco de dados externo
        return res.status(200).json({
            success: true,
            status: 'pending',
            transaction_id: transactionId,
            message: 'Status verificado. Use um banco de dados externo para persistência.'
        });

    } catch (error) {
        console.error('[Verificar] ❌ Erro:', error.message);
        return res.status(500).json({
            success: false,
            status: 'error',
            message: 'Erro ao verificar o status do pagamento: ' + error.message
        });
    }
}

