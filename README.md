# 🔌 RHiD Proxy — Brewteco GGC

Servidor intermediário (proxy) que resolve o bloqueio de CORS entre o Dashboard executivo e a API do RHiD na nuvem.

---

## Como funciona

```
Dashboard HTML  ──►  Vercel (este proxy)  ──►  RHiD na nuvem
(seu computador)      (servidor gratuito)       (rhid.com.br/v2)
```

O navegador não consegue chamar o RHiD diretamente por segurança (CORS). Este proxy fica no meio, faz a chamada ao RHiD e devolve o resultado ao dashboard.

---

## Passo a passo — configuração do zero

### PARTE 1 — Criar conta no GitHub (5 min)

1. Acesse **github.com** e clique em **Sign up**
2. Informe e-mail, crie uma senha e escolha um username (ex: `brewteco-ggc`)
3. Confirme o e-mail recebido
4. Pronto — sua conta está criada

### PARTE 2 — Subir o código no GitHub (5 min)

1. Acesse **github.com** já logado e clique no botão **+** (canto superior direito) → **New repository**
2. Nome do repositório: `rhid-proxy`
3. Deixe como **Private** (privado)
4. Clique em **Create repository**
5. Na tela seguinte, clique em **uploading an existing file**
6. Arraste os três arquivos desta pasta:
   - `api/rhid.js`
   - `vercel.json`
   - `package.json`
7. Clique em **Commit changes**

### PARTE 3 — Criar conta no Vercel e fazer o deploy (5 min)

1. Acesse **vercel.com** e clique em **Sign Up**
2. Escolha **Continue with GitHub** (usa a conta que você acabou de criar)
3. Autorize o Vercel a acessar seu GitHub
4. Na tela inicial do Vercel, clique em **Add New → Project**
5. Selecione o repositório `rhid-proxy` que você criou
6. Clique em **Deploy**
7. Aguarde cerca de 1 minuto — o Vercel vai compilar e publicar

### PARTE 4 — Copiar a URL do proxy

1. Após o deploy, o Vercel mostrará uma URL assim:
   ```
   https://rhid-proxy-xxxxx.vercel.app
   ```
2. **Copie essa URL** — você vai colar no dashboard

### PARTE 5 — Configurar no Dashboard

1. Abra o Dashboard Brewteco no navegador
2. Vá na aba **↑ RHiD Import**
3. Clique em **⚙ Configurar conexão RHiD**
4. Cole a URL do Vercel no campo **URL do Proxy**
5. Informe seu login e senha do RHiD
6. Clique em **Conectar**
7. A partir daí, todos os relatórios são carregados automaticamente

---

## Endpoints disponíveis

| Ação | Método | Descrição |
|------|--------|-----------|
| `?action=login` | POST | Autentica no RHiD e retorna token JWT |
| `?action=resumo` | GET | Resumo de horas por empresa (equivale ao CSV) |
| `?action=funcionarios` | GET | Lista de funcionários |
| `?action=marcacoes` | GET | Registros de ponto por período |
| `?action=empresas` | GET | Lista de empresas/unidades |
| `?action=proxy` | POST | Proxy genérico para qualquer endpoint do RHiD |

---

## Segurança

- O proxy **não armazena** login ou senha — apenas repassa ao RHiD
- O token JWT retornado tem validade definida pelo próprio RHiD
- Recomendado: após configurar, restrinja o domínio permitido no `vercel.json` substituindo `"*"` pela URL do seu dashboard

---

## Suporte

Em caso de dúvidas, acionar o time de GGC ou abrir uma issue neste repositório.
