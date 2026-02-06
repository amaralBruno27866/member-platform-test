# Exemplo de Requisição POST para Address com Lookup OData

## ✅ Requisição Corrigida - POST /public/addresses/create

```json
{
  "osot_address_1": "123 Main Street",
  "osot_address_2": "Suite 100",
  "osot_city": 380,
  "osot_province": 1,
  "osot_postal_code": "K1A 0A6",
  "osot_country": 1,
  "osot_address_type": 1,
  "osot_address_preference": 1,
  "osot_Table_Account@odata.bind": "/osot_table_accounts/b1a2c3d4-e5f6-7890-abcd-1234567890ef"
}
```

## ✅ Exemplos de Requisições com OData Bind

### POST /public/identities/create

```json
{
  "osot_chosen_name": "Alex",
  "osot_language": [1, 2],
  "osot_gender": 3,
  "osot_race": 5,
  "osot_indigenous": false,
  "osot_disability": false,
  "osot_Table_Account@odata.bind": "/osot_table_accounts/b1a2c3d4-e5f6-7890-abcd-1234567890ef"
}
```

### POST /public/ot-educations/create

```json
{
  "osot_coto_status": 1,
  "osot_coto_registration": "AB123456",
  "osot_ot_degree_type": 2,
  "osot_ot_university": 15,
  "osot_ot_grad_year": 5,
  "osot_education_category": 1,
  "osot_ot_country": 1,
  "osot_ot_other": "Additional certification in Hand Therapy",
  "osot_Table_Account@odata.bind": "/osot_table_accounts/b1a2c3d4-e5f6-7890-abcd-1234567890ef"
}
```

### POST /public/ota-educations/create

```json
{
  "osot_work_declaration": true,
  "osot_ota_degree_type": 1,
  "osot_ota_college": 3,
  "osot_ota_grad_year": 5,
  "osot_education_category": 1,
  "osot_ota_country": 1,
  "osot_ota_other": "Additional OTA certification in Mental Health",
  "osot_Table_Account@odata.bind": "/osot_table_accounts/b1a2c3d4-e5f6-7890-abcd-1234567890ef"
}
```

## 📋 DTOs Corrigidos com OData Bind

### ✅ Address Basic DTO

- Campo: `['osot_Table_Account@odata.bind']?: string`
- Exemplo: `/osot_table_accounts/b1a2c3d4-e5f6-7890-abcd-1234567890ef`

### ✅ Contact Basic DTO

- Campo: `['osot_Table_Account@odata.bind']?: string`
- Exemplo: `/osot_table_accounts/b1a2c3d4-e5f6-7890-abcd-1234567890ef`

### ✅ Management Basic DTO

- Campo: `['osot_Table_Account@odata.bind']?: string`
- Exemplo: `/osot_table_accounts/b1a2c3d4-e5f6-7890-abcd-1234567890ef`

### ✅ Identity Basic DTO

- Campo: `['osot_Table_Account@odata.bind']?: string`
- Exemplo: `/osot_table_accounts/b1a2c3d4-e5f6-7890-abcd-1234567890ef`

### ✅ OT Education Basic DTO

- Campo: `['osot_Table_Account@odata.bind']?: string`
- Exemplo: `/osot_table_accounts/b1a2c3d4-e5f6-7890-abcd-1234567890ef`

### ✅ OTA Education Basic DTO

- Campo: `['osot_Table_Account@odata.bind']?: string`
- Exemplo: `/osot_table_accounts/b1a2c3d4-e5f6-7890-abcd-1234567890ef`

## 🔍 Verificação dos DTOs

### Todos os DTOs principais agora têm a referência OData bind correta!

## 🛠️ Padrão OData Bind

### Sintaxe Correta:

```typescript
@ApiProperty({
  description: 'OData bind for Account. Example: "/osot_table_accounts(<GUID>)"',
  example: '/osot_table_accounts/b1a2c3d4-e5f6-7890-abcd-1234567890ef',
  required: false,
})
@IsOptional()
@Allow()
['osot_Table_Account@odata.bind']?: string;
```

### Vantagens:

1. **Sintaxe OData padrão** para relacionamentos
2. **Compatibilidade total** com Dataverse API
3. **Validação automática** de relacionamentos
4. **Performance otimizada** - evita queries extras
5. **Consistência** com padrões Microsoft Dataverse

## ✅ Status Final

Todos os DTOs básicos das entidades relacionadas agora estão usando a sintaxe OData bind correta para estabelecer relacionamentos com Account.
