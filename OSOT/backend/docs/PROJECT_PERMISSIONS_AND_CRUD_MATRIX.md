# Permissões e Regras de CRUD por Tipo de Usuário

## 1. Perfis de Usuário

| Perfil | Descrição                                                             | Permissões Gerais      |
| ------ | --------------------------------------------------------------------- | ---------------------- |
| admin  | Administrador do sistema, acesso total a todas as tabelas e operações | CRUD total             |
| main   | Usuário de alto nível, acesso total às tabelas principais             | CRUD total             |
| owner  | Usuário comum, pode operar apenas nos próprios registros              | CRUD próprio           |
| login  | Usuário autenticado, acesso restrito a leitura e atualização pessoal  | Leitura/Update próprio |

---

## 2. Requisitos Gerais para CRUD

- **Autenticação:**
  - Exceto para registro inicial de Account, todas as operações exigem autenticação (token JWT válido).
- **Permissão:**
  - admin/main: CRUD total em todas as tabelas.
  - owner: CRUD apenas nos próprios registros.
  - login: leitura/atualização apenas dos próprios dados.
- **Relacionamento:**
  - Para tabelas dependentes, obrigatório fornecer GUID do Account via navigation property e business id no campo simples.

---

## 3. CRUD por Tabela

| Tabela                | Create                                 | Read                                       | Update                               | Delete                               | Observações                                  |
| --------------------- | -------------------------------------- | ------------------------------------------ | ------------------------------------ | ------------------------------------ | -------------------------------------------- |
| Account               | Qualquer (registro) / admin/main/owner | Todos (admin/main) / Próprio (owner/login) | Todos (admin/main) / Próprio (owner) | Todos (admin/main) / Próprio (owner) | Registro inicial não exige login, demais sim |
| Address, Contact, etc | admin/main/owner (autenticado)         | Todos (admin/main) / Próprio (owner/login) | Todos (admin/main) / Próprio (owner) | Todos (admin/main) / Próprio (owner) | Exige GUID e business id do Account          |
| Account Management    | admin/main/owner (autenticado)         | Todos (admin/main) / Próprio (owner/login) | Todos (admin/main) / Próprio (owner) | Todos (admin/main) / Próprio (owner) | Exige GUID e business id do Account          |

---

## 4. Checklist para Operações CRUD

- [ ] Usuário autenticado? (exceto registro inicial)
- [ ] Permissão do perfil (admin/main/owner/login)?
- [ ] GUID do Account fornecido via navigation property?
- [ ] Business id fornecido no campo simples?
- [ ] Tentando operar apenas nos próprios registros (se não for admin/main)?
- [ ] Todos os campos obrigatórios do DTO presentes?

---

## 5. Exemplo de Payload para Tabelas Dependentes

```json
{
  "osot_account_id@odata.bind": "/osot_table_accounts(<GUID>)", // GUID do Account
  "osot_account_id": "osot-000043", // business id
  "osot_user_business_id": "osot-000043" // business id
  // ...outros campos obrigatórios
}
```

---

## 6. Observações

- O relacionamento entre tabelas é sempre feito via navigation property (`@odata.bind`) usando o GUID.
- O business id é usado para rastreabilidade e deve ser preenchido nos campos simples.
- O backend deve validar permissões e ownership antes de qualquer operação.
- O Dataverse pode restringir operações por ownership, unidade de negócio ou security role.

---

> **Dica:** Sempre consulte a documentação do Dataverse para detalhes sobre security roles, ownership e navigation properties.
