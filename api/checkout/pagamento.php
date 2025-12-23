<?php
// Habilita o log de erros
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Cabeçalhos CORS melhorados
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization');
header('Access-Control-Max-Age: 86400'); // Cache preflight por 24 horas

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Log de debug inicial
error_log("[Monetrix] 🚀 Iniciando processamento de pagamento");
error_log("[Monetrix] 📝 Método: " . $_SERVER['REQUEST_METHOD']);
error_log("[Monetrix] 📦 Input bruto: " . file_get_contents('php://input'));

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

try {
    // Carregar configurações da LXPAY
    require_once __DIR__ . '/../LXPAY/LxpayApi.php';
    
    error_log("[LXPAY] 🚀 Iniciando processamento de pagamento");

    // Caminho do banco de dados - Usando variáveis de ambiente para Vercel
    $dbPath = getenv('DB_PATH') ?: __DIR__ . '/database.sqlite'; 
    
    // Conecta ao SQLite (arquivo de banco de dados)
    $db = new PDO("sqlite:$dbPath");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Verifica se a tabela 'pedidos' existe e cria se necessário
    $db->exec("CREATE TABLE IF NOT EXISTS pedidos (
        transaction_id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        valor INTEGER NOT NULL,
        nome TEXT,
        email TEXT,
        cpf TEXT,
        utm_params TEXT,
        created_at TEXT,
        updated_at TEXT
    )");

    // Recebe os parâmetros do frontend
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Usar dados do frontend se disponíveis, senão usar valores padrão
    $valor_centavos = $input['valor'] ?? 9358; // Valor em centavos
    $nome_cliente = $input['nome'] ?? null;
    $telefone_cliente = $input['telefone'] ?? "11999999999";
    $email_cliente = $input['email'] ?? "clienteteste@gmail.com";
    $cpf_cliente = $input['cpf'] ?? null;
    $itens_carrinho = $input['itens'] ?? [];

    if (!$valor_centavos || $valor_centavos <= 0) {
        throw new Exception('Valor inválido');
    }

    // Gera dados do cliente
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

    // Parâmetros UTM do frontend
    $utmParams = [
        'utm_source' => $input['utm_source'] ?? null,
        'utm_medium' => $input['utm_medium'] ?? null,
        'utm_campaign' => $input['utm_campaign'] ?? null,
        'utm_content' => $input['utm_content'] ?? null,
        'utm_term' => $input['utm_term'] ?? null,
        'xcod' => $input['xcod'] ?? null,
        'sck' => $input['sck'] ?? null,
        'fbclid' => $input['fbclid'] ?? null,
        'gclid' => $input['gclid'] ?? null,
        'ttclid' => $input['ttclid'] ?? null
    ];

    $utmParams = array_filter($utmParams, function($value) {
        return $value !== null && $value !== '';
    });

    error_log("[LXPAY] 📊 Parâmetros UTM recebidos: " . json_encode($utmParams));

    // Gera dados do cliente se não fornecidos
    if (!$nome_cliente) {
        $genero = rand(0, 1);
        $nome = $genero ? 
            $nomes_masculinos[array_rand($nomes_masculinos)] : 
            $nomes_femininos[array_rand($nomes_femininos)];
        
        $sobrenome1 = $sobrenomes[array_rand($sobrenomes)];
        $sobrenome2 = $sobrenomes[array_rand($sobrenomes)];
        
        $nome_cliente = "$nome $sobrenome1 $sobrenome2";
    }
    
    $email = $email_cliente;
    $cpf = $cpf_cliente ?: gerarCPF();
    $cpf = preg_replace('/[^0-9]/', '', $cpf);
    $telefone_limpo = preg_replace('/[^0-9]/', '', $telefone_cliente);

    error_log("[LXPAY] 📝 Preparando dados para envio: " . json_encode([
        'valor_centavos' => $valor_centavos,
        'nome' => $nome_cliente,
        'email' => $email,
        'cpf' => $cpf,
        'telefone' => $telefone_limpo,
        'itens_recebidos' => $itens_carrinho
    ]));

    // Converter valor de centavos para decimal (LXPAY espera decimal)
    $valor_decimal = $valor_centavos / 100;

    // Preparar produtos para LXPAY
    $products = [];
    if (count($itens_carrinho) > 0) {
        foreach ($itens_carrinho as $item) {
            $preco = isset($item['precoPromocional']) ? 
                floatval($item['precoPromocional']) : 
                (isset($item['precoOriginal']) ? floatval($item['precoOriginal']) : ($valor_decimal / count($itens_carrinho)));
            
            $products[] = [
                'id' => $item['id'] ?? uniqid('prod_'),
                'name' => $item['nome'] ?? 'Produto',
                'price' => $preco,
                'quantity' => intval($item['quantidade'] ?? 1)
            ];
        }
    }

    // Preparar dados para LXPAY
    $dadosLxpay = [
        'amount' => $valor_decimal,
        'client' => [
            'name' => $nome_cliente,
            'email' => $email,
            'document' => $cpf,
            'phone' => $telefone_limpo
        ],
        'products' => $products,
        'metadata' => [
            'utm_params' => $utmParams,
            'platform' => 'AlphaBurguer'
        ]
    ];

    error_log("[LXPAY] 📦 Dados enviados: " . json_encode($dadosLxpay));

    // Instanciar API LXPAY e gerar PIX
    $lxpay = new LxpayApi();
    $resultado = $lxpay->gerarPix($dadosLxpay);

    if (!$resultado['success']) {
        error_log("[LXPAY] ❌ Erro ao gerar PIX: " . ($resultado['error'] ?? 'Erro desconhecido'));
        throw new Exception("Erro na API LXPAY: " . ($resultado['error'] ?? 'Erro desconhecido'));
    }

    $result = $resultado['data'];
    $transactionId = $result['transactionId'] ?? null;
    $pixData = $result['pix'] ?? null;

    if (!$transactionId) {
        error_log("[LXPAY] ❌ Transaction ID não encontrado na resposta");
        error_log("[LXPAY] 📄 Estrutura recebida: " . print_r($result, true));
        throw new Exception("ID da transação não encontrado na resposta");
    }

    // Extrair código PIX
    $pixCode = null;
    if (is_array($pixData)) {
        $pixCode = $pixData['code'] ?? $pixData['qrcode'] ?? null;
    } elseif (is_string($pixData)) {
        $pixCode = $pixData;
    }

    error_log("[LXPAY] ✅ Transação criada com sucesso: " . $transactionId);
    if ($pixCode) {
        error_log("[LXPAY] ✅ QR Code encontrado: " . substr($pixCode, 0, 50) . "...");
    } else {
        error_log("[LXPAY] ⚠️ QR Code não encontrado na resposta");
    }

    // Salva os dados no SQLite
    $stmt = $db->prepare("INSERT INTO pedidos (transaction_id, status, valor, nome, email, cpf, utm_params, created_at) 
        VALUES (:transaction_id, 'pending', :valor, :nome, :email, :cpf, :utm_params, :created_at)");
    $stmt->execute([
        'transaction_id' => $transactionId,
        'valor' => $valor_centavos,
        'nome' => $nome_cliente,
        'email' => $email,
        'cpf' => $cpf,
        'utm_params' => json_encode($utmParams),
        'created_at' => date('c')
    ]);

    session_start();
    $_SESSION['payment_id'] = $transactionId;

    error_log("[LXPAY] 💳 Transação criada com sucesso: " . $transactionId);
    error_log("[LXPAY] 🔑 Token gerado: " . $transactionId);

    error_log("[Sistema] 📡 Iniciando comunicação com utmify-pendente.php");

    $utmifyData = [
        'orderId' => $transactionId,
        'platform' => 'LXPAY',
        'paymentMethod' => 'pix',
        'status' => 'waiting_payment',
        'createdAt' => date('Y-m-d H:i:s'),
        'approvedDate' => null,
        'refundedAt' => null,
        'customer' => [
            'name' => $nome_cliente,
            'email' => $email,
            'phone' => $telefone_cliente,
            'document' => $cpf,
            'country' => 'BR',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? null
        ],
        'products' => [
            [
                'id' => uniqid('PROD_'),
                'name' => 'Liberação de Benefício',
                'planId' => null,
                'planName' => null,
                'quantity' => 1,
                'priceInCents' => $valor_centavos
            ]
        ],
        'trackingParameters' => $utmParams,
        'commission' => [
            'totalPriceInCents' => $valor_centavos,
            'gatewayFeeInCents' => 0, // Monetrix não retorna fee na criação
            'userCommissionInCents' => $valor_centavos
        ],
        'isTest' => false
    ];

    error_log("[Utmify] 📦 Preparando dados para envio ao utmify-pendente.php: " . json_encode($utmifyData));

    // Envia para utmify-pendente.php
    error_log("[Sistema] 📡 Enviando requisição POST para ../utmify-pendente.php");
    
    $serverUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]";
    $utmifyUrl = $serverUrl . "/checkout/utmify-pendente.php";
    error_log("[Sistema] 🔍 URL do utmify-pendente.php: " . $utmifyUrl);
    
    $ch = curl_init($utmifyUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($utmifyData),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_TIMEOUT => 10, // Timeout de 10 segundos
        CURLOPT_CONNECTTIMEOUT => 5 // Timeout de conexão de 5 segundos
    ]);

    $utmifyResponse = curl_exec($ch);
    $utmifyHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $utmifyError = curl_error($ch);
    $utmifyErrno = curl_errno($ch);
    
    curl_close($ch);

    // Log da tentativa de envio para utmify (não bloquear se falhar)
    if ($utmifyError) {
        error_log("[Sistema] ⚠️ Erro ao conectar com utmify-pendente.php: " . $utmifyError);
    } elseif ($utmifyHttpCode !== 200) {
        error_log("[Sistema] ⚠️ Erro HTTP do utmify-pendente.php ($utmifyHttpCode): " . $utmifyResponse);
    } else {
        error_log("[Sistema] ✅ Dados enviados com sucesso para utmify-pendente.php");
        error_log("[Sistema] ✉️ Resposta: " . $utmifyResponse);
    }

    // Função para buscar QR code em diferentes locais da resposta
    function findQRCode($result) {
        $possiblePaths = [
            'pix.qrcode',
            'pix.qrCode', 
            'pix.code',
            'qrcode',
            'qrCode',
            'code'
        ];
        
        foreach ($possiblePaths as $path) {
            $parts = explode('.', $path);
            $current = $result;
            
            foreach ($parts as $part) {
                if (isset($current[$part])) {
                    $current = $current[$part];
                } else {
                    $current = null;
                    break;
                }
            }
            
            if ($current && is_string($current)) {
                return $current;
            }
        }
        
        return null;
    }

    // Buscar QR code na resposta
    $pixCode = findQRCode($result);
    
    if ($pixCode) {
        error_log("[Monetrix] ✅ QR Code encontrado: " . substr($pixCode, 0, 50) . "...");
    } else {
        error_log("[Monetrix] ⚠️ QR Code não encontrado na resposta");
        error_log("[Monetrix] 📄 Estrutura completa da resposta: " . print_r($result, true));
    }

    // Preparar resposta adaptada para LXPAY
    $qrCodeUrl = $pixCode ? 
        'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode($pixCode) : 
        null;
    
    $responseData = [
        'success' => true,
        'token' => $transactionId,
        'transactionId' => $transactionId,
        'pixCode' => $pixCode,
        'qrcode' => $pixCode,
        'qrCodeUrl' => $qrCodeUrl,
        'qr_code_image_url' => $qrCodeUrl,
        'valor' => $valor_centavos,
        'status' => 'pending',
        'logs' => [
            'utmParams' => $utmParams,
            'transacao' => [
                'valor' => $valor_centavos,
                'cliente' => $nome_cliente,
                'email' => $email,
                'cpf' => $cpf,
                'telefone' => $telefone_cliente
            ],
            'utmifyResponse' => [
                'status' => $utmifyHttpCode,
                'resposta' => $utmifyResponse
            ],
            'monetrixResponse' => $result
        ]
    ];

    error_log("[Monetrix] 📤 Enviando resposta ao frontend: " . json_encode($responseData));
    echo json_encode($responseData);

} catch (Exception $e) {
    error_log("[Monetrix] ❌ Erro: " . $e->getMessage());
    error_log("[Monetrix] 🔍 Stack trace: " . $e->getTraceAsString());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erro ao gerar o PIX: ' . $e->getMessage(),
        'error_details' => [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]
    ]);
}
?>