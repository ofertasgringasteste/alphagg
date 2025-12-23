<?php
// IMPORTANTE: Headers CORS - não remover
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization');
header('Content-Type: application/json');

// Tratar requisições OPTIONS (pre-flight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Verificar se é um POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

// Função para gerar CPF válido
function gerarCPF() {
    $cpf = '';
    for ($i = 0; $i < 9; $i++) {
        $cpf .= rand(0, 9);
    }

    $soma = 0;
    for ($i = 0; $i < 9; $i++) {
        $soma += intval($cpf[$i]) * (10 - $i);
    }
    $resto = $soma % 11;
    $digito1 = ($resto < 2) ? 0 : 11 - $resto;
    $cpf .= $digito1;

    $soma = 0;
    for ($i = 0; $i < 10; $i++) {
        $soma += intval($cpf[$i]) * (11 - $i);
    }
    $resto = $soma % 11;
    $digito2 = ($resto < 2) ? 0 : 11 - $resto;
    $cpf .= $digito2;

    $invalidos = [
        '00000000000', '11111111111', '22222222222', '33333333333', 
        '44444444444', '55555555555', '66666666666', '77777777777', 
        '88888888888', '99999999999'
    ];

    if (in_array($cpf, $invalidos)) {
        return gerarCPF();
    }

    return $cpf;
}

// Função para gerar nome aleatório
function gerarNome() {
    $nomes_masculinos = [
        'João', 'Pedro', 'Lucas', 'Miguel', 'Arthur', 'Gabriel', 'Bernardo', 'Rafael',
        'Gustavo', 'Felipe', 'Daniel', 'Matheus', 'Bruno', 'Thiago', 'Carlos'
    ];

    $nomes_femininos = [
        'Maria', 'Ana', 'Julia', 'Sofia', 'Isabella', 'Helena', 'Valentina', 'Laura',
        'Alice', 'Manuela', 'Beatriz', 'Clara', 'Luiza', 'Mariana', 'Sophia'
    ];

    $sobrenomes = [
        'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 
        'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 
        'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa'
    ];
    
    // Escolher um nome aleatório
    $genero = rand(0, 1);
    $nome = $genero ? 
        $nomes_masculinos[array_rand($nomes_masculinos)] : 
        $nomes_femininos[array_rand($nomes_femininos)];
    
    // Escolher dois sobrenomes
    $sobrenome1 = $sobrenomes[array_rand($sobrenomes)];
    $sobrenome2 = $sobrenomes[array_rand($sobrenomes)];
    
    return "$nome $sobrenome1 $sobrenome2";
}

// Função para gerar um endereço aleatório
function gerarEndereco() {
    $logradouros = ['Rua', 'Avenida', 'Alameda', 'Travessa', 'Praça'];
    $nomes = ['das Flores', 'dos Pinheiros', 'São João', 'Brasil', 'Santos Dumont', 'Ipiranga', 'das Palmeiras', 'dos Girassóis'];
    
    $bairros = ['Centro', 'Jardim América', 'Vila Nova', 'Boa Vista', 'Santa Cecília', 'Bela Vista'];
    
    $cidades = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre', 'Salvador', 'Recife', 'Fortaleza'];
    
    $estados = ['SP', 'RJ', 'MG', 'PR', 'RS', 'BA', 'PE', 'CE'];
    
    // Gerar CEP (8 dígitos)
    $cep = '';
    for ($i = 0; $i < 8; $i++) {
        $cep .= rand(0, 9);
    }
    
    return [
        'rua' => $logradouros[array_rand($logradouros)] . ' ' . $nomes[array_rand($nomes)],
        'numero' => rand(1, 999),
        'complemento' => rand(0, 1) ? 'Apto ' . rand(1, 200) : '',
        'bairro' => $bairros[array_rand($bairros)],
        'cidade' => $cidades[array_rand($cidades)],
        'estado' => $estados[array_rand($estados)],
        'cep' => $cep
    ];
}

// Receber os dados do pedido
$input = json_decode(file_get_contents('php://input'), true);

// Registrar solicitação para depuração
file_put_contents('payment_log.txt', date('Y-m-d H:i:s') . ' - ' . json_encode($input) . "\n", FILE_APPEND);

// Carregar configurações da LXPAY
require_once __DIR__ . '/LXPAY/LxpayApi.php';

// Verificar dados obrigatórios
if (!isset($input['produtos']) || empty($input['produtos'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Produtos não informados']);
    exit;
}

// Preparar os dados para a API LXPAY
$valorTotal = isset($input['total']) ? floatval($input['total']) * 100 : 0; // Valor em centavos
if ($valorTotal <= 0) {
    // Calcular o valor total com base nos produtos
    $valorTotal = 0;
    foreach ($input['produtos'] as $produto) {
        $quantidade = isset($produto['quantidade']) ? intval($produto['quantidade']) : 1;
        $valorTotal += floatval($produto['preco']) * $quantidade * 100; // Converter para centavos
    }
}

// Garantir que o valor seja inteiro
$valorTotal = intval($valorTotal);

// Gerar dados aleatórios do cliente
$nome = gerarNome();
$email = "cliente_" . strtolower(str_replace(' ', '', $nome)) . "@email.com";
$telefone = "11" . rand(900000000, 999999999);
$cpf = gerarCPF();
$endereco = gerarEndereco();

// Capturar parâmetros UTM
$utmParams = [];
if (isset($input['utm']) && is_array($input['utm'])) {
    $utmParams = $input['utm'];
}

// Preparar dados para a API LXPAY
$valorDecimal = $valorTotal / 100; // LXPAY espera valor em decimal

// Preparar produtos para LXPAY
$products = [];
foreach ($input['produtos'] as $produto) {
    $preco = floatval($produto['preco']); // Preço em decimal
    $quantidade = isset($produto['quantidade']) ? intval($produto['quantidade']) : 1;
    
    $products[] = [
        'id' => $produto['id'] ?? uniqid('prod_'),
        'name' => isset($produto['nome']) ? $produto['nome'] : $produto['id'],
        'price' => $preco,
        'quantity' => $quantidade
    ];
}

// Criar objeto de metadados
$metadata = [
    'orderTime' => date('c'),
    'platform' => 'AlphaBurguer',
    'entrega' => $endereco
];

// Adicionar UTMs aos metadados
foreach ($utmParams as $key => $value) {
    if ($value) {
        $metadata['utm_params'][$key] = $value;
    }
}

// Preparar dados para LXPAY
$dadosLxpay = [
    'amount' => $valorDecimal,
    'client' => [
        'name' => $nome,
        'email' => $email,
        'document' => $cpf,
        'phone' => preg_replace('/[^0-9]/', '', $telefone)
    ],
    'products' => $products,
    'metadata' => $metadata
];

// Log do payload antes da chamada
file_put_contents('payment_payload.log', date('Y-m-d H:i:s') . " - Payload LXPAY: " . json_encode($dadosLxpay, JSON_PRETTY_PRINT) . "\n", FILE_APPEND);

// Instanciar API LXPAY e gerar PIX
$lxpay = new LxpayApi();
$resultado = $lxpay->gerarPix($dadosLxpay);

// Verificar resultado
if (!$resultado['success']) {
    http_response_code($resultado['http_code'] ?? 500);
    echo json_encode([
        'success' => false,
        'message' => 'Erro ao gerar PIX: ' . ($resultado['error'] ?? 'Erro na comunicação com o gateway de pagamento'),
        'http_code' => $resultado['http_code'] ?? 500
    ]);
    exit;
}

// Extrair dados da resposta
$responseData = $resultado['data'];
$transactionId = $responseData['transactionId'] ?? null;
$pixData = $responseData['pix'] ?? null;
$qrCode = null;
$qrCodeUrl = null;

// Extrair código PIX
if (is_array($pixData)) {
    $qrCode = $pixData['code'] ?? $pixData['qrcode'] ?? null;
} elseif (is_string($pixData)) {
    $qrCode = $pixData;
}

// Gerar URL do QR Code se não fornecida
if (empty($qrCodeUrl) && !empty($qrCode)) {
    $qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode($qrCode);
}

if (empty($transactionId)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Transaction ID não retornado pela API LXPAY',
        'response' => $responseData
    ]);
    exit;
}

// Função auxiliar para encontrar valores em diferentes caminhos da resposta
function encontrarValorNaResposta($chaves, $obj) {
    foreach ($chaves as $chave) {
        // Verificar caminhos aninhados com notação de ponto
        if (strpos($chave, '.') !== false) {
            $partes = explode('.', $chave);
            $atual = $obj;
            
            foreach ($partes as $parte) {
                if (isset($atual[$parte])) {
                    $atual = $atual[$parte];
                } else {
                    $atual = null;
                    break;
                }
            }
            
            if ($atual !== null) {
                return $atual;
            }
        } 
        // Verificar caminhos diretos
        else if (isset($obj[$chave])) {
            return $obj[$chave];
        }
    }
    return null;
}

// Buscar dados do QR code em vários locais possíveis da resposta
$qrCode = encontrarValorNaResposta([
    'pix.qrcode', 'pix.qrCode', 'pix.qr_code',
    'pixQrCode.code', 'pixQrCode', 'qrCode'
], $responseData);

$qrCodeUrl = encontrarValorNaResposta([
    'pix.qrcode_url', 'pix.qrCodeUrl', 'pix.qr_code_url',
    'pixQrCode.url', 'qrCodeUrl', 'qr_code_url'
], $responseData);

// Se não tiver QR code mas tiver código, gerar QR code
if (!$qrCodeUrl && $qrCode) {
    $qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' . urlencode($qrCode);
}

// Salvar a transação no banco de dados
try {
    $dbPath = __DIR__ . '/database.sqlite';
    $db = new PDO("sqlite:$dbPath");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Criar tabela se não existir
    $db->exec("CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id TEXT,
        external_ref TEXT,
        status TEXT,
        valor INTEGER,
        cliente TEXT,
        produtos TEXT,
        pix_code TEXT,
        qrcode_url TEXT,
        utm_source TEXT,
        utm_medium TEXT,
        utm_campaign TEXT,
        utm_content TEXT,
        utm_term TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
    
    // Inserir na tabela
    $stmt = $db->prepare("INSERT INTO pedidos (
        transaction_id, external_ref, status, valor, cliente, produtos, pix_code, qrcode_url,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term
    ) VALUES (
        :transaction_id, :external_ref, :status, :valor, :cliente, :produtos, :pix_code, :qrcode_url,
        :utm_source, :utm_medium, :utm_campaign, :utm_content, :utm_term
    )");
    
    $stmt->execute([
        'transaction_id' => $transactionId,
        'external_ref' => 'pix_' . time() . '_' . substr(md5(uniqid()), 0, 8),
        'status' => 'pending',
        'valor' => $valorTotal,
        'cliente' => json_encode(['nome' => $nome, 'email' => $email, 'telefone' => $telefone, 'cpf' => $cpf]),
        'produtos' => json_encode($input['produtos']),
        'pix_code' => $qrCode ?? '',
        'qrcode_url' => $qrCodeUrl ?? '',
        'utm_source' => $utmParams['utm_source'] ?? '',
        'utm_medium' => $utmParams['utm_medium'] ?? '',
        'utm_campaign' => $utmParams['utm_campaign'] ?? '',
        'utm_content' => $utmParams['utm_content'] ?? '',
        'utm_term' => $utmParams['utm_term'] ?? ''
    ]);
    
} catch (Exception $e) {
    file_put_contents('db_error.log', date('Y-m-d H:i:s') . ' - ' . $e->getMessage() . "\n", FILE_APPEND);
    // Continuar mesmo com erro no banco - priorizar a experiência do cliente
}

// Preparar dados para UTMify
$utmifyData = [
    'orderId' => $transactionId,
    'platform' => 'PhamelaGourmet',
    'paymentMethod' => 'pix',
    'status' => 'waiting_payment',
    'createdAt' => date('Y-m-d H:i:s'),
    'approvedDate' => null,
    'refundedAt' => null,
    'customer' => [
        'name' => $nome,
        'email' => $email,
        'phone' => $telefone,
        'document' => $cpf,
        'country' => 'BR',
        'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
    ],
    'products' => array_map(function($item) {
        $price = floatval($item['preco']) * 100; // Converter para centavos
        return [
            'id' => $item['id'] ?? '',
            'name' => $item['nome'] ?? '',
            'planId' => null,
            'planName' => null,
            'quantity' => intval($item['quantidade'] ?? 1),
            'priceInCents' => intval($price),
        ];
    }, $input['produtos']),
    'trackingParameters' => [
        'src' => $utmParams['utm_source'] ?? null,
        'sck' => null,
        'utm_source' => $utmParams['utm_source'] ?? 'direct',
        'utm_campaign' => $utmParams['utm_campaign'] ?? 'organic',
        'utm_medium' => $utmParams['utm_medium'] ?? 'website',
        'utm_content' => $utmParams['utm_content'] ?? null,
        'utm_term' => $utmParams['utm_term'] ?? null,
        'utm_id' => null,
    ],
    'commission' => [
        'totalPriceInCents' => $valorTotal,
        'gatewayFeeInCents' => intval($valorTotal * 0.04), // 4% estimativa de taxa
        'userCommissionInCents' => intval($valorTotal * 0.96), // Valor líquido
        'currency' => 'BRL',
    ],
    'isTest' => false,
];

// Enviar notificação para UTMify (status: pending)
$utmifyResult = enviarNotificacaoUTMify($transactionId, 'pending', $utmifyData);
file_put_contents('utmify_result.log', date('Y-m-d H:i:s') . " - " . json_encode($utmifyResult) . "\n", FILE_APPEND);

// Retornar os dados do PIX
$pixData = [
    'success' => true,
    'transactionId' => $transactionId,
    'pixCode' => $qrCode ?? '',
    'qrCodeUrl' => $qrCodeUrl ?? '',
    'expiresAt' => isset($responseData['pix']['expiresAt']) ? $responseData['pix']['expiresAt'] : date('c', strtotime('+60 minutes')),
    'message' => 'PIX gerado com sucesso',
    'cliente' => [
        'nome' => $nome,
        'email' => $email,
        'telefone' => $telefone,
        'cpf' => $cpf
    ],
    'endereco' => $endereco
];

// Retornar resposta
echo json_encode($pixData);

/**
 * Função para enviar notificação para UTMify
 */
function enviarNotificacaoUTMify($transactionId, $status, $utmifyData) {
    // Caminho para o script utmify
    $utmifyScript = $status === 'pending' ? 
        __DIR__ . '/utmify-pendente.php' : 
        __DIR__ . '/utmify.php';
    
    if (!file_exists($utmifyScript)) {
        $utmifyScript = __DIR__ . '/utmify-webhook.php';
    }
    
    // Registrar a tentativa
    file_put_contents('utmify_log.txt', date('Y-m-d H:i:s') . " - Enviando para UTMify: ID: $transactionId, Status: $status\n", FILE_APPEND);
    file_put_contents('utmify_data.log', date('Y-m-d H:i:s') . " - Dados: " . json_encode($utmifyData, JSON_PRETTY_PRINT) . "\n", FILE_APPEND);
    
    // Enviar para UTMify
    try {
        if (file_exists($utmifyScript)) {
            // Incluir o script diretamente
            $GLOBALS['utmify_data'] = $utmifyData;
            include_once $utmifyScript;
            return ['success' => true, 'method' => 'include'];
        } else {
            // Chamar via HTTP como fallback
            $webhookUrl = 'https://' . $_SERVER['HTTP_HOST'] . '/api/utmify-webhook.php';
            
            $context = stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => "Content-Type: application/json\r\n",
                    'content' => json_encode($utmifyData),
                    'timeout' => 5
                ]
            ]);
            
            $result = @file_get_contents($webhookUrl, false, $context);
            return ['success' => true, 'method' => 'http', 'response' => $result];
        }
    } catch (Exception $e) {
        file_put_contents('utmify_error.log', date('Y-m-d H:i:s') . " - Erro: " . $e->getMessage() . "\n", FILE_APPEND);
        return ['success' => false, 'error' => $e->getMessage()];
    }
} 