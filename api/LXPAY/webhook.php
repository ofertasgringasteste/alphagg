<?php
/**
 * Endpoint para receber webhooks da LXPAY
 * Processa notificações de mudanças de status de pagamento
 * Integrado com banco de dados SQLite
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Trata requisições OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/LxpayApi.php';

// Log de webhooks (opcional - para debug)
$logFile = __DIR__ . '/webhook_log.txt';

function logWebhook($message) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    $log = "[{$timestamp}] {$message}\n";
    file_put_contents($logFile, $log, FILE_APPEND);
}

try {
    // Lê dados do webhook
    $input = file_get_contents('php://input');
    $dados = json_decode($input, true);
    
    logWebhook("Webhook recebido: " . $input);
    
    // Valida se recebeu dados
    if (empty($dados)) {
        throw new Exception('Dados do webhook vazios');
    }
    
    // Extrai informações importantes
    $transactionId = $dados['transactionId'] ?? $dados['transaction_id'] ?? null;
    $status = $dados['status'] ?? null;
    $amount = $dados['amount'] ?? null;
    
    if (empty($transactionId)) {
        throw new Exception('Transaction ID não encontrado no webhook');
    }
    
    // ============================================
    // CONECTAR AO BANCO DE DADOS SQLite
    // ============================================
    
    $dbPath = __DIR__ . '/../checkout/database.sqlite';
    
    // Verificar se o arquivo do banco existe
    if (!file_exists($dbPath)) {
        logWebhook("AVISO: Banco de dados não encontrado em {$dbPath}");
        // Criar diretório se não existir
        $dbDir = dirname($dbPath);
        if (!is_dir($dbDir)) {
            mkdir($dbDir, 0755, true);
        }
    }
    
    $db = new PDO("sqlite:$dbPath");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Criar tabela se não existir
    $db->exec("CREATE TABLE IF NOT EXISTS pedidos (
        transaction_id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        valor INTEGER NOT NULL,
        nome TEXT,
        email TEXT,
        cpf TEXT,
        telefone TEXT,
        utm_params TEXT,
        created_at TEXT,
        updated_at TEXT
    )");
    
    // ============================================
    // MAPEAR STATUS LXPAY PARA STATUS DO SISTEMA
    // ============================================
    
    $statusUpper = strtoupper($status ?? '');
    $statusSistema = 'pending'; // Default
    
    switch ($statusUpper) {
        case 'PAID':
        case 'CONFIRMED':
        case 'OK':
        case 'COMPLETED':
            $statusSistema = 'paid';
            break;
            
        case 'PENDING':
        case 'WAITING':
        case 'WAITING_PAYMENT':
            $statusSistema = 'pending';
            break;
            
        case 'CANCELLED':
        case 'CANCELED':
            $statusSistema = 'cancelled';
            break;
            
        case 'EXPIRED':
            $statusSistema = 'expired';
            break;
            
        case 'FAILED':
        case 'ERROR':
            $statusSistema = 'failed';
            break;
            
        default:
            $statusSistema = 'pending';
            logWebhook("Status desconhecido mapeado para 'pending': {$status}");
    }
    
    logWebhook("Status LXPAY: {$status} → Status Sistema: {$statusSistema} - Transaction ID: {$transactionId}");
    
    // ============================================
    // ATUALIZAR STATUS NO BANCO DE DADOS
    // ============================================
    
    $timestamp = date('Y-m-d H:i:s');
    
    // Verificar se a transação existe
    $stmtCheck = $db->prepare("SELECT transaction_id FROM pedidos WHERE transaction_id = :transaction_id");
    $stmtCheck->execute(['transaction_id' => $transactionId]);
    $existe = $stmtCheck->fetch(PDO::FETCH_ASSOC);
    
    if ($existe) {
        // Atualizar transação existente
        $stmt = $db->prepare("UPDATE pedidos SET 
            status = :status,
            updated_at = :updated_at
            WHERE transaction_id = :transaction_id");
        
        $stmt->execute([
            'status' => $statusSistema,
            'updated_at' => $timestamp,
            'transaction_id' => $transactionId
        ]);
        
        logWebhook("Transação atualizada no banco: {$transactionId} → {$statusSistema}");
    } else {
        // Transação não existe no banco - criar registro básico
        // (pode acontecer se o webhook chegar antes do registro ser criado)
        logWebhook("AVISO: Transação não encontrada no banco, criando registro básico: {$transactionId}");
        
        $stmt = $db->prepare("INSERT INTO pedidos (
            transaction_id, status, valor, nome, email, cpf, telefone, utm_params, created_at, updated_at
        ) VALUES (
            :transaction_id, :status, :valor, :nome, :email, :cpf, :telefone, :utm_params, :created_at, :updated_at
        )");
        
        $stmt->execute([
            'transaction_id' => $transactionId,
            'status' => $statusSistema,
            'valor' => $amount ? intval($amount * 100) : 0, // Converter para centavos se amount vier em decimal
            'nome' => null,
            'email' => null,
            'cpf' => null,
            'telefone' => null,
            'utm_params' => null,
            'created_at' => $timestamp,
            'updated_at' => $timestamp
        ]);
        
        logWebhook("Registro básico criado no banco: {$transactionId}");
    }
    
    // ============================================
    // AÇÕES ADICIONAIS BASEADAS NO STATUS
    // ============================================
    
    if ($statusSistema === 'paid') {
        logWebhook("✅ Pagamento confirmado - Transaction ID: {$transactionId}");
        
        // Aqui você pode adicionar:
        // - Enviar e-mail de confirmação
        // - Atualizar estoque
        // - Notificar o cliente
        // - Integrar com sistema de pedidos
    } elseif ($statusSistema === 'failed' || $statusSistema === 'cancelled' || $statusSistema === 'expired') {
        logWebhook("❌ Pagamento {$statusSistema} - Transaction ID: {$transactionId}");
    }
    
    // Responde com sucesso para a LXPAY
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Webhook processado com sucesso',
        'transactionId' => $transactionId,
        'status' => $statusSistema
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    logWebhook("❌ Erro ao processar webhook: " . $e->getMessage());
    logWebhook("Stack trace: " . $e->getTraceAsString());
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

