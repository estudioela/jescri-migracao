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

/** `Date` vira ISO 8601; qualquer outro valor cai em `textoDeCelula`. */
function dataIsoDeCelula(valor) {
  if (valor instanceof Date) {
    return valor.toISOString();
  }

  return textoDeCelula(valor);
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

