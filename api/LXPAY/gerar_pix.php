<?php
/**
 * Endpoint para gerar pagamento PIX via LXPAY
 * Recebe dados do checkout e retorna QR Code PIX
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

// Apenas aceita POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Método não permitido. Use POST.'
    ]);
    exit;
}

try {
    // Lê dados do POST
    $input = file_get_contents('php://input');
    $dados = json_decode($input, true);
    
    // Log para debug
    error_log("[LXPAY] 📥 Dados recebidos: " . substr($input, 0, 500));
    
    // Se não veio JSON, tenta pegar do $_POST
    if (empty($dados)) {
        $dados = $_POST;
    }
    
    // Validações básicas
    if (empty($dados)) {
        error_log("[LXPAY] ❌ Dados vazios");
        throw new Exception('Dados não fornecidos');
    }
    
    // ============================================
    // MAPEAMENTO: Formato checkout → Formato LXPAY
    // ============================================
    
    // Extrair dados do formato do checkout
    // Suporta tanto formato direto quanto formato com objeto 'cliente'
    $valor_centavos = isset($dados['valor']) ? intval($dados['valor']) : 0;
    $nome_cliente = $dados['nome'] ?? $dados['cliente']['nome'] ?? null;
    $email_cliente = $dados['email'] ?? $dados['cliente']['email'] ?? null;
    $cpf_cliente = $dados['cpf'] ?? $dados['cliente']['cpf'] ?? null;
    $telefone_cliente = $dados['telefone'] ?? $dados['cliente']['telefone'] ?? null;
    $itens_carrinho = $dados['itens'] ?? [];
    $endereco_cliente = $dados['endereco'] ?? null;
    $utmParams = $dados['utmParams'] ?? [];
    
    // Log dos dados extraídos
    error_log("[LXPAY] 📊 Dados extraídos - Valor: $valor_centavos, Nome: $nome_cliente, Email: $email_cliente, CPF: " . ($cpf_cliente ? 'fornecido' : 'não fornecido'));
    
    // Validações
    if ($valor_centavos <= 0) {
        error_log("[LXPAY] ❌ Valor inválido: $valor_centavos");
        throw new Exception('Valor inválido');
    }
    
    if (empty($nome_cliente) || empty($email_cliente)) {
        error_log("[LXPAY] ❌ Dados do cliente incompletos - Nome: " . ($nome_cliente ? 'OK' : 'VAZIO') . ", Email: " . ($email_cliente ? 'OK' : 'VAZIO'));
        throw new Exception('Nome e email do cliente são obrigatórios');
    }
    
    // Converter valor de centavos para decimal (LXPAY espera decimal)
    $valor_decimal = $valor_centavos / 100;
    
    // Gerar CPF se não fornecido
    if (empty($cpf_cliente)) {
        $cpf_cliente = '';
        for ($i = 0; $i < 9; $i++) {
            $cpf_cliente .= rand(0, 9);
        }
        $soma = 0;
        for ($i = 0; $i < 9; $i++) {
            $soma += intval($cpf_cliente[$i]) * (10 - $i);
        }
        $resto = $soma % 11;
        $digito1 = ($resto < 2) ? 0 : 11 - $resto;
        $cpf_cliente .= $digito1;
        $soma = 0;
        for ($i = 0; $i < 10; $i++) {
            $soma += intval($cpf_cliente[$i]) * (11 - $i);
        }
        $resto = $soma % 11;
        $digito2 = ($resto < 2) ? 0 : 11 - $resto;
        $cpf_cliente .= $digito2;
    }
    
    // Limpar CPF (remover formatação)
    $cpf_cliente = preg_replace('/[^0-9]/', '', $cpf_cliente);
    
    // Validar tamanho do CPF
    if (!empty($cpf_cliente) && strlen($cpf_cliente) !== 11) {
        error_log("[LXPAY] ❌ CPF inválido (tamanho): $cpf_cliente (tamanho: " . strlen($cpf_cliente) . ")");
        // Não lançar exceção, deixar a classe LxpayApi validar (ela pode gerar um CPF válido se necessário)
    }
    
    // Limpar telefone
    $telefone_cliente = $telefone_cliente ? preg_replace('/[^0-9]/', '', $telefone_cliente) : '11999999999';
    
    // Validar telefone (deve ter pelo menos 10 dígitos)
    if (strlen($telefone_cliente) < 10) {
        $telefone_cliente = '11999999999'; // Telefone padrão se inválido
    }
    
    // Preparar estrutura de dados para LXPAY
    $dadosLxpay = [
        'amount' => $valor_decimal,
        'client' => [
            'name' => $nome_cliente,
            'email' => $email_cliente,
            'document' => $cpf_cliente
        ]
    ];
    
    // Adicionar telefone se fornecido
    if (!empty($telefone_cliente)) {
        $dadosLxpay['client']['phone'] = $telefone_cliente;
    }
    
    // Preparar produtos/itens se houver
    if (!empty($itens_carrinho) && is_array($itens_carrinho)) {
        $products = [];
        foreach ($itens_carrinho as $item) {
            // Mapear formato do checkout para formato LXPAY
            $preco = 0;
            if (isset($item['precoPromocional'])) {
                $preco = floatval($item['precoPromocional']);
            } elseif (isset($item['precoOriginal'])) {
                $preco = floatval($item['precoOriginal']);
            } elseif (isset($item['preco'])) {
                $preco = floatval($item['preco']);
            }
            
            $products[] = [
                'id' => $item['id'] ?? $item['idProduto'] ?? uniqid('prod_'),
                'name' => $item['nome'] ?? $item['nomeProduto'] ?? 'Produto',
                'quantity' => intval($item['quantidade'] ?? $item['qtdeProduto'] ?? 1),
                'price' => $preco
            ];
        }
        if (!empty($products)) {
            $dadosLxpay['products'] = $products;
        }
    }
    
    // Preparar metadata
    $metadata = [
        'pedido_id' => uniqid('ped_'),
        'fonte' => 'alphaburguer',
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    // Adicionar endereço no metadata se houver
    if (!empty($endereco_cliente)) {
        $metadata['entrega'] = $endereco_cliente;
    }
    
    // Adicionar parâmetros UTM no metadata
    if (!empty($utmParams) && is_array($utmParams)) {
        $metadata['utm_params'] = $utmParams;
    }
    
    $dadosLxpay['metadata'] = $metadata;
    
    // ============================================
    // CONECTAR AO BANCO DE DADOS SQLite
    // ============================================
    
    // Caminho do banco de dados (usar o mesmo do checkout)
    $dbPath = __DIR__ . '/../checkout/database.sqlite';
    
    // Conecta ao SQLite
    $db = new PDO("sqlite:$dbPath");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Criar tabela se não existir (estrutura compatível)
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
    // GERAR PIX VIA API LXPAY
    // ============================================
    
    // Log dos dados que serão enviados para LXPAY
    error_log("[LXPAY] 📤 Dados preparados para LXPAY: " . json_encode($dadosLxpay, JSON_UNESCAPED_UNICODE));
    
    $lxpay = new LxpayApi();
    $resultado = $lxpay->gerarPix($dadosLxpay);
    
    // Log da resposta
    error_log("[LXPAY] 📥 Resposta da API: " . json_encode($resultado, JSON_UNESCAPED_UNICODE));
    
    if (!$resultado['success']) {
        $erro = $resultado['error'] ?? 'Erro ao gerar PIX na API LXPAY';
        $detalhes = isset($resultado['details']) ? ' - Detalhes: ' . json_encode($resultado['details']) : '';
        $httpCode = isset($resultado['http_code']) ? ' - HTTP: ' . $resultado['http_code'] : '';
        error_log("[LXPAY] ❌ Erro: $erro$detalhes$httpCode");
        throw new Exception($erro);
    }
    
    // Extrair dados da resposta
    $responseData = $resultado['data'] ?? [];
    error_log("[LXPAY] 📊 Response Data: " . json_encode($responseData, JSON_UNESCAPED_UNICODE));
    
    // Tentar extrair transactionId de vários campos possíveis
    $transactionId = $responseData['transactionId'] ?? 
                     $responseData['transaction_id'] ?? 
                     $responseData['id'] ?? 
                     $responseData['order']['id'] ?? 
                     null;
    
    // Tentar extrair código PIX de vários campos possíveis
    $pixData = $responseData['pix'] ?? $responseData['pixCode'] ?? null;
    $pixCode = null;
    $qrCodeUrl = null;
    
    // Extrair código PIX da resposta
    if (is_array($pixData)) {
        $pixCode = $pixData['code'] ?? $pixData['qrcode'] ?? $pixData['qrCode'] ?? null;
        $qrCodeUrl = $pixData['qrCodeUrl'] ?? $pixData['qr_code_image_url'] ?? $pixData['imageUrl'] ?? null;
    } elseif (is_string($pixData)) {
        $pixCode = $pixData;
    }
    
    // Se não encontrou no pixData, tentar diretamente na resposta
    if (empty($pixCode)) {
        $pixCode = $responseData['pixCode'] ?? 
                   $responseData['qrcode'] ?? 
                   $responseData['code'] ?? 
                   null;
    }
    
    // Gerar URL do QR Code se não fornecida
    if (empty($qrCodeUrl) && !empty($pixCode)) {
        $qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode($pixCode);
    }
    
    error_log("[LXPAY] ✅ Transaction ID: $transactionId, PIX Code: " . ($pixCode ? substr($pixCode, 0, 50) . '...' : 'NÃO ENCONTRADO'));
    
    if (empty($transactionId)) {
        error_log("[LXPAY] ❌ Transaction ID não encontrado. Resposta completa: " . json_encode($responseData, JSON_UNESCAPED_UNICODE));
        throw new Exception('Transaction ID não retornado pela API LXPAY');
    }
    
    // ============================================
    // SALVAR TRANSAÇÃO NO BANCO DE DADOS
    // ============================================
    
    $timestamp = date('Y-m-d H:i:s');
    $utmParamsJson = !empty($utmParams) ? json_encode($utmParams) : null;
    
    $stmt = $db->prepare("INSERT OR REPLACE INTO pedidos (
        transaction_id, status, valor, nome, email, cpf, telefone, utm_params, created_at, updated_at
    ) VALUES (
        :transaction_id, :status, :valor, :nome, :email, :cpf, :telefone, :utm_params, :created_at, :updated_at
    )");
    
    $stmt->execute([
        'transaction_id' => $transactionId,
        'status' => 'pending',
        'valor' => $valor_centavos,
        'nome' => $nome_cliente,
        'email' => $email_cliente,
        'cpf' => $cpf_cliente,
        'telefone' => $telefone_cliente,
        'utm_params' => $utmParamsJson,
        'created_at' => $timestamp,
        'updated_at' => $timestamp
    ]);
    
    // ============================================
    // RETORNAR RESPOSTA COMPATÍVEL COM FRONTEND
    // ============================================
    
    echo json_encode([
        'success' => true,
        'transactionId' => $transactionId,
        'token' => $transactionId, // Compatibilidade com frontend
        'status' => 'pending',
        'pixCode' => $pixCode,
        'qrcode' => $pixCode, // Compatibilidade
        'qrCodeUrl' => $qrCodeUrl,
        'qr_code_image_url' => $qrCodeUrl, // Compatibilidade
        'pix' => [
            'code' => $pixCode
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    
} catch (Exception $e) {
    error_log("[LXPAY] ❌ Exceção capturada: " . $e->getMessage());
    error_log("[LXPAY] 🔍 Stack trace: " . $e->getTraceAsString());
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'message' => $e->getMessage() // Compatibilidade
    ], JSON_UNESCAPED_UNICODE);
}

