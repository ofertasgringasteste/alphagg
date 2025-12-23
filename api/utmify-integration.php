<?php
// Integração completa com UTMify
header('Content-Type: application/json');

// Configurações UTMify
define('UTMIFY_API_URL', 'https://api.utmify.com.br/api-credentials/orders');
define('UTMIFY_API_TOKEN', 'P451K2gkmXTpXoryz4gH8JUlMwEAA8cY0UEQ');

// Preparar diretório de logs
$logDir = __DIR__ . '/logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}

// Log de depuração
$debugLog = $logDir . '/utmify_integration_' . date('Y-m-d') . '.log';
function logDebug($message) {
    global $debugLog;
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($debugLog, "[$timestamp] $message\n", FILE_APPEND);
}

/**
 * Função para enviar evento PIX Gerado para UTMify
 */
function enviarPixGeradoUTMify($dadosTransacao) {
    logDebug("🔄 Enviando PIX gerado para UTMify...");
    
    // Preparar dados no formato UTMify
    $utmifyData = [
        'orderId' => $dadosTransacao['transaction_id'],
        'platform' => 'Monetrix',
        'paymentMethod' => 'pix',
        'status' => 'waiting_payment',
        'createdAt' => gmdate('Y-m-d H:i:s', strtotime($dadosTransacao['created_at'])),
        'approvedDate' => null,
        'refundedAt' => null,
        'customer' => [
            'name' => $dadosTransacao['customer']['name'],
            'email' => $dadosTransacao['customer']['email'],
            'phone' => $dadosTransacao['customer']['phone'] ?? null,
            'document' => $dadosTransacao['customer']['document'],
            'country' => 'BR',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? null
        ],
        'products' => $dadosTransacao['products'],
        'trackingParameters' => $dadosTransacao['utm_params'],
        'commission' => [
            'totalPriceInCents' => $dadosTransacao['amount_cents'],
            'gatewayFeeInCents' => 0,
            'userCommissionInCents' => $dadosTransacao['amount_cents']
        ],
        'isTest' => false
    ];
    
    return enviarParaUTMify($utmifyData, 'PIX_GERADO');
}

/**
 * Função para enviar evento PIX Pago para UTMify
 */
function enviarPixPagoUTMify($dadosTransacao) {
    logDebug("💰 Enviando PIX pago para UTMify...");
    
    // Preparar dados no formato UTMify
    $utmifyData = [
        'orderId' => $dadosTransacao['transaction_id'],
        'platform' => 'Monetrix',
        'paymentMethod' => 'pix',
        'status' => 'paid',
        'createdAt' => gmdate('Y-m-d H:i:s', strtotime($dadosTransacao['created_at'])),
        'approvedDate' => gmdate('Y-m-d H:i:s', strtotime($dadosTransacao['paid_at'] ?? $dadosTransacao['updated_at'])),
        'refundedAt' => null,
        'customer' => [
            'name' => $dadosTransacao['customer']['name'],
            'email' => $dadosTransacao['customer']['email'],
            'phone' => $dadosTransacao['customer']['phone'] ?? null,
            'document' => $dadosTransacao['customer']['document'],
            'country' => 'BR',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? null
        ],
        'products' => $dadosTransacao['products'],
        'trackingParameters' => $dadosTransacao['utm_params'],
        'commission' => [
            'totalPriceInCents' => $dadosTransacao['amount_cents'],
            'gatewayFeeInCents' => 0,
            'userCommissionInCents' => $dadosTransacao['amount_cents']
        ],
        'isTest' => false
    ];
    
    return enviarParaUTMify($utmifyData, 'PIX_PAGO');
}

/**
 * Função base para enviar dados para UTMify
 */
function enviarParaUTMify($data, $tipo) {
    logDebug("📤 Enviando para UTMify - Tipo: $tipo");
    logDebug("📄 Dados: " . json_encode($data, JSON_PRETTY_PRINT));
    
    // Preparar requisição cURL
    $ch = curl_init(UTMIFY_API_URL);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'x-api-token: ' . UTMIFY_API_TOKEN
        ],
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_TIMEOUT => 30
    ]);
    
    // Executar requisição
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    // Log da resposta
    logDebug("📨 Resposta UTMify - HTTP: $httpCode");
    if ($error) {
        logDebug("❌ Erro cURL: $error");
        return ['success' => false, 'error' => $error];
    }
    
    logDebug("✅ Resposta UTMify: $response");
    
    if ($httpCode === 200) {
        return ['success' => true, 'response' => json_decode($response, true)];
    } else {
        return ['success' => false, 'http_code' => $httpCode, 'response' => $response];
    }
}

/**
 * Função para extrair parâmetros UTM do localStorage ou URL
 */
function extrairParametrosUTM($utmParamsString = null) {
    $params = [
        'src' => null,
        'sck' => null,
        'utm_source' => null,
        'utm_campaign' => null,
        'utm_medium' => null,
        'utm_content' => null,
        'utm_term' => null,
        'xcod' => null,
        'fbclid' => null,
        'gclid' => null,
        'ttclid' => null
    ];
    
    if ($utmParamsString) {
        $decoded = json_decode($utmParamsString, true);
        if ($decoded && is_array($decoded)) {
            foreach ($params as $key => $value) {
                if (isset($decoded[$key])) {
                    $params[$key] = $decoded[$key];
                }
            }
        }
    }
    
    return $params;
}

/**
 * Função para formatar dados do produto
 */
function formatarProdutos($itens) {
    $produtos = [];
    
    if (is_array($itens)) {
        foreach ($itens as $item) {
            $produtos[] = [
                'id' => $item['id'] ?? uniqid(),
                'name' => $item['nome'] ?? $item['name'] ?? 'Produto',
                'planId' => null,
                'planName' => null,
                'quantity' => (int)($item['quantidade'] ?? $item['quantity'] ?? 1),
                'priceInCents' => (int)(($item['precoPromocional'] ?? $item['precoUnitario'] ?? $item['unitPrice'] ?? 0) * 100)
            ];
        }
    }
    
    return $produtos;
}

// Se for uma chamada direta via POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if ($input && isset($input['action'])) {
        $action = $input['action'];
        $dadosTransacao = $input['data'];
        
        if ($action === 'pix_gerado') {
            $resultado = enviarPixGeradoUTMify($dadosTransacao);
        } elseif ($action === 'pix_pago') {
            $resultado = enviarPixPagoUTMify($dadosTransacao);
        } else {
            $resultado = ['success' => false, 'error' => 'Ação inválida'];
        }
        
        echo json_encode($resultado);
    } else {
        echo json_encode(['success' => false, 'error' => 'Dados inválidos']);
    }
    exit;
}
?> 