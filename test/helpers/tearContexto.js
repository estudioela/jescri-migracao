/**
 * Monta o contexto completo da V2 num sandbox: todos os arquivos de `tear/` no
 * mesmo escopo global (como o Apps Script os concatena), com planilha, cache e
 * Utilities falsos.
 *
 * Existe porque, desde a Etapa 7, toda leitura passa pela sessão: um teste de
 * `apiListarAtivacoesDoCiclo` precisa de uma parceira autenticada, e montar isso
 * à mão em cada arquivo de teste multiplicaria o mesmo andaime.
 */
const path = require('path');
const crypto = require('crypto');
const { loadGasFiles } = require('./loadGasModule');

const RAIZ = path.join(__dirname, '..', '..');
const arquivo = (nome) => path.join(RAIZ, 'tear', nome);

// Ordem irrelevante no Apps Script (escopo global único), mas Config primeiro
// deixa claro que os demais dependem dele.
const ARQUIVOS = [
  'Config.js', 'PlanilhaHelpers.js', 'Senha.js', 'Dto.js',
  'Ativacao.js', 'AtivacaoRepository.js', 'EventDispatcher.js', 'AtivacaoService.js', 'AtivacaoController.js',
  'CicloRepository.js', 'CicloService.js', 'CicloController.js',
  'PlanoRepository.js', 'PagamentoService.js', 'PagamentoController.js',
  'ParceiroRepository.js', 'SessaoRepository.js', 'AuthService.js', 'AuthController.js',
  'Entrypoints.js'
];

const EXPORTS = [
  'apiLogin', 'apiLogout', 'apiSessaoAtual', 'adminDefinirSenha',
  'apiListarCiclos', 'apiListarAtivacoesDoCiclo', 'apiListarHistoricoDoCiclo', 'apiListarPagamentosDoCiclo',
  'AuthService', 'ParceiroRepository', 'SessaoRepository', 'PagamentoService',
  'CAMPOS_PARCEIRO', 'CAMPOS_ATIVACAO', 'ESTADOS_ATIVACAO', 'criarSenhaHash', 'senhaConfere',
  'LOGIN_MAX_TENTATIVAS'
];

const CABECALHOS = {
  Ativacoes: ['ID_Ativacao', 'ID_Ciclo', 'ID_Influenciadora', 'Tipo_Conteudo', 'Estado_Principal', 'Link_Briefing'],
  Ciclos: ['ID_Ciclo', 'Nome_Ciclo', 'Data_Inicio_Logistica', 'Data_Fim_Operacao'],
  Planos_Colaboracao: ['ID_Plano', 'ID_Influenciadora', 'ID_Ciclo', 'Qtd_Entregaveis', 'Valor_Cache'],
  Parceiros_Influenciadoras: ['ID_Influenciadora', 'Nome', 'Status_Contrato', 'Categoria', 'Cupom', 'Senha_Hash']
};

const utilitiesFalso = () => {
  let contador = 0;

  return {
    DigestAlgorithm: { SHA_256: 'sha256' },
    Charset: { UTF_8: 'utf8' },
    computeDigest: (_alg, texto) => Array.from(crypto.createHash('sha256').update(texto, 'utf8').digest()),
    getUuid: () => 'uuid-' + ++contador
  };
};

function abaFalsa(cabecalho, linhas) {
  const escrito = [];

  return {
    escrito,
    getDataRange: () => ({ getValues: () => [cabecalho.slice()].concat(linhas.map((l) => l.slice())) }),
    getRange: (linha, coluna) => ({
      setValue: (valor) => {
        escrito.push({ linha, coluna, valor });
        linhas[linha - 2][coluna - 1] = valor;
      },
      getFormulas: () => [cabecalho.map(() => '')],
      setValues: (valores) => escrito.push(valores[0])
    }),
    appendRow: (linha) => linhas.push(linha)
  };
}

function cacheFalso() {
  const dados = new Map();

  return {
    dados,
    get: (k) => (dados.has(k) ? dados.get(k) : null),
    put: (k, v) => dados.set(k, String(v)),
    remove: (k) => dados.delete(k)
  };
}

/**
 * `dados` é um mapa nome-da-aba → linhas (sem cabeçalho). Uma aba omitida
 * simplesmente não existe na planilha, e o Repository correspondente lança —
 * é o cenário real de hoje, em que as abas da V2 ainda não foram criadas.
 */
function montarTear(dados = {}) {
  const abas = {};

  Object.keys(dados).forEach((nome) => {
    abas[nome] = abaFalsa(CABECALHOS[nome], dados[nome].map((l) => l.slice()));
  });

  const cache = cacheFalso();
  const sandbox = {
    Utilities: utilitiesFalso(),
    console: { error() {} },
    SpreadsheetApp: { getActive: () => ({ getSheetByName: (nome) => abas[nome] || null }) },
    CacheService: { getScriptCache: () => cache },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null }) }
  };

  const ctx = loadGasFiles(ARQUIVOS.map(arquivo), sandbox, EXPORTS);

  return { ctx, abas, cache, sandbox };
}

/** Cadastra a senha da parceira e devolve um token de sessão válido. */
function autenticar(tear, cupom, senha = 'segredo') {
  new tear.ctx.ParceiroRepository().definirSenhaHash(cupom, tear.ctx.criarSenhaHash(senha));

  const resposta = tear.ctx.apiLogin(cupom, senha);

  if (!resposta.success) {
    throw new Error('Falha ao autenticar no teste: ' + resposta.error);
  }

  return resposta.data.token;
}

module.exports = { montarTear, autenticar, CABECALHOS };
