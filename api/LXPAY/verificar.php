<?php
/**
 * Endpoint para verificar status de uma transação
 * Consulta banco SQLite e retorna status compatível com frontend
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
        $transactionId = $_GET['id'] ?? $_GET['transactionId'] ?? null;
    } else {
        $input = file_get_contents('php://input');
        $dados = json_decode($input, true);
        $transactionId = $dados['id'] ?? $dados['transactionId'] ?? $_POST['id'] ?? $_POST['transactionId'] ?? null;
    }
    
    if (empty($transactionId)) {
        throw new Exception('Transaction ID é obrigatório');
    }
    
    // Limpar ID
    $transactionId = trim($transactionId);
    
    // ============================================
    // CONECTAR AO BANCO DE DADOS SQLite
    // ============================================
    
    $dbPath = __DIR__ . '/../checkout/database.sqlite';
    
    // Verificar se o banco existe
    if (!file_exists($dbPath)) {
        // Retornar status pending se banco não existir
        echo json_encode([
            'success' => true,
            'status' => 'pending',
            'transaction_id' => $transactionId,
            'message' => 'Banco de dados não encontrado'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    $db = new PDO("sqlite:$dbPath");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // ============================================
    // CONSULTAR STATUS NO BANCO
    // ============================================
    
    $stmt = $db->prepare("SELECT status, valor, nome, email, cpf, created_at, updated_at 
                          FROM pedidos 
                          WHERE transaction_id = :transaction_id");
    $stmt->execute(['transaction_id' => $transactionId]);
    $transacao = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($transacao) {
        // Transação encontrada no banco
        $status = $transacao['status'] ?? 'pending';
        
        // Mapear status do banco para formato esperado pelo frontend
        // O frontend espera: 'pending', 'paid', 'approved', 'completed', 'failed', 'error', 'canceled'
        $statusFrontend = $status;
        
        // Garantir compatibilidade com frontend
        if ($status === 'paid') {
            $statusFrontend = 'paid'; // ou 'approved' ou 'completed' - frontend aceita qualquer um
        }
        
        echo json_encode([
            'success' => true,
            'status' => $statusFrontend,
            'transaction_id' => $transactionId,
            'valor' => intval($transacao['valor'] ?? 0),
            'nome' => $transacao['nome'] ?? null,
            'email' => $transacao['email'] ?? null,
            'created_at' => $transacao['created_at'] ?? null,
            'updated_at' => $transacao['updated_at'] ?? null
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        
    } else {
        // Transação não encontrada no banco - consultar API LXPAY diretamente
        try {
            $lxpay = new LxpayApi();
            $resultado = $lxpay->consultarTransacao($transactionId);
            
            if ($resultado['success']) {
                $data = $resultado['data'];
                $statusApi = $data['status'] ?? 'pending';
                
                // Mapear status da API para formato do sistema
                $statusUpper = strtoupper($statusApi);
                $statusSistema = 'pending';
                
                switch ($statusUpper) {
                    case 'PAID':
                    case 'CONFIRMED':
                    case 'OK':
                    case 'COMPLETED':
                        $statusSistema = 'paid';
                        break;
                    case 'PENDING':
                    case 'WAITING':
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
                }
                
                echo json_encode([
                    'success' => true,
                    'status' => $statusSistema,
                    'transaction_id' => $transactionId,
                    'source' => 'api'
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            } else {
                // Erro ao consultar API - retornar pending
                echo json_encode([
                    'success' => true,
                    'status' => 'pending',
                    'transaction_id' => $transactionId,
                    'message' => 'Transação não encontrada no banco e erro ao consultar API'
                ], JSON_UNESCAPED_UNICODE);
            }
        } catch (Exception $apiError) {
            // Erro ao consultar API - retornar pending
            echo json_encode([
                'success' => true,
                'status' => 'pending',
                'transaction_id' => $transactionId,
                'message' => 'Transação não encontrada. Erro ao consultar API: ' . $apiError->getMessage()
            ], JSON_UNESCAPED_UNICODE);
        }
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'status' => 'error',
        'error' => $e->getMessage(),
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

