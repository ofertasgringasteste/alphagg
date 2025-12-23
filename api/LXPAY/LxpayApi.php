<?php
/**
 * Classe para comunicação com a API LXPAY
 */

require_once __DIR__ . '/config.php';

class LxpayApi {
    private $publicKey;
    private $secretKey;
    private $baseUrl;
    private $timeout;

    public function __construct() {
        $this->publicKey = LXPAY_PUBLIC_KEY;
        $this->secretKey = LXPAY_SECRET_KEY;
        $this->baseUrl = LXPAY_API_BASE_URL;
        $this->timeout = LXPAY_TIMEOUT;
    }

    /**
     * Gera um identifier único conforme especificação da API
     * Formato: 26-35 caracteres alfanuméricos (A-Z, 0-9)
     * 
     * @return string
     */
    public function gerarIdentifier() {
        // Timestamp em milissegundos (13 dígitos)
        $timestamp = round(microtime(true) * 1000);
        
        // String aleatória com letras maiúsculas e números
        $caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $random = '';
        for ($i = 0; $i < 13; $i++) {
            $random .= $caracteres[rand(0, strlen($caracteres) - 1)];
        }
        
        // Combina timestamp + random = 26 caracteres
        $identifier = $timestamp . $random;
        
        // Garante que está entre 26-35 caracteres
        if (strlen($identifier) < 26) {
            $identifier = str_pad($identifier, 26, '0', STR_PAD_RIGHT);
        } elseif (strlen($identifier) > 35) {
            $identifier = substr($identifier, 0, 35);
        }
        
        return $identifier;
    }

    /**
     * Valida CPF ou CNPJ
     * 
     * @param string $document
     * @return bool
     */
    public function validarDocumento($document) {
        $document = preg_replace('/[^0-9]/', '', $document);
        
        // CPF (11 dígitos)
        if (strlen($document) == 11) {
            return $this->validarCPF($document);
        }
        
        // CNPJ (14 dígitos)
        if (strlen($document) == 14) {
            return $this->validarCNPJ($document);
        }
        
        return false;
    }

    /**
     * Valida CPF
     */
    private function validarCPF($cpf) {
        if (strlen($cpf) != 11 || preg_match('/(\d)\1{10}/', $cpf)) {
            return false;
        }
        
        for ($t = 9; $t < 11; $t++) {
            for ($d = 0, $c = 0; $c < $t; $c++) {
                $d += $cpf[$c] * (($t + 1) - $c);
            }
            $d = ((10 * $d) % 11) % 10;
            if ($cpf[$c] != $d) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Valida CNPJ
     */
    private function validarCNPJ($cnpj) {
        if (strlen($cnpj) != 14 || preg_match('/(\d)\1{13}/', $cnpj)) {
            return false;
        }
        
        $length = strlen($cnpj) - 2;
        $numbers = substr($cnpj, 0, $length);
        $digits = substr($cnpj, $length);
        $sum = 0;
        $pos = $length - 7;
        
        for ($i = $length; $i >= 1; $i--, $pos--) {
            if ($pos < 2) {
                $pos = 9;
            }
            $sum += $numbers[$length - $i] * $pos;
        }
        
        $result = $sum % 11 < 2 ? 0 : 11 - $sum % 11;
        if ($result != $digits[0]) {
            return false;
        }
        
        $length = $length + 1;
        $numbers = substr($cnpj, 0, $length);
        $sum = 0;
        $pos = $length - 7;
        
        for ($i = $length; $i >= 1; $i--, $pos--) {
            if ($pos < 2) {
                $pos = 9;
            }
            $sum += $numbers[$length - $i] * $pos;
        }
        
        $result = $sum % 11 < 2 ? 0 : 11 - $sum % 11;
        if ($result != $digits[1]) {
            return false;
        }
        
        return true;
    }

    /**
     * Faz requisição HTTP para a API
     * 
     * @param string $endpoint
     * @param string $method
     * @param array $data
     * @return array
     */
    private function fazerRequisicao($endpoint, $method = 'GET', $data = null) {
        $url = $this->baseUrl . $endpoint;
        
        $ch = curl_init($url);
        
        $headers = [
            'Content-Type: application/json',
            'x-public-key: ' . $this->publicKey,
            'x-secret-key: ' . $this->secretKey
        ];
        
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2
        ]);
        
        if ($data && ($method == 'POST' || $method == 'PUT' || $method == 'PATCH')) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        
        curl_close($ch);
        
        if ($error) {
            return [
                'success' => false,
                'error' => 'Erro na requisição: ' . $error,
                'http_code' => 0
            ];
        }
        
        $responseData = json_decode($response, true);
        
        if ($httpCode >= 200 && $httpCode < 300) {
            return [
                'success' => true,
                'data' => $responseData,
                'http_code' => $httpCode
            ];
        } else {
            return [
                'success' => false,
                'error' => $responseData['message'] ?? 'Erro desconhecido',
                'error_code' => $responseData['errorCode'] ?? null,
                'details' => $responseData['details'] ?? null,
                'http_code' => $httpCode,
                'response' => $responseData
            ];
        }
    }

    /**
     * Gera um pagamento PIX
     * 
     * @param array $dados
     * @return array
     */
    public function gerarPix($dados) {
        // Validações
        if (empty($dados['amount']) || $dados['amount'] <= 0) {
            return [
                'success' => false,
                'error' => 'Valor do pagamento inválido'
            ];
        }
        
        if (empty($dados['client']['name'])) {
            return [
                'success' => false,
                'error' => 'Nome do cliente é obrigatório'
            ];
        }
        
        if (empty($dados['client']['email'])) {
            return [
                'success' => false,
                'error' => 'E-mail do cliente é obrigatório'
            ];
        }
        
        if (empty($dados['client']['document'])) {
            return [
                'success' => false,
                'error' => 'CPF/CNPJ do cliente é obrigatório'
            ];
        }
        
        // Valida documento
        if (!$this->validarDocumento($dados['client']['document'])) {
            return [
                'success' => false,
                'error' => 'CPF/CNPJ inválido'
            ];
        }
        
        // Limpa documento (remove formatação)
        $dados['client']['document'] = preg_replace('/[^0-9]/', '', $dados['client']['document']);
        
        // Gera identifier se não fornecido
        if (empty($dados['identifier'])) {
            $dados['identifier'] = $this->gerarIdentifier();
        }
        
        // Valida identifier
        if (strlen($dados['identifier']) < 26 || strlen($dados['identifier']) > 35) {
            return [
                'success' => false,
                'error' => 'Identifier deve ter entre 26 e 35 caracteres'
            ];
        }
        
        // Monta payload
        $payload = [
            'identifier' => $dados['identifier'],
            'amount' => floatval($dados['amount']),
            'client' => [
                'name' => $dados['client']['name'],
                'email' => $dados['client']['email'],
                'document' => $dados['client']['document']
            ]
        ];
        
        // Adiciona telefone se fornecido
        if (!empty($dados['client']['phone'])) {
            $payload['client']['phone'] = preg_replace('/[^0-9]/', '', $dados['client']['phone']);
        }
        
        // Adiciona produtos se fornecido
        if (!empty($dados['products']) && is_array($dados['products'])) {
            $payload['products'] = $dados['products'];
        }
        
        // Adiciona data de vencimento se fornecido
        if (!empty($dados['dueDate'])) {
            $payload['dueDate'] = $dados['dueDate'];
        }
        
        // Adiciona callback URL se configurado
        if (function_exists('getWebhookUrl')) {
            $payload['callbackUrl'] = getWebhookUrl();
        } elseif (defined('LXPAY_WEBHOOK_URL') && !empty(LXPAY_WEBHOOK_URL)) {
            $payload['callbackUrl'] = LXPAY_WEBHOOK_URL;
        }
        
        // Adiciona metadata se fornecido
        if (!empty($dados['metadata']) && is_array($dados['metadata'])) {
            $payload['metadata'] = $dados['metadata'];
        }
        
        // Adiciona splits se fornecido
        if (!empty($dados['splits']) && is_array($dados['splits'])) {
            $payload['splits'] = $dados['splits'];
        }
        
        // Faz requisição
        return $this->fazerRequisicao('/api/v1/gateway/pix/receive', 'POST', $payload);
    }

    /**
     * Consulta status de uma transação
     * 
     * @param string $transactionId
     * @return array
     */
    public function consultarTransacao($transactionId) {
        if (empty($transactionId)) {
            return [
                'success' => false,
                'error' => 'Transaction ID é obrigatório'
            ];
        }
        
        return $this->fazerRequisicao('/api/v1/transactions/' . urlencode($transactionId), 'GET');
    }
}

