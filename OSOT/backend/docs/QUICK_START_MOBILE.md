# 🚀 Quick Start - Mobile Testing

Guia rápido para configurar acesso mobile ao backend OSOT API.

## ⚡ Setup Mais Rápido

```powershell
# Execute este comando e pronto!
.\setup-backend-network.ps1
```

Depois:
```powershell
npm run start:dev
```

Acesse do celular: `http://<SEU_IP>:3000`

---

## 📦 Scripts Disponíveis

| Script | Descrição | Quando Usar |
|--------|-----------|-------------|
| **setup-backend-network.ps1** | ⭐ Configura tudo automaticamente | **Primeira vez** ou quando IP mudar |
| **setup-backend-firewall.ps1** | Configura apenas firewall | Quando firewall bloquear |
| **setup-fullstack-mobile.ps1** | Configura backend + frontend | Setup completo frontend + backend |

---

## 🎯 Uso Comum

### Primeiro Setup
```powershell
# 1. Configure o backend
.\setup-backend-network.ps1

# 2. Inicie o servidor
npm run start:dev

# 3. Teste
# PC: http://localhost:3000/health
# Celular: http://192.168.x.x:3000/health
```

### Quando IP Mudar
```powershell
# Execute novamente
.\setup-backend-network.ps1
```

### Problemas de Firewall
```powershell
# Execute como Administrador
.\setup-backend-firewall.ps1
```

---

## ✅ Checklist Rápido

- [ ] Script executado sem erros
- [ ] Servidor rodando: `npm run start:dev`
- [ ] Teste local: `http://localhost:3000/health`
- [ ] Teste rede: `http://<SEU_IP>:3000/health`
- [ ] Celular no mesmo Wi-Fi

---

## 🆘 Problemas Comuns

### Celular não conecta
```powershell
# Execute como Admin
.\setup-backend-firewall.ps1
```

### CORS bloqueando
Verifique `.env`:
```env
WP_FRONTEND_URL=http://localhost:5173,http://192.168.x.x:5173
```

### IP mudou
```powershell
.\setup-backend-network.ps1
```

---

## 📚 Documentação Completa

Para mais detalhes, veja: **MOBILE_TESTING_BACKEND.md**

---

**Última atualização:** Dezembro 2025
