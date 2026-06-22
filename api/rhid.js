// api/rhid.js
// Proxy serverless (Vercel) para a API do RHiD (Control iD).
//
// Endpoint base confirmado oficialmente pela equipe de Integração da Control iD
// (e-mail de Lucas Pereira, 22/06/2026):
//   Base:  https://www.rhid.com.br/v2/api.svc
//   Login: POST /login   body: { email, password, domain? }
//   Retorna um bearer token válido por 4 horas, usado via header
//   "Authorization: Bearer {token}" em todas as demais chamadas.
//
// Documentação completa (Swagger):
//   https://www.rhid.com.br/v2/swagger.svc/index.html?url=/v2/swagger.svc/swagger.json
//
// Este proxy existe para contornar o bloqueio de CORS do servidor RHiD,
// que não envia headers Access-Control-Allow-Origin permissivos.

const RHID_BASE = 'https://www.rhid.com.br/v2/api.svc';

module.exports = async (req, res) => {
  // ── CORS ──────────────────────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const action = (req.query && req.query.action) || (req.body && req.body.action);

    if (!action) {
      return res.status(400).json({
        error: 'Parametro "action" ausente.',
        acoes_disponiveis: ['login', 'proxy'],
      });
    }

    // ── LOGIN ──────────────────────────────────────────────────────
    // POST /api/rhid?action=login
    // body: { email, password, domain? }
    if (action === 'login') {
      const { email, password, domain } = req.body || {};

      if (!email || !password) {
        return res.status(400).json({ error: 'email e password são obrigatórios.' });
      }

      const loginBody = { email, password };
      if (domain) loginBody.domain = domain;

      const r = await fetch(`${RHID_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginBody),
      });

      const text = await r.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        // Resposta não-JSON (ex: página de erro HTML do IIS/WCF) — devolve o texto bruto
        // para facilitar o diagnóstico, em vez de quebrar o fetch do front-end.
        return res.status(r.status).json({
          error: 'Resposta não-JSON do RHiD.',
          status: r.status,
          raw: text.slice(0, 2000),
        });
      }

      return res.status(r.ok ? 200 : r.status).json(data);
    }

    // ── PROXY GENÉRICO ─────────────────────────────────────────────
    // Usado para qualquer outro endpoint documentado no Swagger, ex:
    // POST /api/rhid?action=proxy
    // body: { token, method: 'GET', endpoint: '/funcionarios', body: {...} }
    if (action === 'proxy') {
      const { token, method = 'GET', endpoint, body: pb } = req.body || {};

      if (!token) return res.status(401).json({ error: 'Token JWT ausente.' });
      if (!endpoint) return res.status(400).json({ error: 'Endpoint ausente.' });

      const r = await fetch(`${RHID_BASE}${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: method !== 'GET' && pb ? JSON.stringify(pb) : undefined,
      });

      const text = await r.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return res.status(r.status).json({
          error: 'Resposta não-JSON do RHiD.',
          status: r.status,
          raw: text.slice(0, 2000),
        });
      }

      return res.status(r.ok ? 200 : r.status).json(data);
    }

    return res.status(400).json({
      error: 'Ação inválida.',
      acoes_disponiveis: ['login', 'proxy'],
    });

  } catch (err) {
    console.error('[RHiD Proxy Error]', err.message);
    return res.status(500).json({ error: 'Erro interno no proxy.', detail: err.message });
  }
};
