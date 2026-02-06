# AUTENTICAÇÃO SEGURA COM REDIS – FLUXO E EXEMPLOS

## Visão Geral

Este documento descreve o fluxo de autenticação seguro implementado na API, utilizando Redis para blacklist de tokens, rate limiting, cache de usuário e códigos temporários. Inclui exemplos de request/response e orientações para integração frontend.

---

## 1. Fluxo de Login Seguro

1. **Usuário envia email e senha** para `/auth/login`.
2. **Validação**: Credenciais são validadas, senha comparada via bcrypt.
3. **Geração de JWT**: Token JWT é emitido, sem dados sensíveis.
4. **Resposta**: Apenas campos não sensíveis são retornados (ver exemplo abaixo).
5. **Rate Limiting**: Tentativas excessivas bloqueiam temporariamente o IP/usuário.
6. **Blacklist**: Logout adiciona o token à blacklist no Redis até expirar.

---

## 2. Exemplo de Request/Response

### Login

**POST** `/auth/login`

```json
{
  "osot_email": "user@email.com",
  "osot_password": "SenhaForte123!"
}
```

**Response 200**

```json
{
  "osot_account_id": "osot000123",
  "osot_first_name": "Susan",
  "osot_last_name": "Douglas",
  "osot_date_of_birth": "1990-01-01",
  "osot_mobile_phone": "+1-555-123-4567",
  "osot_email": "user@email.com",
  "osot_account_group": 1,
  "access_token": "<JWT>"
}
```

### Logout

**POST** `/auth/logout`

- O token JWT do header Authorization é adicionado à blacklist no Redis.
- Resposta: `{ "message": "Logout realizado com sucesso" }`

---

## 3. Segurança dos DTOs

- Nenhum DTO de resposta expõe senha, privilégios ou dados sensíveis.
- DTOs de entrada (registro) aceitam senha, mas nunca retornam.
- Todos os dados sensíveis são tratados apenas no backend.

---

## 4. Rate Limiting

- Implementado via guard global.
- Exemplo: 5 tentativas de login erradas bloqueiam o IP/usuário por 15 minutos.
- Resposta de bloqueio: `429 Too Many Requests`.

---

## 5. Blacklist de Token JWT

- Logout adiciona o token à blacklist no Redis até expirar.
- Tokens na blacklist não são aceitos em endpoints protegidos.

---

## 6. Códigos Temporários (Ex: 2FA, recuperação)

- Gerados e armazenados no Redis com expiração curta.
- Validados e removidos após uso.

---

## 7. Testes e Garantia de Qualidade

- Todos os fluxos possuem testes unitários e de integração.
- Lint e tipagem estrita garantem código limpo e seguro.

---

## 8. Referências

- [response-table-account.dto.ts](../src/classes/login/response-table-account.dto.ts)
- [auth.service.ts](../src/auth/auth.service.ts)
- [rate-limit.guard.ts](../src/auth/rate-limit.guard.ts)
- [redis.service.ts](../src/registration-process/redis/redis.service.ts)

---

Dúvidas ou sugestões? Consulte o time de backend.
