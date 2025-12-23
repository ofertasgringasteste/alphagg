<?php
// Habilitar log de erros
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Carregar configurações da API LXPAY
require_once __DIR__ . '/LXPAY/LxpayApi.php';

// Preparar diretório de logs
$logDir = __DIR__ . '/logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}

// Log de depuração em arquivo
$debugLog = $logDir . '/verify_' . date('Y-m-d') . '.log';
function logDebug($message) {
    global $debugLog;
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($debugLog, "[$timestamp] $message\n", FILE_APPEND);
}

// Adicionar cabeçalhos CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Lidar com requisições preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Log do início da requisição
logDebug("Iniciando verificação de status - Método: " . $_SERVER['REQUEST_METHOD']);

// Obter o ID da transação da query ou do post
$id = $_GET['id'] ?? $_POST['id'] ?? null;

if (!$id) {
    logDebug("ID da transação não fornecido");
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'ID da transação não fornecido'
    ]);
    exit;
}

logDebug("Verificando transação: $id");

try {
    // Primeiro, buscar no banco de dados local
    $dbPath = __DIR__ . '/../checkout/database.sqlite';
    
    if (file_exists($dbPath)) {
        $db = new PDO("sqlite:$dbPath");
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Buscar transação pelo transaction_id
        $stmt = $db->prepare("SELECT * FROM pedidos WHERE transaction_id = :id LIMIT 1");
        $stmt->execute(['id' => $id]);
        $transaction = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($transaction) {
            logDebug("Transação encontrada no banco de dados local: " . json_encode($transaction));
            
            // Se o status já for 'paid', retornar imediatamente
            if ($transaction['status'] === 'paid') {
                echo json_encode([
                    'success' => true,
                    'status' => 'paid',
                    'transaction_id' => $transaction['transaction_id'],
                    'updated_at' => $transaction['updated_at'],
                    'source' => 'database'
                ]);
                exit;
            }
            
            // Consultar API LXPAY para status atualizado
            logDebug("Consultando API LXPAY para o ID: " . $transaction['transaction_id']);
            
            $lxpay = new LxpayApi();
            $resultado = $lxpay->consultarTransacao($transaction['transaction_id']);
            
            if ($resultado['success']) {
                $apiData = $resultado['data'];
                $apiStatus = $apiData['status'] ?? 'unknown';
                
                // Mapear status LXPAY para status do sistema
                $statusUpper = strtoupper($apiStatus);
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
                }
                
                // Atualizar o status no banco de dados se for diferente
                if ($statusSistema !== $transaction['status']) {
                    $updateStmt = $db->prepare("UPDATE pedidos SET status = :status, updated_at = :updated_at WHERE transaction_id = :transaction_id");
                    $updateStmt->execute([
                        'status' => $statusSistema,
                        'updated_at' => date('Y-m-d H:i:s'),
                        'transaction_id' => $transaction['transaction_id']
                    ]);
                    logDebug("Status atualizado no banco de dados: " . $statusSistema);
                }
                
                // Retornar o status da API
                echo json_encode([
                    'success' => true,
                    'status' => $statusSistema,
                    'transaction_id' => $transaction['transaction_id'],
                    'updated_at' => date('Y-m-d H:i:s'),
                    'source' => 'api'
                ]);
                exit;
            } else {
                logDebug("Erro ao consultar API LXPAY. Usando status do banco");
                // Se houver erro na API, retornar o status do banco de dados
                echo json_encode([
                    'success' => true,
                    'status' => $transaction['status'],
                    'transaction_id' => $transaction['transaction_id'],
                    'updated_at' => $transaction['updated_at'],
                    'source' => 'database_fallback',
                    'api_error' => $resultado['error'] ?? 'Erro desconhecido'
                ]);
                exit;
            }
        }
        // Se não encontrou no banco de dados, tentar diretamente na API
    }
    
    // Se chegou aqui, ou não tem banco de dados ou não encontrou a transação
    // Tentar consultar diretamente na API LXPAY
    logDebug("Transação não encontrada no banco de dados. Consultando API LXPAY diretamente: $id");
    
    $lxpay = new LxpayApi();
    $resultado = $lxpay->consultarTransacao($id);
    
    if ($resultado['success']) {
        $apiData = $resultado['data'];
        $apiStatus = $apiData['status'] ?? 'unknown';
        
        // Mapear status
        $statusUpper = strtoupper($apiStatus);
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
        }
        
        echo json_encode([
            'success' => true,
            'status' => $statusSistema,
            'transaction_id' => $id,
            'updated_at' => date('Y-m-d H:i:s'),
            'source' => 'api_direct'
        ]);
    } else {
        // Se não encontrou na API, retornar erro
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Transação não encontrada',
            'api_error' => $resultado['error'] ?? 'Erro desconhecido'
        ]);
    }
    } catch (Exception $e) {
    logDebug("Erro: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erro ao verificar status: ' . $e->getMessage()
    ]);
}
?> 