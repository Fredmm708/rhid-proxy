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
      const r = await fetch(RHID_BASE + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: login, password: password })
      });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: 'Falha no login.', detail: data });
      const token = data.token || data.access_token || data;
      return res.status(200).json({ token: token, raw: data });
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
      const r = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
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
      const r = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await r.json();
      return res.status(r.ok ? 200 : r.status).json(data);
    }

    return res.status(400).json({ error: 'Acao invalida.' });

  } catch (err) {
    return res.status(500).json({ error: 'Erro no proxy.', detail: err.message });
  }
};
