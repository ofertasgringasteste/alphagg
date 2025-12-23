<?php
/**
 * Endpoint para consultar status de uma transação
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Trata requisições OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/LxpayApi.php';

try {
    // Pega transactionId do GET ou POST
    $transactionId = null;
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $transactionId = $_GET['transactionId'] ?? null;
    } else {
        $input = file_get_contents('php://input');
        $dados = json_decode($input, true);
        $transactionId = $dados['transactionId'] ?? $_POST['transactionId'] ?? null;
    }
    
    if (empty($transactionId)) {
        throw new Exception('Transaction ID é obrigatório');
    }
    
    // Instancia API
    $lxpay = new LxpayApi();
    
    // Consulta transação
    $resultado = $lxpay->consultarTransacao($transactionId);
    
    if ($resultado['success']) {
        echo json_encode([
            'success' => true,
            'data' => $resultado['data']
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    } else {
        http_response_code($resultado['http_code'] ?? 400);
        echo json_encode([
            'success' => false,
            'error' => $resultado['error'] ?? 'Erro ao consultar transação',
            'error_code' => $resultado['error_code'] ?? null
        ], JSON_UNESCAPED_UNICODE);
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

