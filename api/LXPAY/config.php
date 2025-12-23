<?php
/**
 * Configurações da API LXPAY
 * 
 * IMPORTANTE: Mantenha este arquivo seguro e nunca exponha as credenciais no frontend
 */

// Credenciais da API LXPAY
define('LXPAY_PUBLIC_KEY', 'mathiassmitth1_1766005037499');
define('LXPAY_SECRET_KEY', 'dc6f2a38-06b4-4e5d-9430-607b9e1a2f55');

// URL Base da API
define('LXPAY_API_BASE_URL', 'https://api.lxpay.com.br');

// Workspace ID para Split de Pagamento (opcional)
define('LXPAY_WORKSPACE_ID', '14f03260-23f3-4d76-a48a-aebf750cc980');

// Timeout para requisições (em segundos)
define('LXPAY_TIMEOUT', 30);

// Função para obter URL base do site
function getBaseUrl() {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    return $protocol . '://' . $host;
}

// Configurações de Webhook
// A URL será gerada dinamicamente baseada no domínio atual
// Você também pode definir manualmente se necessário:
// define('LXPAY_WEBHOOK_URL', 'https://seudominio.com.br/api/LXPAY/webhook.php');

// Função para obter URL do webhook
function getWebhookUrl() {
    // Se já estiver definida manualmente, usar essa
    if (defined('LXPAY_WEBHOOK_URL') && !empty(LXPAY_WEBHOOK_URL) && LXPAY_WEBHOOK_URL !== 'https://seudominio.com.br/LXPAY/webhook.php') {
        return LXPAY_WEBHOOK_URL;
    }
    
    // Caso contrário, gerar dinamicamente
    $baseUrl = getBaseUrl();
    return $baseUrl . '/api/LXPAY/webhook.php';
}

// Define a constante com a URL do webhook
if (!defined('LXPAY_WEBHOOK_URL') || LXPAY_WEBHOOK_URL === 'https://seudominio.com.br/LXPAY/webhook.php') {
    define('LXPAY_WEBHOOK_URL', getWebhookUrl());
}

