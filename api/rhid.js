const RHID_BASE = 'https://www.rhid.com.br';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action;
  const body = req.body || {};

  try {

    // ── LOGIN — padrão Control iD: POST /login.fcgi ──────────
    if (action === 'login') {
      const login = body.login;
      const password = body.password;
      if (!login || !password) {
        return res.status(400).json({ error: 'Informe login e password.' });
      }

      const r = await fetch(RHID_BASE + '/login.fcgi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: login, password: password })
      });

      const text = await r.text();
      let data;
      try { data = JSON.parse(text); } catch(e) { data = { raw: text.substring(0, 300) }; }

      if (!r.ok || !data.session) {
        return res.status(401).json({
          error: 'Login falhou ou session ausente.',
          status: r.status,
          response: data
        });
      }

      // "session" é o token a ser reutilizado nas próximas chamadas
      return res.status(200).json({ token: data.session, raw: data });
    }

    // ── RESUMO POR EMPRESA ────────────────────────────────────
    if (action === 'resumo') {
      const token = req.query.token;
      const inicio = req.query.inicio || '';
      const fim = req.query.fim || '';
      if (!token) return res.status(401).json({ error: 'Token (session) ausente.' });

      const r = await fetch(
        RHID_BASE + '/load_objects.fcgi?session=' + encodeURIComponent(token),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ object: 'resumo_empresa', inicio, fim })
        }
      );
      const text = await r.text();
      let data;
      try { data = JSON.parse(text); } catch(e) { data = { raw: text.substring(0,300) }; }
      return res.status(r.ok ? 200 : r.status).json(data);
    }

    // ── PROXY GENÉRICO — para qualquer objeto via load_objects.fcgi ──
    if (action === 'load_objects') {
      const token = req.query.token;
      const objectName = req.query.object;
      if (!token) return res.status(401).json({ error: 'Token (session) ausente.' });
      if (!objectName) return res.status(400).json({ error: 'Parâmetro object ausente.' });

      const r = await fetch(
        RHID_BASE + '/load_objects.fcgi?session=' + encodeURIComponent(token),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body && Object.keys(body).length ? body : { object: objectName })
        }
      );
      const text = await r.text();
      let data;
      try { data = JSON.parse(text); } catch(e) { data = { raw: text.substring(0,300) }; }
      return res.status(r.ok ? 200 : r.status).json(data);
    }

    return res.status(400).json({
      error: 'Acao invalida.',
      acoes_disponiveis: ['login', 'resumo', 'load_objects']
    });

  } catch (err) {
    return res.status(500).json({ error: 'Erro no proxy.', detail: err.message });
  }
};
