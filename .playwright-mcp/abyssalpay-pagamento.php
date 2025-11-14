<?php
/**
 * Processamento de pagamento PIX IN via Abyssal Pay
 * 
 * Este arquivo processa requisições de pagamento PIX e gera QR Code
 */

// Habilita o log de erros
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Cabeçalhos CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization');
header('Access-Control-Max-Age: 86400');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Validar método HTTP - aceitar POST e GET (GET para debug)
if (!in_array($_SERVER['REQUEST_METHOD'], ['POST', 'GET'])) {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Método não permitido. Use POST.',
        'method' => $_SERVER['REQUEST_METHOD']
    ]);
    exit(0);
}

// Carregar configurações
require_once __DIR__ . '/../abyssalpay_config.php';

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
    // Caminho do banco de dados
    $dbPath = __DIR__ . '/database.sqlite';
    
    // Conecta ao SQLite
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
        telefone TEXT,
        utm_params TEXT,
        created_at TEXT,
        updated_at TEXT
    )");

    // Recebe os parâmetros do frontend
    $input = json_decode(file_get_contents('php://input'), true);
    
    error_log("[AbyssalPay] 🚀 Iniciando processamento de pagamento");
    error_log("[AbyssalPay] 📝 Método: " . $_SERVER['REQUEST_METHOD']);
    error_log("[AbyssalPay] 📦 Input recebido: " . json_encode($input));
    
    // Usar dados do frontend se disponíveis, senão usar valores padrão
    $valor = isset($input['valor']) ? floatval($input['valor']) : 0;
    $nome_cliente = $input['nome'] ?? null;
    $telefone_cliente = $input['telefone'] ?? "11999999999";
    $email_cliente = $input['email'] ?? "clienteteste@gmail.com";
    $cpf_cliente = $input['cpf'] ?? null;
    $itens_carrinho = $input['itens'] ?? [];

    // Validar valor
    if ($valor <= 0) {
        throw new Exception('Valor inválido');
    }

    // Converter valor para formato decimal (Abyssal Pay espera decimal, não centavos)
    $valor_decimal = $valor / 100;

    // Parâmetros UTM do frontend
    $utmParams = [
        'utm_source' => $input['utm_source'] ?? ($input['utmParams']['utm_source'] ?? null),
        'utm_medium' => $input['utm_medium'] ?? ($input['utmParams']['utm_medium'] ?? null),
        'utm_campaign' => $input['utm_campaign'] ?? ($input['utmParams']['utm_campaign'] ?? null),
        'utm_content' => $input['utm_content'] ?? ($input['utmParams']['utm_content'] ?? null),
        'utm_term' => $input['utm_term'] ?? ($input['utmParams']['utm_term'] ?? null),
        'xcod' => $input['xcod'] ?? ($input['utmParams']['xcod'] ?? null),
        'sck' => $input['sck'] ?? ($input['utmParams']['sck'] ?? null),
        'fbclid' => $input['fbclid'] ?? ($input['utmParams']['fbclid'] ?? null),
        'gclid' => $input['gclid'] ?? ($input['utmParams']['gclid'] ?? null),
        'ttclid' => $input['ttclid'] ?? ($input['utmParams']['ttclid'] ?? null)
    ];

    $utmParams = array_filter($utmParams, function($value) {
        return $value !== null && $value !== '';
    });

    error_log("[AbyssalPay] 📊 Parâmetros UTM recebidos: " . json_encode($utmParams));

    // Gera dados do cliente se não fornecidos
    if (!$nome_cliente) {
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
    
    // Remover caracteres não numéricos do telefone e CPF
    $telefone_limpo = preg_replace('/[^0-9]/', '', $telefone_cliente);
    $cpf_limpo = preg_replace('/[^0-9]/', '', $cpf);

    error_log("[AbyssalPay] 📝 Preparando dados para envio: " . json_encode([
        'valor' => $valor_decimal,
        'nome' => $nome_cliente,
        'email' => $email,
        'cpf' => $cpf_limpo,
        'telefone' => $telefone_limpo
    ]));

    // Preparar URL do postback (webhook)
    $postbackUrl = getWebhookUrl();

    // Estrutura de dados para Abyssal Pay
    $data = [
        "token" => ABYSSALPAY_TOKEN,
        "secret" => ABYSSALPAY_SECRET,
        "postback" => $postbackUrl,
        "amount" => $valor_decimal,
        "debtor_name" => $nome_cliente,
        "email" => $email,
        "debtor_document_number" => $cpf_limpo,
        "phone" => $telefone_limpo,
        "method_pay" => "pix"
    ];

    error_log("[AbyssalPay] 🌐 URL da requisição: " . ABYSSALPAY_DEPOSIT_ENDPOINT);
    error_log("[AbyssalPay] 📦 Dados enviados: " . json_encode($data));

    // Fazer requisição para Abyssal Pay
    $ch = curl_init(ABYSSALPAY_DEPOSIT_ENDPOINT);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    $curlErrno = curl_errno($ch);

    if ($curlError) {
        error_log("[AbyssalPay] ❌ Erro cURL: " . $curlError . " (errno: " . $curlErrno . ")");
        throw new Exception("Erro na requisição: " . $curlError);
    }

    curl_close($ch);

    error_log("[AbyssalPay] 📊 HTTP Status Code: " . $httpCode);
    error_log("[AbyssalPay] 📄 Resposta bruta: " . $response);

    if ($httpCode !== 200 && $httpCode !== 201) {
        error_log("[AbyssalPay] ❌ Erro HTTP: " . $httpCode);
        error_log("[AbyssalPay] 📄 Resposta de erro: " . $response);
        throw new Exception("Erro na API Abyssal Pay: HTTP " . $httpCode . " - " . $response);
    }

    $result = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("[AbyssalPay] ❌ Erro ao decodificar JSON: " . json_last_error_msg());
        throw new Exception("Resposta inválida da API: " . json_last_error_msg());
    }

    if (!$result) {
        error_log("[AbyssalPay] ❌ Resposta vazia da API");
        throw new Exception("Resposta vazia da API Abyssal Pay");
    }

    // Verificar se a resposta contém os dados necessários
    if (!isset($result['idTransaction'])) {
        error_log("[AbyssalPay] ❌ Resposta da API não contém ID da transação");
        error_log("[AbyssalPay] 📄 Estrutura recebida: " . print_r($result, true));
        throw new Exception("ID da transação não encontrado na resposta");
    }

    $idTransaction = $result['idTransaction'];
    $qrcode = $result['qrcode'] ?? '';
    $qr_code_image_url = $result['qr_code_image_url'] ?? '';

    // Se não tiver URL da imagem mas tiver código, gerar QR code
    if (!$qr_code_image_url && $qrcode) {
        $qr_code_image_url = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode($qrcode);
    }

    // Salva os dados no SQLite
    $stmt = $db->prepare("INSERT INTO pedidos (transaction_id, status, valor, nome, email, cpf, utm_params, created_at) 
        VALUES (:transaction_id, 'pending', :valor, :nome, :email, :cpf, :utm_params, :created_at)");
    $stmt->execute([
        'transaction_id' => $idTransaction,
        'valor' => $valor,
        'nome' => $nome_cliente,
        'email' => $email,
        'cpf' => $cpf_limpo,
        'utm_params' => json_encode($utmParams),
        'created_at' => date('c')
    ]);

    error_log("[AbyssalPay] 💳 Transação criada com sucesso: " . $idTransaction);
    error_log("[AbyssalPay] 📄 Resposta completa da API: " . $response);

    // Preparar resposta para o frontend
    $responseData = [
        'success' => true,
        'token' => $idTransaction,
        'transactionId' => $idTransaction,
        'pixCode' => $qrcode,
        'qrcode' => $qrcode,
        'qrCodeUrl' => $qr_code_image_url,
        'qr_code_image_url' => $qr_code_image_url,
        'valor' => $valor,
        'status' => 'pending',
        'logs' => [
            'utmParams' => $utmParams,
            'transacao' => [
                'valor' => $valor,
                'cliente' => $nome_cliente,
                'email' => $email,
                'cpf' => $cpf_limpo,
                'telefone' => $telefone_limpo
            ],
            'abyssalpayResponse' => $result
        ]
    ];

    error_log("[AbyssalPay] 📤 Enviando resposta ao frontend: " . json_encode($responseData));
    echo json_encode($responseData);

} catch (Exception $e) {
    error_log("[AbyssalPay] ❌ Erro: " . $e->getMessage());
    error_log("[AbyssalPay] 🔍 Stack trace: " . $e->getTraceAsString());
    
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

