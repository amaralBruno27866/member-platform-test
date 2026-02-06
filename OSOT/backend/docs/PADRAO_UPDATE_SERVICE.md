# Padrão de Update Seguro para Services e Controllers (NestJS)

Este documento descreve o padrão recomendado para implementação de métodos de update em services, garantindo segurança, consistência e aderência às regras de negócio.

---

## Padrão de Endpoints RESTful para Controllers

Para entidades que possuem dados próprios do usuário (ex: Address, Contact, Profile), recomenda-se expor endpoints RESTful padrão e também rotas específicas para o próprio usuário autenticado:

- `GET /entidade/me` — retorna os dados do usuário autenticado.
- `PATCH /entidade/me` — permite atualizar apenas os dados do próprio usuário autenticado.

Essas rotas devem usar autenticação JWT e extrair o userId/role do token para garantir que o usuário só acesse/atualize seus próprios dados.

Exemplo para Address:

```typescript
@Patch('me')
@UseGuards(AuthGuard('jwt'))
async updateMyAddress(
  @User('userId') userId: string,
  @User('role') role: string,
  @Body() dto: UpdateTableAddressDto,
) {
  // Busca o GUID do endereço do usuário autenticado
  const addressGuid = await this.tableAddressService.findAddressGuidByAccountId(userId, role);
  return this.tableAddressService.update(addressGuid, dto, { role, userId });
}

@Get('me')
@UseGuards(AuthGuard('jwt'))
async getMyAddress(
  @User('userId') userId: string,
  @User('role') role: string,
) {
  return this.tableAddressService.findByUserId(userId, role);
}
```

> **Dica:** Sempre que a entidade for "do usuário", implemente as rotas `/me` para facilitar o consumo pelo frontend e garantir segurança.

---

## Template para Método de Update Seguro

```typescript
async update(
  id: string,
  updateDto: Partial<UpdateDtoType>,
  user: { role?: string; userId?: string },
) {
  // 1. Validação de privilégio
  const { canWrite } = await import('CAMINHO_DO_HELPER');
  if (!user?.role) {
    throw new ForbiddenException('You must have a valid role to update.');
  }
  const role = user.role;
  if (!canWrite(role) || role !== 'owner') {
    throw new ForbiddenException('Only the owner can update.');
  }

  // 2. Resolução do GUID do usuário autenticado (se necessário)
  let accountGuid = user.userId || '';
  const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!guidRegex.test(accountGuid) && accountGuid) {
    // Buscar GUID pelo business id
    const accountEndpoint = `osot_table_accounts?$filter=osot_account_id eq '${accountGuid}'&$select=osot_table_accountid`;
    const accountResp = await this.dataverseService.request(
      'GET',
      accountEndpoint,
      undefined,
      this.dataverseService.getCredentialsByApp('owner'),
    );
    const accountData = accountResp as {
      value?: Array<{ osot_table_accountid: string }>;
    };
    if (
      Array.isArray(accountData.value) &&
      accountData.value.length > 0 &&
      accountData.value[0].osot_table_accountid
    ) {
      accountGuid = accountData.value[0].osot_table_accountid;
    } else {
      throw new ForbiddenException('Account not found to validate ownership.');
    }
  }

  // 3. Busca e valida ownership do registro atual usando lookup puro (_osot_table_account_value)
  const current = await this.dataverseService.request(
    'GET',
    `TABELA(${id})?$select=ID_CAMPOS,_osot_table_account_value`,
    undefined,
    this.dataverseService.getCredentialsByApp('read'),
  );
  if (!current || current._osot_table_account_value !== accountGuid) {
    throw new ForbiddenException('Only the owner can update.');
  }

  // 4. Normalização e filtragem do DTO
  const dto = { ...updateDto };
  // ...normalizações específicas...
  const filteredUpdate = filterUpdateFields(dto, role);

  // 5. PATCH no Dataverse
  await this.dataverseService.request(
    'PATCH',
    `TABELA(${id})`,
    filteredUpdate,
    this.dataverseService.getCredentialsByApp('write'),
  );

  // 6. Retorno
  return filteredUpdate;
}
```

---

## Checklist para Refatoração

- [ ] Validar privilégio (`canWrite`) e role do usuário.
- [ ] Garantir que apenas o dono pode atualizar (ownership).
- [ ] Normalizar campos do DTO conforme necessário.
- [ ] Filtrar campos permitidos com helper específico.
- [ ] Realizar o update (PATCH) apenas com dados filtrados.
- [ ] Logar ações relevantes para auditoria/debug.
- [ ] Retornar apenas o payload filtrado.

---

> **Dica:** Adapte os nomes dos métodos, DTOs e helpers conforme a entidade (Contact, Identity, etc).

Se precisar de exemplos concretos para outras entidades, solicite aqui!
