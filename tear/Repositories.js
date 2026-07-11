/* ═══════════════════════════════════════════════════════════════
   repositories/AtivacaoRepository.js
   ═══════════════════════════════════════════════════════════════ */

/**
 * Colunas da aba `Ativacoes` (docs/spec/SCHEMA_V2.md).
 *
 * `Estado_Derivado` está deliberadamente ausente: é coluna de apresentação,
 * calculada por fórmula na planilha. Nenhum Repository, Entity ou Service da
 * V2 pode lê-la ou escrevê-la — não é fonte de verdade.
 */
const CAMPOS_ATIVACAO = Object.freeze({
  ID: 'ID_Ativacao',
  CICLO: 'ID_Ciclo',
  INFLUENCIADORA: 'ID_Influenciadora',
  TIPO_CONTEUDO: 'Tipo_Conteudo',
  ESTADO: 'Estado_Principal',
  LOOK: 'Look_Referencia',
  ENTREGA_PREVISTA: 'Data_Prevista_Entrega',
  LINK_BRIEFING: 'Link_Briefing',
  LINK_UPLOAD_HD: 'Link_Upload_HD'
});

class AtivacaoRepository {
  constructor(spreadsheet) {
    this.spreadsheet = spreadsheet || SpreadsheetApp.getActive();
  }

  getById(id) {
    if (!id) {
      return null;
    }

    const { cabecalho, linhas } = this._lerDados();
    const idIdx = indiceDaColuna(cabecalho, CAMPOS_ATIVACAO.ID, PLANILHAS.ATIVACOES);
    const linha = linhas.find(l => this._mesmoId(l[idIdx], id));

    return linha ? linhaParaObjeto(cabecalho, linha) : null;
  }

  findByCiclo(cicloId) {
    if (!cicloId) {
      return [];
    }

    const { cabecalho, linhas } = this._lerDados();
    const cicloIdx = indiceDaColuna(cabecalho, CAMPOS_ATIVACAO.CICLO, PLANILHAS.ATIVACOES);

    return linhas
      .filter(l => this._mesmoId(l[cicloIdx], cicloId))
      .map(l => linhaParaObjeto(cabecalho, l));
  }

  save(ativacaoData) {
    if (!ativacaoData || typeof ativacaoData !== 'object') {
      throw new TypeError('save() espera um objeto de ativação.');
    }

    const { aba, cabecalho, linhas } = this._lerDados();
    const idIdx = indiceDaColuna(cabecalho, CAMPOS_ATIVACAO.ID, PLANILHAS.ATIVACOES);
    const id = ativacaoData[CAMPOS_ATIVACAO.ID];
    const posicao = id ? linhas.findIndex(l => this._mesmoId(l[idIdx], id)) : -1;

    if (posicao === -1) {
      const novo = Object.assign({}, ativacaoData);
      novo[CAMPOS_ATIVACAO.ID] = id || Utilities.getUuid();
      aba.appendRow(cabecalho.map(coluna => (coluna in novo ? novo[coluna] : '')));
      return novo;
    }

    const linhaAtual = linhas[posicao];
    const intervalo = aba.getRange(posicao + 2, 1, 1, cabecalho.length);
    const formulas = intervalo.getFormulas()[0];

    const atualizada = cabecalho.map((coluna, i) =>
      coluna && Object.prototype.hasOwnProperty.call(ativacaoData, coluna)
        ? ativacaoData[coluna]
        : linhaAtual[i]
    );

    const paraGravar = atualizada.map((valor, i) => (formulas[i] ? formulas[i] : valor));

    intervalo.setValues([paraGravar]);
    return linhaParaObjeto(cabecalho, atualizada);
  }

  _lerDados() {
    return lerAbaComCabecalho(this.spreadsheet, PLANILHAS.ATIVACOES);
  }

  _mesmoId(valorCelula, valorBusca) {
    return String(valorCelula).trim() === String(valorBusca).trim();
  }
}

/* ═══════════════════════════════════════════════════════════════
   repositories/CicloRepository.js
   ═══════════════════════════════════════════════════════════════ */

/**
 * Colunas da aba `Ciclos` (docs/spec/SCHEMA_V2.md).
 */
const CAMPOS_CICLO = Object.freeze({
  ID: 'ID_Ciclo',
  NOME: 'Nome_Ciclo',
  INICIO_LOGISTICA: 'Data_Inicio_Logistica',
  FIM_OPERACAO: 'Data_Fim_Operacao'
});

class CicloRepository {
  constructor(spreadsheet) {
    this.spreadsheet = spreadsheet || SpreadsheetApp.getActive();
  }

  listarTodos() {
    const nome = PLANILHAS.CICLOS;
    const { cabecalho, linhas } = lerAbaComCabecalho(this.spreadsheet, nome);

    return linhasComChave(cabecalho, linhas, CAMPOS_CICLO.ID, nome)
      .map(linha => linhaParaObjeto(cabecalho, linha));
  }
}

/* ═══════════════════════════════════════════════════════════════
   repositories/PlanoRepository.js
   ═══════════════════════════════════════════════════════════════ */

const CAMPOS_PLANO = Object.freeze({
  ID: 'ID_Plano',
  INFLUENCIADORA: 'ID_Influenciadora',
  CICLO: 'ID_Ciclo',
  QTD_ENTREGAVEIS: 'Qtd_Entregaveis',
  VALOR_CACHE: 'Valor_Cache'
});

class PlanoRepository {
  constructor(spreadsheet) {
    this.spreadsheet = spreadsheet || SpreadsheetApp.getActive();
  }

  findByCiclo(idCiclo) {
    if (!idCiclo) {
      return [];
    }

    const nome = PLANILHAS.PLANOS_COLABORACAO;
    const { cabecalho, linhas } = lerAbaComCabecalho(this.spreadsheet, nome);
    const cicloIdx = indiceDaColuna(cabecalho, CAMPOS_PLANO.CICLO, nome);

    return linhasComChave(cabecalho, linhas, CAMPOS_PLANO.ID, nome)
      .filter(linha => String(linha[cicloIdx]).trim() === String(idCiclo).trim())
      .map(linha => linhaParaObjeto(cabecalho, linha));
  }
}

/* ═══════════════════════════════════════════════════════════════
   repositories/ParceiroRepository.js
   ═══════════════════════════════════════════════════════════════ */

const CAMPOS_PARCEIRO = Object.freeze({
  ID: 'ID_Influenciadora',
  NOME: 'Nome',
  STATUS_CONTRATO: 'Status_Contrato',
  CATEGORIA: 'Categoria',
  CUPOM: 'Cupom',
  SENHA_HASH: 'Senha_Hash'
});

class ParceiroRepository {
  constructor(spreadsheet) {
    this.spreadsheet = spreadsheet || SpreadsheetApp.getActive();
  }

  findByCupom(cupom) {
    if (!cupom) {
      return null;
    }

    const encontrados = this._porCupom(cupom);

    return encontrados.length ? encontrados[0] : null;
  }

  _porCupom(cupom) {
    const alvo = this._normalizar(cupom);
    const encontrados = this._linhas().filter(
      linha => this._normalizar(linha[CAMPOS_PARCEIRO.CUPOM]) === alvo
    );

    if (encontrados.length > 1) {
      throw new Error(`Cadastro inconsistente: o cupom "${cupom}" está duplicado.`);
    }

    return encontrados;
  }

  getById(idInfluenciadora) {
    if (!idInfluenciadora) {
      return null;
    }

    const alvo = String(idInfluenciadora).trim();
    const encontrado = this._linhas().find(
      linha => String(linha[CAMPOS_PARCEIRO.ID]).trim() === alvo
    );

    return encontrado || null;
  }

  definirSenhaHash(cupom, hash) {
    const nome = PLANILHAS.PARCEIROS_INFLUENCIADORAS;
    const { aba, cabecalho, linhas } = lerAbaComCabecalho(this.spreadsheet, nome);
    const cupomIdx = indiceDaColuna(cabecalho, CAMPOS_PARCEIRO.CUPOM, nome);
    const senhaIdx = indiceDaColuna(cabecalho, CAMPOS_PARCEIRO.SENHA_HASH, nome);

    const alvo = this._normalizar(cupom);
    const posicoes = linhas
      .map((linha, i) => (this._normalizar(linha[cupomIdx]) === alvo ? i : -1))
      .filter(i => i !== -1);

    if (posicoes.length > 1) {
      throw new Error(`Cadastro inconsistente: o cupom "${cupom}" está duplicado.`);
    }

    const posicao = posicoes.length ? posicoes[0] : -1;

    if (posicao === -1) {
      throw new Error(`Parceira com cupom "${cupom}" não encontrada.`);
    }

    aba.getRange(posicao + 2, senhaIdx + 1).setValue(hash);
  }

  /**
   * Grava o `Senha_Hash` na linha localizada por uma coluna-chave arbitrária
   * (ex.: `INFLU_KEY`, o mesmo vocabulário do upsert do wizard). Existe ao lado
   * de `definirSenhaHash` (que casa por `Cupom`) porque o provisionamento
   * automático já conhece a parceira pela chave que acabou de salvar — não
   * precisa procurá-la de novo pelo cupom.
   */
  definirSenhaHashPorChave(colunaChave, valorChave, hash) {
    const nome = PLANILHAS.PARCEIROS_INFLUENCIADORAS;
    const { aba, cabecalho, linhas } = lerAbaComCabecalho(this.spreadsheet, nome);
    const chaveIdx = indiceDaColuna(cabecalho, colunaChave, nome);
    const senhaIdx = indiceDaColuna(cabecalho, CAMPOS_PARCEIRO.SENHA_HASH, nome);

    const alvo = this._normalizar(valorChave);
    const posicoes = linhas
      .map((linha, i) => (this._normalizar(linha[chaveIdx]) === alvo ? i : -1))
      .filter(i => i !== -1);

    if (posicoes.length > 1) {
      throw new Error(`Cadastro inconsistente: "${colunaChave}" = "${valorChave}" está duplicado.`);
    }

    if (!posicoes.length) {
      throw new Error(`Parceira com "${colunaChave}" = "${valorChave}" não encontrada.`);
    }

    aba.getRange(posicoes[0] + 2, senhaIdx + 1).setValue(hash);
  }

  /**
   * Grava um valor arbitrário numa `coluna`, na linha localizada por uma
   * coluna-chave (mesmo casamento de `definirSenhaHashPorChave`). Usado pelo
   * provisionamento da pasta do Drive (coluna `DRIVE`), que já conhece a parceira
   * pela chave recém-salva.
   */
  definirCampoPorChave(colunaChave, valorChave, coluna, valor) {
    const nome = PLANILHAS.PARCEIROS_INFLUENCIADORAS;
    const { aba, cabecalho, linhas } = lerAbaComCabecalho(this.spreadsheet, nome);
    const chaveIdx = indiceDaColuna(cabecalho, colunaChave, nome);
    const colunaIdx = indiceDaColuna(cabecalho, coluna, nome);

    const alvo = this._normalizar(valorChave);
    const posicoes = linhas
      .map((linha, i) => (this._normalizar(linha[chaveIdx]) === alvo ? i : -1))
      .filter(i => i !== -1);

    if (posicoes.length > 1) {
      throw new Error(`Cadastro inconsistente: "${colunaChave}" = "${valorChave}" está duplicado.`);
    }

    if (!posicoes.length) {
      throw new Error(`Parceira com "${colunaChave}" = "${valorChave}" não encontrada.`);
    }

    aba.getRange(posicoes[0] + 2, colunaIdx + 1).setValue(valor);
  }

  buscarPorCampo(campo, valor) {
    if (!campo || valor === null || valor === undefined || String(valor).trim() === '') {
      return null;
    }

    const alvo = this._normalizar(valor);
    const encontrados = this._todasAsLinhas().filter(
      linha => this._normalizar(linha[campo]) === alvo
    );

    return encontrados.length ? encontrados[0] : null;
  }

  upsert(dados, chave) {
    const colunaChave = chave || 'INFLU_KEY';
    const nome = PLANILHAS.PARCEIROS_INFLUENCIADORAS;
    const { aba, cabecalho, linhas } = lerAbaComCabecalho(this.spreadsheet, nome);
    const chaveIdx = indiceDaColuna(cabecalho, colunaChave, nome);
    const alvo = this._normalizar(dados[colunaChave]);

    if (!alvo) {
      throw new Error(`É obrigatório informar "${colunaChave}".`);
    }

    const posicoes = linhas
      .map((linha, i) => (this._normalizar(linha[chaveIdx]) === alvo ? i : -1))
      .filter(i => i !== -1);

    if (posicoes.length > 1) {
      throw new Error(`Cadastro inconsistente: "${colunaChave}" = "${dados[colunaChave]}" está duplicado.`);
    }

    if (posicoes.length === 1) {
      const linhaPlanilha = posicoes[0] + 2;
      cabecalho.forEach((coluna, c) => {
        if (Object.prototype.hasOwnProperty.call(dados, coluna)) {
          aba.getRange(linhaPlanilha, c + 1).setValue(dados[coluna]);
        }
      });

      return { chave: dados[colunaChave], criado: false };
    }

    const novaLinha = cabecalho.map(coluna =>
      Object.prototype.hasOwnProperty.call(dados, coluna) ? dados[coluna] : ''
    );
    aba.appendRow(novaLinha);

    return { chave: dados[colunaChave], criado: true };
  }

  _todasAsLinhas() {
    const nome = PLANILHAS.PARCEIROS_INFLUENCIADORAS;
    const { cabecalho, linhas } = lerAbaComCabecalho(this.spreadsheet, nome);

    return linhas
      .filter(linha => linha.some(celula => String(celula === null || celula === undefined ? '' : celula).trim() !== ''))
      .map(linha => linhaParaObjeto(cabecalho, linha));
  }

  _linhas() {
    const nome = PLANILHAS.PARCEIROS_INFLUENCIADORAS;
    const { cabecalho, linhas } = lerAbaComCabecalho(this.spreadsheet, nome);

    return linhasComChave(cabecalho, linhas, CAMPOS_PARCEIRO.ID, nome)
      .map(linha => linhaParaObjeto(cabecalho, linha));
  }

  _normalizar(valor) {
    return String(valor === null || valor === undefined ? '' : valor).trim().toUpperCase();
  }
}

/* ═══════════════════════════════════════════════════════════════
   repositories/CadastroRepository.js
   ═══════════════════════════════════════════════════════════════ */

/**
 * Leitura da aba `CADASTROS` — a entrada RAW do Google Forms (docs/spec/
 * SCHEMA_V2.md). Fonte do CNPJ original, que a base canônica da V2 não guarda:
 * o provisionamento da senha padrão (5 primeiros dígitos do CNPJ, regra da V1)
 * precisa voltar aqui para achá-lo. Só devolve linhas cruas título→valor; a
 * lógica de casar apelido e extrair CNPJ fica no ParceiroService, ao lado dos
 * demais leitores de cadastro (`_leitorDeCadastro_`).
 *
 * `spreadsheet` resolvido preguiçosamente (em `linhas()`, não no construtor):
 * instanciar o repositório — o que o ParceiroService faz por padrão — nunca
 * pode exigir `SpreadsheetApp`, senão fluxos puros quebrariam à toa.
 */
class CadastroRepository {
  constructor(spreadsheet) {
    this._spreadsheet = spreadsheet || null;
  }

  linhas() {
    const planilha = this._spreadsheet || SpreadsheetApp.getActive();
    const nome = PLANILHAS.CADASTROS;
    const { cabecalho, linhas } = lerAbaComCabecalho(planilha, nome);

    return linhas
      .filter(linha => linha.some(celula => String(celula === null || celula === undefined ? '' : celula).trim() !== ''))
      .map(linha => linhaParaObjeto(cabecalho, linha));
  }
}

/* ═══════════════════════════════════════════════════════════════
   repositories/BriefingRepository.js
   ═══════════════════════════════════════════════════════════════ */

/** Aba da planilha INDIVIDUAL da influenciadora onde ficam os looks (esquema V1). */
const ABA_LOOKS_EXTERNA = 'LOOKS BRIEFING';

/**
 * Leitura dos looks na planilha EXTERNA de cada influenciadora — o mesmo
 * `INFLU_SHEET_URL` que o script antigo (`sincronizarLooks`) abria. Só faz o
 * I/O bruto (abre a URL, acha a aba, devolve as linhas); a interpretação
 * (col A → col B, title-case) fica no BriefingService, como manda a camada.
 *
 * `abrirPorUrl` injetável para teste; em produção cai em `SpreadsheetApp.openByUrl`.
 */
class BriefingRepository {
  constructor(abrirPorUrl) {
    this._abrirPorUrl = abrirPorUrl || null;
  }

  lerLooksExternos(url) {
    const texto = String(url === null || url === undefined ? '' : url).trim();

    // Mesma porteira da V1: só URL de Google Docs de parceira ativa é aberta.
    if (!texto || texto.indexOf('docs.google.com') === -1) {
      return null;
    }

    const abrir = this._abrirPorUrl ||
      (typeof SpreadsheetApp !== 'undefined' ? (u) => SpreadsheetApp.openByUrl(u) : null);
    if (!abrir) {
      return null;
    }

    const externa = abrir(texto);
    if (!externa) {
      return null;
    }

    const abaLooks = externa.getSheetByName(ABA_LOOKS_EXTERNA) ||
      (typeof externa.getSheets === 'function' ? externa.getSheets()[0] : null);
    if (!abaLooks) {
      return null;
    }

    return abaLooks.getDataRange().getValues();
  }
}

/* ═══════════════════════════════════════════════════════════════
   repositories/SessaoRepository.js
   ═══════════════════════════════════════════════════════════════ */

const SESSAO_TTL_SEGUNDOS = 21600;
const SESSAO_TTL_ABSOLUTO_SEGUNDOS = 604800;
const LOGIN_MAX_TENTATIVAS = 5;
const LOGIN_BLOQUEIO_SEGUNDOS = 900;
const SEPARADOR_CACHE = '|';

class SessaoRepository {
  constructor(cache) {
    this.cache = cache || CacheService.getScriptCache();
  }

  criar(idInfluenciadora) {
    const token = Utilities.getUuid();
    const valor = String(idInfluenciadora) + SEPARADOR_CACHE + Date.now();

    this.cache.put(this._chaveSessao(token), valor, SESSAO_TTL_SEGUNDOS);

    return token;
  }

  resolver(token) {
    if (!token) {
      return null;
    }

    const chave = this._chaveSessao(token);
    const bruto = this.cache.get(chave);

    if (!bruto) {
      return null;
    }

    const partes = String(bruto).split(SEPARADOR_CACHE);
    const idInfluenciadora = partes[0];
    const criadaEm = Number(partes[1]);

    if (!criadaEm || (Date.now() - criadaEm) / 1000 > SESSAO_TTL_ABSOLUTO_SEGUNDOS) {
      this.cache.remove(chave);
      return null;
    }

    this.cache.put(chave, bruto, SESSAO_TTL_SEGUNDOS);

    return idInfluenciadora;
  }

  destruir(token) {
    if (token) {
      this.cache.remove(this._chaveSessao(token));
    }
  }

  estaBloqueado(cupom) {
    return this._tentativas(cupom) >= LOGIN_MAX_TENTATIVAS;
  }

  registrarTentativa(cupom) {
    const agora = Date.now();
    const atual = this._registroDeTentativas(cupom);

    const total = atual.total + 1;
    const expiraEm = atual.expiraEm || agora + LOGIN_BLOQUEIO_SEGUNDOS * 1000;
    const segundosRestantes = Math.max(1, Math.ceil((expiraEm - agora) / 1000));

    this.cache.put(
      this._chaveTentativas(cupom),
      String(total) + SEPARADOR_CACHE + expiraEm,
      segundosRestantes
    );

    return total;
  }

  limparTentativas(cupom) {
    this.cache.remove(this._chaveTentativas(cupom));
  }

  _tentativas(cupom) {
    return this._registroDeTentativas(cupom).total;
  }

  _registroDeTentativas(cupom) {
    const bruto = this.cache.get(this._chaveTentativas(cupom));

    if (!bruto) {
      return { total: 0, expiraEm: 0 };
    }

    const partes = String(bruto).split(SEPARADOR_CACHE);
    const expiraEm = Number(partes[1]) || 0;

    if (expiraEm && Date.now() >= expiraEm) {
      return { total: 0, expiraEm: 0 };
    }

    return { total: Number(partes[0]) || 0, expiraEm: expiraEm };
  }

  _chaveSessao(token) {
    return 'sessao:' + token;
  }

  _chaveTentativas(cupom) {
    return 'tentativas:' + String(cupom).trim().toUpperCase();
  }
}

/* ═══════════════════════════════════════════════════════════════
   repositories/LogisticaRepository.js
   ═══════════════════════════════════════════════════════════════ */

/**
 * Colunas da aba `Logistica` (docs/spec/SCHEMA_V2.md). Acesso por NOME de
 * cabeçalho, nunca por índice — inserir coluna não pode quebrar a leitura.
 */
const CAMPOS_LOGISTICA = Object.freeze({
  ID: 'ID_Logistica',
  CICLO: 'ID_Ciclo',
  INFLUENCIADORA: 'ID_Influenciadora',
  ENDERECO: 'Endereco_Entrega',
  RASTREIO: 'Codigo_Rastreio',
  DATA_ENVIO: 'Data_Envio',
  STATUS: 'Status_Logistica'
});

class LogisticaRepository {
  constructor(spreadsheet) {
    this.spreadsheet = spreadsheet || SpreadsheetApp.getActive();
  }

  getById(id) {
    if (!id) {
      return null;
    }

    const { cabecalho, linhas } = this._lerDados();
    const idIdx = indiceDaColuna(cabecalho, CAMPOS_LOGISTICA.ID, PLANILHAS.LOGISTICA);
    const linha = linhas.find(l => this._mesmoId(l[idIdx], id));

    return linha ? linhaParaObjeto(cabecalho, linha) : null;
  }

  findByCiclo(cicloId) {
    if (!cicloId) {
      return [];
    }

    const { cabecalho, linhas } = this._lerDados();
    const cicloIdx = indiceDaColuna(cabecalho, CAMPOS_LOGISTICA.CICLO, PLANILHAS.LOGISTICA);

    return linhas
      .filter(l => this._mesmoId(l[cicloIdx], cicloId))
      .map(l => linhaParaObjeto(cabecalho, l));
  }

  save(logisticaData) {
    if (!logisticaData || typeof logisticaData !== 'object') {
      throw new TypeError('save() espera um objeto de logística.');
    }

    const { aba, cabecalho, linhas } = this._lerDados();
    const idIdx = indiceDaColuna(cabecalho, CAMPOS_LOGISTICA.ID, PLANILHAS.LOGISTICA);
    const id = logisticaData[CAMPOS_LOGISTICA.ID];
    const posicao = id ? linhas.findIndex(l => this._mesmoId(l[idIdx], id)) : -1;

    if (posicao === -1) {
      const novo = Object.assign({}, logisticaData);
      novo[CAMPOS_LOGISTICA.ID] = id || Utilities.getUuid();
      aba.appendRow(cabecalho.map(coluna => (coluna in novo ? novo[coluna] : '')));
      return novo;
    }

    const linhaAtual = linhas[posicao];
    const intervalo = aba.getRange(posicao + 2, 1, 1, cabecalho.length);
    const formulas = intervalo.getFormulas()[0];

    const atualizada = cabecalho.map((coluna, i) =>
      coluna && Object.prototype.hasOwnProperty.call(logisticaData, coluna)
        ? logisticaData[coluna]
        : linhaAtual[i]
    );

    const paraGravar = atualizada.map((valor, i) => (formulas[i] ? formulas[i] : valor));

    intervalo.setValues([paraGravar]);
    return linhaParaObjeto(cabecalho, atualizada);
  }

  _lerDados() {
    return lerAbaComCabecalho(this.spreadsheet, PLANILHAS.LOGISTICA);
  }

  _mesmoId(valorCelula, valorBusca) {
    return String(valorCelula).trim() === String(valorBusca).trim();
  }
}