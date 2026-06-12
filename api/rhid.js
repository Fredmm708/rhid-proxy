const RHID_BASE = 'https://www.rhid.com.br/v2';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action;
  const body = req.body || {};

  try {

    if (action === 'login') {
      const login = body.login;
      const password = body.password;
      if (!login || !password) {
        return res.status(400).json({ error: 'Informe login e password.' });
      }

      // Tenta os endpoints mais comuns do RHiD em sequência
      const endpoints = [
        { url: RHID_BASE + '/login',             body: { login, password } },
        { url: RHID_BASE + '/auth',              body: { login, password } },
        { url: RHID_BASE + '/auth/login',        body: { login, password } },
        { url: RHID_BASE + '/usuarios/autenticar', body: { login, password } },
        { url: RHID_BASE + '/login',             body: { email: login, senha: password } },
        { url: RHID_BASE + '/login',             body: { usuario: login, senha: password } },
        { url: RHID_BASE + '/autenticar',        body: { login, password } },
      ];

      const results = [];

      for (const ep of endpoints) {
        try {
          const r = await fetch(ep.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ep.body),
            signal: AbortSignal.timeout(8000)
          });
          const text = await r.text();
          let data;
          try { data = JSON.parse(text); } catch(e) { data = { raw: text }; }

          results.push({ endpoint: ep.url, bodyKeys: Object.keys(ep.body), status: r.status, response: data });

          // Se retornou token, sucesso!
          if (r.ok && (data.token || data.access_token || data.jwt)) {
            const token = data.token || data.access_token || data.jwt;
            return res.status(200).json({ token, endpoint: ep.url, raw: data });
          }
        } catch (err) {
          results.push({ endpoint: ep.url, error: err.message });
        }
      }

      // Nenhum funcionou — retorna todos os resultados para diagnóstico
      return res.status(401).json({
        error: 'Nenhum endpoint de login funcionou.',
        diagnostico: results
      });
    }

    if (action === 'resumo') {
      const token = req.query.token;
      const inicio = req.query.inicio || '';
      const fim = req.query.fim || '';
      if (!token) return res.status(401).json({ error: 'Token ausente.' });
      const r = await fetch(RHID_BASE + '/relatorios/resumo-empresa?inicio=' + inicio + '&fim=' + fim, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await r.json();
      return res.status(r.ok ? 200 : r.status).json(data);
    }

    if (action === 'empresas') {
      const token = req.query.token;
      if (!token) return res.status(401).json({ error: 'Token ausente.' });
      const r = await fetch(RHID_BASE + '/empresas', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await r.json();
      return res.status(r.ok ? 200 : r.status).json(data);
    }

    if (action === 'funcionarios') {
      const token = req.query.token;
      const empresa = req.query.empresa || '';
      if (!token) return res.status(401).json({ error: 'Token ausente.' });
      const url = empresa ? RHID_BASE + '/funcionarios?empresa=' + empresa : RHID_BASE + '/funcionarios';
      const r = await fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
      const data = await r.json();
      return res.status(r.ok ? 200 : r.status).json(data);
    }

    if (action === 'marcacoes') {
      const token = req.query.token;
      const inicio = req.query.inicio || '';
      const fim = req.query.fim || '';
      const empresa = req.query.empresa || '';
      if (!token) return res.status(401).json({ error: 'Token ausente.' });
      let url = RHID_BASE + '/marcacoes?';
      if (inicio) url += 'inicio=' + inicio + '&';
      if (fim) url += 'fim=' + fim + '&';
      if (empresa) url += 'empresa=' + empresa + '&';
      const r = await fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
      const data = await r.json();
      return res.status(r.ok ? 200 : r.status).json(data);
    }

    return res.status(400).json({ error: 'Acao invalida.' });

  } catch (err) {
    return res.status(500).json({ error: 'Erro no proxy.', detail: err.message });
  }
};
