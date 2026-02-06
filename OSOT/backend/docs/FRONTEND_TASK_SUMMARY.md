# 📧 Para: Time de Frontend

## Assunto: URGENTE - Implementação de Rotas de Aprovação Admin

Olá time!

Precisamos implementar **2 rotas** para completar o fluxo de aprovação de registro de usuários. O backend já está 100% implementado e testado.

---

## 🎯 O que precisa ser feito

### Rotas Necessárias

1. **`/admin/approve-account/:token`** - Aprovação
2. **`/admin/reject-account/:token`** - Rejeição

### Como funciona
1. Admin recebe email com link
2. Link abre rota no frontend
3. Frontend chama API do backend automaticamente
4. Mostra página de sucesso/erro

---

## ⏱️ Estimativa: 4-6 horas

- **Crítico:** 30 min (configuração API + rotas básicas)
- **UI/UX:** 2-3 horas (componentes com estados loading/success/error)
- **Testes:** 1-2 horas

---

## 🚀 Solução Recomendada - Auto-Detecção de IP

**Problema:** O IP do backend muda diariamente (192.168.10.66 → 192.168.10.X)

**Solução:** Frontend detecta automaticamente o IP correto

```typescript
// src/config/api.config.ts
const getApiBaseUrl = (): string => {
  if (import.meta.env.PROD) {
    return 'https://api.osot.ca';
  }
  
  const hostname = window.location.hostname;
  
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:3000`;  // Usa mesmo IP do frontend
  }
  
  return 'http://localhost:3000';
};

export const API_BASE_URL = getApiBaseUrl();
```

**Benefícios:**
- ✅ Zero configuração
- ✅ Funciona em qualquer IP automaticamente
- ✅ Sem scripts diários

---

## 📚 Documentação Completa

Ver arquivo anexo: **`ADMIN_APPROVAL_FRONTEND_IMPLEMENTATION.md`**

Contém:
- ✅ Código completo dos componentes React
- ✅ Exemplos de API calls
- ✅ Estados de loading/success/error
- ✅ UI com Tailwind CSS
- ✅ Tratamento de erros
- ✅ Testes automatizados
- ✅ Guia de troubleshooting

---

## 🔌 Endpoints Backend (Já Implementados)

```http
GET /public/orchestrator/admin/approve/{token}
GET /public/orchestrator/admin/reject/{token}
```

**Response de Sucesso:**
```json
{
  "success": true,
  "message": "Registration approved successfully",
  "userNotificationSent": true
}
```

**Swagger:** http://192.168.10.66:3000/api-docs

---

## ✅ Acceptance Criteria

- [ ] Rotas `/admin/approve-account/:token` e `/admin/reject-account/:token` existem
- [ ] Clicar no link do email processa automaticamente
- [ ] Mostra loading enquanto processa
- [ ] Mostra página de sucesso/erro
- [ ] Responsivo (mobile/tablet/desktop)

---

## 📞 Contato

**Backend:** Bruno Amaral (bamaral@osot.on.ca)

Se tiver dúvidas, posso fazer pair programming ou explicar qualquer parte do fluxo.

---

## 📅 Prazo

**Ideal:** Implementar essa semana  
**Motivo:** Bloqueia fluxo de registro completo

Obrigado! 🙏
