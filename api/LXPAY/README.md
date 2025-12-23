# Integração API PIX LXPAY

Esta pasta contém os arquivos PHP para integração com a API LXPAY para pagamentos PIX.

## Estrutura de Arquivos

- **config.php** - Configurações e credenciais da API
- **LxpayApi.php** - Classe principal para comunicação com a API
- **gerar_pix.php** - Endpoint para gerar pagamento PIX
- **webhook.php** - Endpoint para receber notificações da LXPAY
- **consultar_transacao.php** - Endpoint para consultar status de transação

## Configuração

### 1. Credenciais

As credenciais estão configuradas no arquivo `config.php`:
- `LXPAY_PUBLIC_KEY`: Chave pública da API
- `LXPAY_SECRET_KEY`: Chave secreta da API
- `LXPAY_WORKSPACE_ID`: ID do workspace para splits (opcional)

### 2. Webhook

Configure a URL do webhook no painel da LXPAY:
```
https://seudominio.com.br/LXPAY/webhook.php
```

**Importante:** Atualize a constante `LXPAY_WEBHOOK_URL` no `config.php` com sua URL real.

## Uso

### Gerar PIX

Envie uma requisição POST para `gerar_pix.php`:

```json
{
  "amount": 60.00,
  "client": {
    "name": "João Silva",
    "email": "joao@email.com",
    "document": "12345678901",
    "phone": "11999999999"
  },
  "itens": [
    {
      "idProduto": "prod_001",
      "nomeProduto": "Marmita Grande",
      "qtdeProduto": 2,
      "precoProduto": 30.00
    }
  ],
  "entrega": {
    "cep": "01310-100",
    "endereco": "Avenida Paulista",
    "numero": "1000",
    "bairro": "Bela Vista",
    "cidade": "São Paulo",
    "estado": "SP"
  },
  "observacoes": "Sem cebola"
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "transactionId": "txn_...",
  "status": "OK",
  "pix": {
    "code": "00020101021126530014BRX..."
  }
}
```

### Consultar Transação

Envie uma requisição POST para `consultar_transacao.php`:

```json
{
  "transactionId": "txn_..."
}
```

### Webhook

O webhook recebe automaticamente notificações da LXPAY sobre mudanças de status. Os logs são salvos em `webhook_log.txt` e pedidos confirmados em `pedidos_confirmados.json`.

## Segurança

- ✅ Credenciais armazenadas apenas no backend
- ✅ Validação de CPF/CNPJ
- ✅ Sanitização de inputs
- ✅ Uso de HTTPS recomendado

## Validações

A classe `LxpayApi` valida:
- CPF/CNPJ (formato e dígitos verificadores)
- Identifier (26-35 caracteres alfanuméricos)
- Campos obrigatórios
- Valor mínimo do pagamento

## Suporte

Para mais informações, consulte a documentação oficial:
https://lxpay.com.br/docs

