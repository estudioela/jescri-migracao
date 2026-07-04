// estúdio elã — camada de API para o Apps Script backend
//
// O backend não expõe uma API JSON nativa: até este ponto ele só respondia a
if (typeof document !== 'undefined') {

// estúdio elã — camada de API para o Apps Script backend
//
// O backend não expõe uma API JSON nativa: até este ponto ele só respondia a
// google.script.run (que só funciona de dentro da própria página servida pelo
// Apps Script). Foi adicionado um doPost() aditivo em WebApp.js que apenas
// roteia {action, ...params} para as funções já existentes (login,
// getPendencias, ...) sem alterar nenhuma delas.

const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbyBqxe6HpQEEQ0Wk5z27TpIDrpHl64EilmY7ZuMbBCJinnU-LGO4H8nJauf7Cz6UTTcuA/exec';
const SESSION_KEY = 'ela_portal_session';

async function callApi(action, params) {
  let res;
  try {
    res = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...params }),
    });
  } catch (networkError) {
    return { ok: false, erro: 'FALHA_DE_REDE' };
  }
  if (!res.ok) return { ok: false, erro: `HTTP_${res.status}` };
  try {
    return await res.json();
  } catch (parseError) {
    return { ok: false, erro: 'RESPOSTA_INVALIDA' };
  }
}

function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function isAuthenticated() {
  return !!getSession();
}

// se o backend disser que a sessão expirou, derruba a sessão local também
function handleSessionExpiry(res) {
  if (res && res.ok === false && res.erro === 'SESSAO_EXPIRADA') clearSession();
  return res;
}

function authedCall(action, params) {
  const session = getSession();
  if (!session) return Promise.resolve({ ok: false, erro: 'SESSAO_EXPIRADA' });
  return callApi(action, { token: session.token, ...params }).then(handleSessionExpiry);
}

async function login(cupom, senha) {
  const res = await callApi('login', { cupom, senha });
  if (res.ok) {
    setSession({ token: res.token, nome: res.nome, cupom });
  }
  return res;
}

function logout() {
  const session = getSession();
  clearSession();
  if (session) callApi('logout', { token: session.token });
}

function getDashboard(mesAno) {
  return authedCall('getPendencias', { mesAno });
}

function getBriefing(idAtivacao) {
  return authedCall('getBriefing', { idAtivacao });
}

function getPagamentos(mesAno) {
  return authedCall('getPagamentos', { mesAno });
}

function getHistorico(mesAno) {
  return authedCall('getHistorico', { mesAno });
}

function getUserData() {
  return authedCall('getPerfil', {});
}

function updateUserData(dadosAtualizados) {
  return authedCall('updatePerfil', { dadosAtualizados });
}

function iniciarEnvioResumable(idAtivacao, nomeArquivo, mimeType, tamanhoBytes) {
  return authedCall('iniciarEnvioResumable', { idAtivacao, nomeArquivo, mimeType, tamanhoBytes });
}

function finalizarEnvioResumable(idAtivacao, fileId) {
  return authedCall('finalizarEnvioResumable', { idAtivacao, fileId });
}

// upload direto pro Drive via URL resumable (mesmo protocolo do portal-index.html
// original: PUT em chunks de 8MB, segue redirecionamento 308/Range)
async function enviarArquivoResumable(uploadUrl, file, onProgress) {
  const CHUNK_SIZE = 8 * 1024 * 1024;
  const totalSize = file.size;
  let offset = 0;

  if (totalSize === 0) throw new Error('Arquivo vazio.');

  while (offset < totalSize) {
    const fim = Math.min(offset + CHUNK_SIZE, totalSize) - 1;
    const chunk = file.slice(offset, fim + 1);

    const resp = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Range': `bytes ${offset}-${fim}/${totalSize}` },
      body: chunk,
    });

    if (resp.status === 308) {
      const range = resp.headers.get('Range');
      let proximoOffset = fim + 1;
      if (range) {
        const match = /bytes=0-(\d+)/.exec(range);
        if (match) proximoOffset = parseInt(match[1], 10) + 1;
      }
      offset = proximoOffset;
      if (onProgress) onProgress(offset / totalSize);
    } else if (resp.status === 200 || resp.status === 201) {
      if (onProgress) onProgress(1);
      const json = await resp.json();
      if (json && json.id) return json.id;
      throw new Error('Resposta de upload sem identificador de arquivo.');
    } else {
      throw new Error(`Falha no envio (status ${resp.status}).`);
    }
  }
  throw new Error('Upload não finalizado.');
}

window.ElaApi = {
  login,
  logout,
  getDashboard,
  getBriefing,
  getPagamentos,
  getHistorico,
  getUserData,
  updateUserData,
  iniciarEnvioResumable,
  finalizarEnvioResumable,
  enviarArquivoResumable,
  isAuthenticated,
  getSession,
};

}

