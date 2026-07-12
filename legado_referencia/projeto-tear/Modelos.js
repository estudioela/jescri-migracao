/* ═══════════════════════════════════════════════════════════════
   dominio/Senha.js
   ═══════════════════════════════════════════════════════════════ */

/**
 * Hash de senha da V2.
 *
 * A V1 usa o prefixo do CNPJ como senha — baixa entropia por design, e o CNPJ
 * fica em texto puro na planilha. A V2 abandona isso: guarda `salt$hash`, com
 * salt aleatório por parceira, e nunca a senha.
 *
 * `function` declarations, não classe: sofrem hoisting e não dependem da ordem
 * de carga entre arquivos do Apps Script (CLAUDE.md §13).
 */

const SEPARADOR_SENHA = '$';

function _bytesParaHex(bytes) {
  return bytes
    .map(byte => ('0' + (byte & 0xff).toString(16)).slice(-2))
    .join('');
}

function calcularHashDeSenha(salt, senha) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    salt + senha,
    Utilities.Charset.UTF_8
  );

  return _bytesParaHex(digest);
}

/** Salt novo a cada senha: duas parceiras com a mesma senha têm hashes distintos. */
function criarSenhaHash(senha) {
  const salt = Utilities.getUuid();

  return salt + SEPARADOR_SENHA + calcularHashDeSenha(salt, senha);
}

/**
 * Senha PADRÃO da parceira: os 5 primeiros dígitos do CNPJ (regra herdada da V1).
 *
 * PURA e sem I/O — só extrai os dígitos. Quem provisiona (Roteador.
 * adminProvisionarSenhaPadrao) passa o texto por `criarSenhaHash`: a V2 nunca
 * guarda a senha em claro, ao contrário da V1 (ver bloco no topo deste arquivo).
 * Lança se o CNPJ tiver menos de 5 dígitos — provisionar uma senha curta demais
 * seria uma credencial fraca e silenciosa.
 */
function senhaPadraoDeCnpj(cnpj) {
  const digitos = String(cnpj === null || cnpj === undefined ? '' : cnpj).replace(/\D/g, '');

  if (digitos.length < 5) {
    throw new Error('CNPJ inválido: são necessários ao menos 5 dígitos para a senha padrão.');
  }

  return digitos.slice(0, 5);
}

/**
 * Compara em tempo constante. Um `===` de string sai no primeiro byte diferente,
 * e a diferença de tempo vaza informação sobre o hash correto.
 */
function _comparacaoEmTempoConstante(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  let diferenca = 0;

  for (let i = 0; i < a.length; i++) {
    diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return diferenca === 0;
}

function senhaConfere(senha, armazenado) {
  if (!senha || !armazenado) {
    return false;
  }

  const partes = String(armazenado).split(SEPARADOR_SENHA);

  if (partes.length !== 2 || !partes[0] || !partes[1]) {
    return false;
  }

  return _comparacaoEmTempoConstante(calcularHashDeSenha(partes[0], senha), partes[1]);
}

/* ═══════════════════════════════════════════════════════════════
   dominio/Dto.js
   ═══════════════════════════════════════════════════════════════ */

/**
 * Serialização de valor de célula → DTO, compartilhada pelos Services.
 *
 * Os quatro Services repetiam `_texto`/`_data` idênticos. A planilha devolve
 * `Date` para coluna de data e `''` para célula vazia; `google.script.run` não
 * preserva `Date` de forma confiável, então tudo sai como string.
 *
 * `function` declarations, não classe nem `const`: sofrem hoisting e não
 * dependem da ordem de carga entre arquivos do Apps Script (CLAUDE.md §13),
 * como Planilha.js e Senha.js.
 */

function textoDeCelula(valor) {
  return valor === null || valor === undefined ? '' : String(valor);
}

/**
 * Title Case idêntico ao do script antigo (`mae/Código.js formatarTitleCase`),
 * usado na varredura de looks do briefing. Mantido byte-a-byte para não divergir
 * do legado: cada palavra ganha inicial maiúscula, o resto minúsculo. PURA.
 */
function formatarTitleCase(t) {
  return (!t) ? '' : String(t).toLowerCase().split(' ').map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : '').join(' ');
}

/** `Date` vira ISO 8601; qualquer outro valor cai em `textoDeCelula`. */
function dataIsoDeCelula(valor) {
  if (valor instanceof Date) {
    return valor.toISOString();
  }

  return textoDeCelula(valor);
}

/**
 * Recua `dias` corridos a partir de uma data ISO, devolvendo ISO 8601.
 *
 * PURA — usada para derivar o PRAZO DE APROVAÇÃO da ativação: exatos 7 dias
 * corridos antes da data de postagem/entrega (regra do briefing). Célula vazia
 * ou data inválida devolve `''`: sem entrega prevista não há prazo a calcular,
 * e a UI trata igual a qualquer outro campo ausente.
 */
function dataMenosDiasCorridos(iso, dias) {
  const texto = textoDeCelula(iso);

  if (!texto) {
    return '';
  }

  const base = new Date(texto);

  if (isNaN(base.getTime())) {
    return '';
  }

  base.setUTCDate(base.getUTCDate() - dias);

  return base.toISOString();
}

/* ═══════════════════════════════════════════════════════════════
   dominio/Ativacao.js
   ═══════════════════════════════════════════════════════════════ */

class Ativacao {
  constructor(dados) {
    if (!dados || typeof dados !== 'object') {
      throw new TypeError('Ativacao exige um objeto de dados da ativação.');
    }

    this.dados = dados;
  }

  get id() {
    return this.dados[CAMPOS_ATIVACAO.ID];
  }

  get estadoAtual() {
    return this.dados[CAMPOS_ATIVACAO.ESTADO];
  }

  static get TRANSICOES_PERMITIDAS() {
    const E = ESTADOS_ATIVACAO;

    return Object.freeze({
      [E.PLANEJAMENTO]: [E.PRONTA_PARA_ENVIO, E.ARQUIVADA],
      [E.PRONTA_PARA_ENVIO]: [E.AGUARDANDO_RECEBIMENTO, E.ARQUIVADA],
      [E.AGUARDANDO_RECEBIMENTO]: [E.EM_PRODUCAO, E.ARQUIVADA],
      [E.EM_PRODUCAO]: [E.AGUARDANDO_APROVACAO, E.ARQUIVADA],
      [E.AGUARDANDO_APROVACAO]: [E.APROVADA, E.EM_AJUSTES, E.ARQUIVADA],
      [E.EM_AJUSTES]: [E.AGUARDANDO_APROVACAO, E.ARQUIVADA],
      [E.APROVADA]: [E.AGENDADA, E.ARQUIVADA],
      [E.AGENDADA]: [E.PUBLICADA, E.ARQUIVADA],
      [E.PUBLICADA]: [E.AGUARDANDO_UPLOAD_HD, E.ARQUIVADA],
      [E.AGUARDANDO_UPLOAD_HD]: [E.CONCLUIDA, E.ARQUIVADA],
      [E.CONCLUIDA]: [E.ELEGIVEL_PARA_PAGAMENTO, E.ARQUIVADA],
      [E.ELEGIVEL_PARA_PAGAMENTO]: [E.ARQUIVADA],
      [E.ARQUIVADA]: []
    });
  }

  validateStateTransition(nextState) {
    const conhecidos = Object.values(ESTADOS_ATIVACAO);
    const atual = this.estadoAtual;

    if (!conhecidos.includes(nextState)) {
      throw new Error(`Estado de destino inválido: "${nextState}" não pertence a ESTADOS_ATIVACAO.`);
    }

    if (!conhecidos.includes(atual)) {
      throw new Error(`Ativação ${this.id} está em um estado desconhecido: "${atual}".`);
    }

    if (atual === nextState) {
      throw new Error(`Ativação ${this.id} já está no estado "${atual}".`);
    }

    const permitidas = Ativacao.TRANSICOES_PERMITIDAS[atual];

    if (!permitidas.includes(nextState)) {
      const alternativas = permitidas.length
        ? permitidas.join('", "')
        : 'nenhuma, é um estado terminal';

      throw new Error(
        `Transição proibida na ativação ${this.id}: "${atual}" → "${nextState}". ` +
        `A partir de "${atual}" só é permitido ir para: "${alternativas}".`
      );
    }

    return true;
  }
}

/* ═══════════════════════════════════════════════════════════════
   dominio/Logistica.js
   ═══════════════════════════════════════════════════════════════ */

/**
 * Entidade de envio logístico. Só invariantes de transição de status — nenhum
 * I/O, como `Ativacao`. O grafo de transições é `static get` (não `const` de
 * topo): `const`/`class` não sofrem hoisting entre arquivos e a ordem de carga
 * do Apps Script não é garantida (CLAUDE.md §13); referenciar `ESTADOS_LOGISTICA`
 * só dentro do getter evita depender dessa ordem.
 */
class Logistica {
  constructor(dados) {
    if (!dados || typeof dados !== 'object') {
      throw new TypeError('Logistica exige um objeto de dados do envio.');
    }

    this.dados = dados;
  }

  get id() {
    return this.dados[CAMPOS_LOGISTICA.ID];
  }

  get statusAtual() {
    return this.dados[CAMPOS_LOGISTICA.STATUS];
  }

  static get TRANSICOES_PERMITIDAS() {
    const E = ESTADOS_LOGISTICA;

    return Object.freeze({
      [E.PENDENTE]: [E.AGUARDANDO_ENVIO, E.CANCELADO],
      [E.AGUARDANDO_ENVIO]: [E.ENVIADO, E.CANCELADO],
      [E.ENVIADO]: [E.ENTREGUE, E.CANCELADO],
      [E.ENTREGUE]: [],
      [E.CANCELADO]: []
    });
  }

  validateStateTransition(nextState) {
    const conhecidos = Object.values(ESTADOS_LOGISTICA);
    const atual = this.statusAtual;

    if (!conhecidos.includes(nextState)) {
      throw new Error(`Status de destino inválido: "${nextState}" não pertence a ESTADOS_LOGISTICA.`);
    }

    if (!conhecidos.includes(atual)) {
      throw new Error(`Logística ${this.id} está em um status desconhecido: "${atual}".`);
    }

    if (atual === nextState) {
      throw new Error(`Logística ${this.id} já está no status "${atual}".`);
    }

    const permitidas = Logistica.TRANSICOES_PERMITIDAS[atual];

    if (!permitidas.includes(nextState)) {
      const alternativas = permitidas.length
        ? permitidas.join('", "')
        : 'nenhum, é um status terminal';

      throw new Error(
        `Transição proibida na logística ${this.id}: "${atual}" → "${nextState}". ` +
        `A partir de "${atual}" só é permitido ir para: "${alternativas}".`
      );
    }

    return true;
  }
}

class Pagamento {
  constructor(dados) {
    if (!dados || typeof dados !== 'object') {
      throw new TypeError('Pagamento exige um objeto de dados do pagamento.');
    }

    this.dados = dados;
  }

  get id() {
    return this.dados[CAMPOS_PAGAMENTO.ID];
  }

  get ciclo() {
    return this.dados[CAMPOS_PAGAMENTO.CICLO];
  }

  get influenciadora() {
    return this.dados[CAMPOS_PAGAMENTO.INFLUENCIADORA];
  }

  get valor() {
    return this.dados[CAMPOS_PAGAMENTO.VALOR];
  }

  get status() {
    return this.dados[CAMPOS_PAGAMENTO.STATUS];
  }

  get pix() {
    return this.dados[CAMPOS_PAGAMENTO.PIX];
  }
}

/* ═══════════════════════════════════════════════════════════════
   dominio/Ciclo.js
   ═══════════════════════════════════════════════════════════════ */

/**
 * Entidade do Core Domain para o mês de competência (CICLO), com contrato de
 * dados próprio. Leitura pura, como `Pagamento` — só getters pelo vocabulário
 * do contrato `CAMPOS_CICLO`, sem I/O e sem regra de negócio (o contrato de
 * CICLO não tem transições de estado). `CAMPOS_CICLO`
 * (definido em `Repositories.js`) é referenciado só dentro dos getters: `const`
 * não sofre hoisting entre arquivos e a ordem de carga do Apps Script não é
 * garantida (CLAUDE.md §13).
 */
class Ciclo {
  constructor(dados) {
    if (!dados || typeof dados !== 'object') {
      throw new TypeError('Ciclo exige um objeto de dados do ciclo.');
    }

    this.dados = dados;
  }

  get id() {
    return this.dados[CAMPOS_CICLO.ID];
  }

  get nome() {
    return this.dados[CAMPOS_CICLO.NOME];
  }

  get inicioLogistica() {
    return this.dados[CAMPOS_CICLO.INICIO_LOGISTICA];
  }

  get fimOperacao() {
    return this.dados[CAMPOS_CICLO.FIM_OPERACAO];
  }
}

/* ═══════════════════════════════════════════════════════════════
   dominio/PlanoColaboracao.js
   ═══════════════════════════════════════════════════════════════ */

/**
 * Entidade do Core Domain para o plano de colaboração por parceira/ciclo
 * (junção BASE × CICLO). Representa exclusivamente o contrato `Planos_Colaboracao`
 * (`CAMPOS_PLANO`). Leitura pura, como `Ciclo`/`Pagamento` — só getters pelo
 * vocabulário do contrato, sem I/O e sem regra de negócio.
 *
 * `qtdEntregaveis` e `valorCache` são devolvidos CRUS: a entidade não interpreta
 * quantidade nem faz qualquer cálculo/normalização financeira — parse e valores
 * derivados pertencem à compilação da Geração do Mês, não ao modelo.
 *
 * `CAMPOS_PLANO` (definido em `Repositories.js`) é referenciado só dentro dos
 * getters: `const` não sofre hoisting entre arquivos e a ordem de carga do
 * Apps Script não é garantida (CLAUDE.md §13).
 */
class PlanoColaboracao {
  constructor(dados) {
    if (!dados || typeof dados !== 'object') {
      throw new TypeError('PlanoColaboracao exige um objeto de dados do plano.');
    }

    this.dados = dados;
  }

  get id() {
    return this.dados[CAMPOS_PLANO.ID];
  }

  get influenciadora() {
    return this.dados[CAMPOS_PLANO.INFLUENCIADORA];
  }

  get ciclo() {
    return this.dados[CAMPOS_PLANO.CICLO];
  }

  get qtdEntregaveis() {
    return this.dados[CAMPOS_PLANO.QTD_ENTREGAVEIS];
  }

  get valorCache() {
    return this.dados[CAMPOS_PLANO.VALOR_CACHE];
  }
}

/* ═══════════════════════════════════════════════════════════════
   dominio/Briefing.js
   ═══════════════════════════════════════════════════════════════ */

/**
 * Vocabulário do contrato BRIEFING (arquivo
 * `[ELÃ] PROJETO TEAR 1.0 - BRIEFING.csv`), com 18 campos na ordem do CSV.
 *
 * Excepcionalmente definido aqui (como `CAMPOS_BASE`) porque o escopo de F1.1
 * é fundação de Model, sem criação de Repository. Em GAS, o escopo é global e
 * o futuro `BriefingRepository` enxerga esta const normalmente.
 */
const CAMPOS_BRIEFING = Object.freeze({
  INFLUENCIADORA: 'INFLUENCIADORA',
  RESUMO_DO_MES: 'RESUMO DO MÊS',
  LOOK_REEL: 'LOOK REEL',
  LOOK_CARROSSEL: 'LOOK CARROSSEL',
  LOOK_STORIES_1: 'LOOK STORIES 1',
  LOOK_STORIES_2: 'LOOK STORIES 2',
  DATA_REEL: 'DATA REEL',
  DATA_CARROSSEL: 'DATA CARROSSEL',
  DATA_STORIES_1: 'DATA STORIES 1',
  DATA_STORIES_2: 'DATA STORIES 2',
  SOBRE_REEL: 'SOBRE REEL',
  SOBRE_CARROSSEL: 'SOBRE CARROSSEL',
  SOBRE_STORIES_1: 'SOBRE STORIES 1',
  SOBRE_STORIES_2: 'SOBRE STORIES 2',
  APROVACAO_REEL: 'APROVACAO REEL',
  APROVACAO_CARROSSEL: 'APROVACAO CARROSSEL',
  APROVACAO_STORIES_1: 'APROVACAO STORIES 1',
  APROVACAO_STORIES_2: 'APROVACAO STORIES 2'
});

/**
 * Entidade do Core Domain para BRIEFING. Representa integralmente o contrato
 * `CAMPOS_BRIEFING` (18 campos), sem interpretação de conteúdo e sem I/O.
 * Leitura pura via getters; valores devolvidos crus.
 */
class Briefing {
  constructor(dados) {
    if (!dados || typeof dados !== 'object') {
      throw new TypeError('Briefing exige um objeto de dados do briefing.');
    }

    this.dados = dados;
  }

  get influenciadora() {
    return this.dados[CAMPOS_BRIEFING.INFLUENCIADORA];
  }

  get resumoDoMes() {
    return this.dados[CAMPOS_BRIEFING.RESUMO_DO_MES];
  }

  get lookReel() {
    return this.dados[CAMPOS_BRIEFING.LOOK_REEL];
  }

  get lookCarrossel() {
    return this.dados[CAMPOS_BRIEFING.LOOK_CARROSSEL];
  }

  get lookStories1() {
    return this.dados[CAMPOS_BRIEFING.LOOK_STORIES_1];
  }

  get lookStories2() {
    return this.dados[CAMPOS_BRIEFING.LOOK_STORIES_2];
  }

  get dataReel() {
    return this.dados[CAMPOS_BRIEFING.DATA_REEL];
  }

  get dataCarrossel() {
    return this.dados[CAMPOS_BRIEFING.DATA_CARROSSEL];
  }

  get dataStories1() {
    return this.dados[CAMPOS_BRIEFING.DATA_STORIES_1];
  }

  get dataStories2() {
    return this.dados[CAMPOS_BRIEFING.DATA_STORIES_2];
  }

  get sobreReel() {
    return this.dados[CAMPOS_BRIEFING.SOBRE_REEL];
  }

  get sobreCarrossel() {
    return this.dados[CAMPOS_BRIEFING.SOBRE_CARROSSEL];
  }

  get sobreStories1() {
    return this.dados[CAMPOS_BRIEFING.SOBRE_STORIES_1];
  }

  get sobreStories2() {
    return this.dados[CAMPOS_BRIEFING.SOBRE_STORIES_2];
  }

  get aprovacaoReel() {
    return this.dados[CAMPOS_BRIEFING.APROVACAO_REEL];
  }

  get aprovacaoCarrossel() {
    return this.dados[CAMPOS_BRIEFING.APROVACAO_CARROSSEL];
  }

  get aprovacaoStories1() {
    return this.dados[CAMPOS_BRIEFING.APROVACAO_STORIES_1];
  }

  get aprovacaoStories2() {
    return this.dados[CAMPOS_BRIEFING.APROVACAO_STORIES_2];
  }
}

/* ═══════════════════════════════════════════════════════════════
   dominio/Base.js
   ═══════════════════════════════════════════════════════════════ */

/**
 * Vocabulário do contrato BASE (arquivo `[ELÃ] PROJETO TEAR 1.0 - BASE.csv`),
 * 14 campos na ordem do CSV. Excepcionalmente definido aqui — e não em
 * `Repositories.js` como os demais `CAMPOS_*` — porque o escopo de F0.1.3.A só
 * permite tocar `Modelos.js` e não cria Repository; em GAS o escopo é global,
 * então o futuro `BaseRepository` enxerga esta const normalmente.
 *
 * O CSV traz `LOOKS` duas vezes (posições 10 e 14). Como `dados` é um
 * dicionário, as duas ocorrências recebem chaves distintas e rastreáveis ao
 * rótulo original — `'LOOKS (quantidade)'` e `'LOOKS (URL)'`. A desambiguação
 * FÍSICA (qual coluna do CSV alimenta cada chave) é diferida ao BaseRepository.
 */
const CAMPOS_BASE = Object.freeze({
  INFLUENCER: 'INFLUENCER',
  CUPOM: 'CUPOM',
  STATUS: 'STATUS',
  RAZAO_SOCIAL: 'RAZÃO SOCIAL',
  PIX: 'PIX',
  REEL: 'REEL',
  CARROSSEL: 'CARROSSEL',
  STORIES: 'STORIES',
  FEE: 'FEE',
  LOOKS_QUANTIDADE: 'LOOKS (quantidade)',
  ENDERECO: 'ENDEREÇO',
  SENHA: 'SENHA',
  DRIVE: 'DRIVE',
  LOOKS_URL: 'LOOKS (URL)'
});

/**
 * Entidade do Core Domain para a BASE (cadastro-mestre da parceira). Representa
 * INTEGRALMENTE o contrato `CAMPOS_BASE` (14 campos), sem remover campos por
 * interpretação de domínio e sem separar os campos de plano — essa separação é
 * migração futura, não escopo deste modelo. Leitura pura, como
 * `Ciclo`/`Pagamento`: só getters pelo vocabulário do contrato, sem I/O e sem
 * regra de negócio; valores devolvidos CRUS (sem parse/cálculo).
 *
 * `CAMPOS_BASE` é referenciado só dentro dos getters (idioma da base: `const`
 * não sofre hoisting entre arquivos e a ordem de carga do Apps Script não é
 * garantida — CLAUDE.md §13).
 */
class Base {
  constructor(dados) {
    if (!dados || typeof dados !== 'object') {
      throw new TypeError('Base exige um objeto de dados da base.');
    }

    this.dados = dados;
  }

  get influencer() {
    return this.dados[CAMPOS_BASE.INFLUENCER];
  }

  get cupom() {
    return this.dados[CAMPOS_BASE.CUPOM];
  }

  get status() {
    return this.dados[CAMPOS_BASE.STATUS];
  }

  get razaoSocial() {
    return this.dados[CAMPOS_BASE.RAZAO_SOCIAL];
  }

  get pix() {
    return this.dados[CAMPOS_BASE.PIX];
  }

  get reel() {
    return this.dados[CAMPOS_BASE.REEL];
  }

  get carrossel() {
    return this.dados[CAMPOS_BASE.CARROSSEL];
  }

  get stories() {
    return this.dados[CAMPOS_BASE.STORIES];
  }

  get fee() {
    return this.dados[CAMPOS_BASE.FEE];
  }

  get looksQuantidade() {
    return this.dados[CAMPOS_BASE.LOOKS_QUANTIDADE];
  }

  get endereco() {
    return this.dados[CAMPOS_BASE.ENDERECO];
  }

  get senha() {
    return this.dados[CAMPOS_BASE.SENHA];
  }

  get drive() {
    return this.dados[CAMPOS_BASE.DRIVE];
  }

  get looksUrl() {
    return this.dados[CAMPOS_BASE.LOOKS_URL];
  }
}

