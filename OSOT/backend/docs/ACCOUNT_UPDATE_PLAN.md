# Plano de Implementação: Account Update

## 1. DTOs e Validação

- Criar um `UpdateAccountDto` (se ainda não existir) em `classes/accounts/`.
  - Herdar de `PartialType(AccountRegistrationDto)` para permitir updates parciais.
  - Adicionar validações específicas para update (ex: campos que não podem ser alterados pelo usuário comum).
- Se necessário, criar DTOs de update para blocos relacionados (address, contact, etc.).

## 2. Interface e Service

- Definir uma interface `UpdateAccountPayload` para tipar os dados de entrada do update.
- No `TableAccountService`, implementar o método `updateByUserId(userId, dto, role)`:
  - Buscar a conta pelo `userId` e validar existência.
  - Aplicar regras de negócio e filtros de permissão (usar helpers de `business-rule.util.ts`).
  - Atualizar apenas os campos permitidos conforme o perfil (`main`, `admin`, `owner`).
  - Persistir as alterações no Dataverse.

## 3. Controller

- Criar endpoint PATCH `/user-profile/account` (ou `/accounts/:id` se preferir REST puro) no controller de perfil ou de accounts.
  - Proteger com `JwtAuthGuard` e, se necessário, um guard de permissão.
  - Usar decorators para extrair o usuário autenticado e seu role.
  - Receber o DTO de update, validar e repassar ao service.
  - Retornar o perfil atualizado ou status de sucesso.

## 4. Sanitização e Regras de Negócio

- Antes de persistir, sanitizar e normalizar dados (telefone, email, etc.) usando os utilitários de `util/`.
- Aplicar regras de negócio específicas (ex: não permitir alteração de email para certos perfis, validar unicidade se necessário).

## 5. Permissões e Segurança

- Usar os filtros de campos de update de `business-rule.util.ts` para garantir que apenas campos permitidos sejam atualizados conforme o perfil do usuário.
- Garantir que owners não possam alterar campos restritos (ex: status, grupo, privilégio).

## 6. Testes

- Criar testes unitários para o service de update.
- Criar testes de integração para o endpoint, cobrindo diferentes perfis e cenários de permissão.

## 7. Documentação

- Documentar o endpoint no Swagger, incluindo exemplos de payload e respostas.
- Especificar claramente quais campos podem ser atualizados por cada perfil.

## Fluxo Resumido

1. Usuário autenticado faz PATCH com os dados a atualizar.
2. Controller valida e repassa para o service.
3. Service busca a conta, aplica filtros de permissão, sanitiza e atualiza no Dataverse.
4. Retorna o perfil atualizado ou status.

---

Se quiser, posso gerar o esqueleto dos arquivos (DTO, service, controller) ou detalhar cada etapa com exemplos de código!
