/**
 * Webhook handler para receber notificações de pagamento da Abyssal Pay (Node.js)
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Content-Type', 'application/json');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        console.log('[AbyssalPay Webhook] 🚀 Webhook recebido');
        console.log('[AbyssalPay Webhook] 📝 Método:', req.method);

        // Receber dados do webhook
        const webhookData = req.body || {};

        console.log('[AbyssalPay Webhook] 📄 Dados recebidos:', JSON.stringify(webhookData, null, 2));

        // Extrair informações
        const status = webhookData.status || null;
        const idTransaction = webhookData.idTransaction || null;
        const typeTransaction = webhookData.typeTransaction || null;

        if (!idTransaction) {
            console.error('[AbyssalPay Webhook] ❌ ID da transação não encontrado');
            return res.status(400).json({
                success: false,
                message: 'ID da transação não encontrado'
            });
        }

        console.log('[AbyssalPay Webhook] 🔍 Processando transação:', idTransaction);
        console.log('[AbyssalPay Webhook] 📊 Status:', status);
        console.log('[AbyssalPay Webhook] 📊 Tipo:', typeTransaction);

        // Nota: Como não temos banco de dados no Vercel serverless,
        // vamos apenas logar a atualização
        // Em produção, você deve atualizar um banco de dados externo aqui

        let novoStatus = 'pending';
        if (status === 'paid') {
            novoStatus = 'paid';
        } else if (['failed', 'error', 'canceled'].includes(status)) {
            novoStatus = 'failed';
        }

        console.log('[AbyssalPay Webhook] ✅ Status atualizado para:', novoStatus);
        console.log('[AbyssalPay Webhook] 📊 Dados da transação:', JSON.stringify({
            transaction_id: idTransaction,
            status: novoStatus,
            type: typeTransaction,
            updated_at: new Date().toISOString()
        }));

        // Retornar sucesso
        return res.status(200).json({
            success: true,
            message: 'Webhook processado com sucesso',
            transaction_id: idTransaction,
            status: novoStatus
        });

    } catch (error) {
        console.error('[AbyssalPay Webhook] ❌ Erro:', error.message);
        console.error('[AbyssalPay Webhook] 🔍 Stack trace:', error.stack);
        
        return res.status(500).json({
            success: false,
            message: 'Erro ao processar webhook: ' + error.message
        });
    }
}

