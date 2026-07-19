/**
 * MÓDULO: Parceira — cadastro da parceira (SPEC-001/002), importação da base legada (SPEC-003) e CEP (ADR-011)
 *
 * Fatia vertical (ADR-014): camadas como seções, na ordem
 * DOMAIN → ACL → REPOSITORY → SERVICE → CONTROLLER → ADAPTERS.
 * Os contratos de camada valem integralmente (docs/ARQUITETURA_CAMADAS.md).
 */

// ============================================================================
// DOMAIN — Parceira.js (ex-src/domain/Parceira.js)
// ============================================================================

/**
 * ENTIDADE: Parceira (agregado raiz)
 *
 * Primeira entidade de domínio do TEAR V2. Representa uma parceira do programa
 * de colaboração.
 *
 * Invariantes preservadas:
 * - RN-01 (SPEC-001 §4 / SPEC-002 §9): nasce Inativa; ativação é sempre manual.
 * - INV-01 (SPEC-002 §11): sempre um e apenas um estado de vínculo.
 * - INV-02: inativar preserva a identidade e os dados cadastrais.
 *
 * Estados canônicos fechados (ADR-001 §2.1): 'Ativa' | 'Inativa'.
 * A coerção cru↔canônico (ON/OFF) pertence à ACL, nunca a esta entidade.
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL.
 */

this.Parceira = class Parceira {
  constructor(nome) {
    const nomeTexto = String(nome == null ? '' : nome).trim();
    if (nomeTexto === '') {
      throw new Error('Parceira exige nome (identidade INFLU_KEY).');
    }
    this.nome = nome;
    // RN-01: toda Parceira nasce Inativa; nunca ativada automaticamente.
    this.estado = 'Inativa';
  }

  ativar() {
    this.estado = 'Ativa';
    return this;
  }

  inativar() {
    this.estado = 'Inativa';
    return this;
  }

  estaAtiva() {
    return this.estado === 'Ativa';
  }
};

// ============================================================================
// DOMAIN — ChaveInfluenciadora.js (ex-src/domain/ChaveInfluenciadora.js)
// ============================================================================

/**
 * VALUE OBJECT: ChaveInfluenciadora (SPEC-003 §6.1, D-02c)
 *
 * Grafia canônica única da identidade da Parceira (`INFLU_KEY`) usada pela
 * Importação Inicial da Base para normalizar chaves divergentes do legado
 * (CB-03) antes de curar/deduplicar (RN-02).
 *
 * Normalização: trim + colapso de espaços internos. A comparação de
 * identidade (`normalizada()`) é case-insensitive — resolve duplicidade por
 * grafia divergente (ex.: 'maria', 'MARIA', 'Maria ' → mesma Parceira) — mas
 * o valor persistido preserva a grafia original trimada (primeira ocorrência
 * vence, decisão do Service).
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL.
 */

this.ChaveInfluenciadora = class ChaveInfluenciadora {
  /**
   * @param {string} bruta valor lido de INFLU_KEY na base legada.
   */
  constructor(bruta) {
    const texto = String(bruta == null ? '' : bruta).trim().replace(/\s+/g, ' ');
    if (texto === '') {
      throw new Error('IM-02: chave ausente ou ambígua — registro sem INFLU_KEY (§17).');
    }
    this.valor = texto;
  }

  /**
   * @returns {string} forma normalizada (case-insensitive) para deduplicação.
   */
  normalizada() {
    return this.valor.toLowerCase();
  }

  /**
   * @returns {string} grafia canônica a persistir.
   */
  toString() {
    return this.valor;
  }
};

// ============================================================================
// DOMAIN — Endereco.js (ex-src/domain/Endereco.js)
// ============================================================================

/**
 * VALUE OBJECT: Endereco (SPEC-032 §6.1)
 *
 * Endereço de perfil da Parceira — PII (Contrato §5). Estruturado (CEP +
 * partes), diferente de EnderecoDeEntrega (SPEC-016), que é um texto opaco
 * de uso único e mascarado (INV-04 daquela VO). Aqui o destino é a própria
 * tela da Parceira (UC-032.01) — por isso NÃO mascara toString/toJSON.
 *
 * RN-01: rua/bairro/cidade/uf são recompostos a partir do CEP pelo Service
 * (via porta adaptadorDeCep); esta VO só representa o resultado, nunca
 * resolve o CEP sozinha.
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL, Logger.
 */

this.Endereco = class Endereco {
  /**
   * @param {{cep: string, numero: string, complemento: string, rua: string,
   *   bairro: string, cidade: string, uf: string}} dados
   */
  constructor(dados) {
    const seguro = dados || {};
    const cep = String(seguro.cep == null ? '' : seguro.cep).trim();
    if (cep === '') {
      throw new Error('Endereco exige CEP.');
    }
    this.cep = cep;
    this.numero = String(seguro.numero == null ? '' : seguro.numero).trim();
    this.complemento = String(seguro.complemento == null ? '' : seguro.complemento).trim();
    this.rua = String(seguro.rua == null ? '' : seguro.rua).trim();
    this.bairro = String(seguro.bairro == null ? '' : seguro.bairro).trim();
    this.cidade = String(seguro.cidade == null ? '' : seguro.cidade).trim();
    this.uf = String(seguro.uf == null ? '' : seguro.uf).trim();
    Object.freeze(this);
  }

  /**
   * CB-01: falha do serviço de CEP pode deixar o endereço incompleto —
   * dados principais (CEP/número/complemento) continuam salvos (RN-02).
   * @returns {boolean} true só se rua/bairro/cidade/uf estiverem todos preenchidos.
   */
  completo() {
    return this.rua !== '' && this.bairro !== '' && this.cidade !== '' && this.uf !== '';
  }
};

// ============================================================================
// DOMAIN — PIX.js (ex-src/domain/PIX.js)
// ============================================================================

/**
 * VALUE OBJECT: PIX (SPEC-032 §6.1)
 *
 * Chave PIX da Parceira — PII (Contrato §5). Diferente de EnderecoDeEntrega
 * (SPEC-016, INV-04): ali o valor nunca sai do caso de uso interno; aqui o
 * destino é a própria tela da Parceira (UC-032.01 "Ver perfil") — por isso
 * NÃO mascara toString/toJSON. "PII nunca em log" (INV-02) é responsabilidade
 * de quem loga (publicadorDeLog só registra nome do evento), não desta VO.
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL, Logger.
 */

this.PIX = class PIX {
  /**
   * @param {string} chave chave PIX (PII).
   */
  constructor(chave) {
    const texto = String(chave == null ? '' : chave).trim();
    if (texto === '') {
      throw new Error('PIX exige uma chave não vazia.');
    }
    this.valor = texto;
    Object.freeze(this);
  }

  /**
   * Igualdade de VO pelo valor.
   * @param {PIX} outro
   * @returns {boolean}
   */
  igualA(outro) {
    return outro instanceof PIX && this.valor === outro.valor;
  }
};

// ============================================================================
// DOMAIN — CondicaoComercialSnapshot.js (ex-src/domain/CondicaoComercialSnapshot.js)
// ============================================================================

/**
 * VALUE OBJECT: CondicaoComercialSnapshot (SPEC-005 §6.1)
 *
 * Fotografia imutável das Condições Comerciais no instante da compilação:
 * `valorMensal`, `formatosContratados`, `quantidadePorFormato`.
 *
 * Invariantes preservadas:
 * - RN-04: reflete exatamente as condições vigentes no instante da compilação
 *   (cópia defensiva — mutações na origem não retroagem, RN-06).
 * - RN-05 / INV-04 / CB-05: imutável após criação — nasce Congelado, sem
 *   transições (§9); congelamento profundo de todas as estruturas.
 * - RN-10 (Contrato §5): PII (`PIX`, `CNPJ`, `Endereco`) NUNCA faz parte do
 *   Snapshot; presença de campo PII nas condições é recusada fail-fast.
 * - Construção inconsistente falha barulhento com código CM-04 (§17).
 *
 * Não pode conhecer: SpreadsheetApp, HTML, HTTP, Repository, ACL, coluna física.
 */

this.CondicaoComercialSnapshot = class CondicaoComercialSnapshot {
  /**
   * @param {{valorMensal: number,
   *          formatosContratados: string[],
   *          quantidadePorFormato: Object<string, number>}} condicoes
   *   condições comerciais vigentes no instante da compilação.
   * @throws {Error} CM-04 quando as condições são inconsistentes ou contêm PII.
   */
  constructor(condicoes) {
    if (condicoes == null || typeof condicoes !== 'object') {
      throw new Error('CM-04: Snapshot inconsistente — condições comerciais ausentes.');
    }

    const chavePII = Object.keys(condicoes).find((chave) =>
      /pix|cnpj|endereco/i.test(chave)
    );
    if (chavePII) {
      throw new Error(
        "CM-04: Snapshot inconsistente — campo PII '" +
          chavePII +
          "' é banido do Snapshot Comercial (RN-10, Contrato §5)."
      );
    }

    const valorMensal = condicoes.valorMensal;
    if (typeof valorMensal !== 'number' || !isFinite(valorMensal) || valorMensal < 0) {
      throw new Error(
        "CM-04: Snapshot inconsistente — valorMensal inválido: '" + valorMensal + "'."
      );
    }

    if (!Array.isArray(condicoes.formatosContratados)) {
      throw new Error(
        'CM-04: Snapshot inconsistente — formatosContratados deve ser uma lista.'
      );
    }

    const quantidadePorFormato = condicoes.quantidadePorFormato;
    if (
      quantidadePorFormato == null ||
      typeof quantidadePorFormato !== 'object' ||
      Array.isArray(quantidadePorFormato)
    ) {
      throw new Error(
        'CM-04: Snapshot inconsistente — quantidadePorFormato deve ser um objeto formato→quantidade.'
      );
    }

    this.valorMensal = valorMensal;
    this.formatosContratados = Object.freeze(condicoes.formatosContratados.slice());
    this.quantidadePorFormato = Object.freeze(
      Object.assign({}, quantidadePorFormato)
    );
    Object.freeze(this);
  }
};

// ============================================================================
// ACL — ParceiraACL.js (ex-src/acl/ParceiraACL.js)
// ============================================================================

/**
 * ACL: ParceiraACL — camada anticorrupção da Parceira.
 *
 * ACL única do sistema (invariante Freeze §4): único ponto que conhece a
 * coluna física da planilha e faz a coerção cru↔canônico com fail-fast
 * (ADR-001 §2/§2.1: valor desconhecido = erro barulhento identificando a
 * coluna e o valor).
 *
 * Acessa a planilha SEMPRE por cabeçalho, nunca por índice fixo.
 * PII nunca é registrada em log/evento.
 *
 * Escrita: `inserir` faz append de linha nova; `atualizarPerfil` (SPEC-032)
 * grava célula a célula numa linha EXISTENTE — nunca reescreve a aba
 * inteira (ver docstring do método: 'BASE DE DADOS' tem colunas não
 * modeladas por este domínio, um upsert por matriz completa arriscaria
 * apagá-las).
 *
 * Não pode conter regra de negócio nem ser duplicada.
 *
 * @param {object} sheet Sheet do SpreadsheetApp (ou fake com a mesma API:
 *   getDataRange().getValues() e appendRow(array)).
 */

this.ParceiraACL = class ParceiraACL {
  constructor(sheet) {
    this.sheet = sheet;
  }

  /**
   * Coage o STATUS físico cru → canônico do domínio.
   * Normalização (ADR-001 §2): trim + casefold. Desconhecido → erro.
   * @param {string} cru valor lido da coluna STATUS.
   * @returns {'Ativa'|'Inativa'}
   */
  statusParaCanonico(cru) {
    const normalizado = String(cru == null ? '' : cru).trim().toLowerCase();
    if (normalizado === 'on') return 'Ativa';
    if (normalizado === 'off') return 'Inativa';
    throw new Error(
      "STATUS desconhecido em 'BASE DE DADOS'.STATUS: '" + cru + "'."
    );
  }

  /**
   * Coage o estado canônico → cru persistido na planilha (ADR-001 §2.1).
   * @param {'Ativa'|'Inativa'} canonico
   * @returns {'ON'|'OFF'}
   */
  statusParaCru(canonico) {
    if (canonico === 'Ativa') return 'ON';
    if (canonico === 'Inativa') return 'OFF';
    throw new Error("Estado de vínculo desconhecido: '" + canonico + "'.");
  }

  /**
   * Insere uma Parceira como nova linha, posicionando cada campo pela sua
   * coluna no cabeçalho (nunca por índice fixo).
   * Projeção do cadastro: INFLU_KEY (identidade) e STATUS (vínculo).
   * @param {{nome: string, estado: string}} parceira
   */
  inserir(parceira) {
    const cabecalho = this.sheet.getDataRange().getValues()[0];
    const fisico = {
      INFLU_KEY: parceira.nome,
      STATUS: this.statusParaCru(parceira.estado),
    };
    const linha = cabecalho.map((coluna) =>
      Object.prototype.hasOwnProperty.call(fisico, coluna) ? fisico[coluna] : ''
    );
    this.sheet.appendRow(linha);
  }

  /**
   * Porta do Cadastro para a compilação (SPEC-005 §14.1): Parceiras ativas
   * com a projeção curada das Condições Comerciais (Contrato §7.3).
   * PII (CHAVE_PIX, CNPJ, ENDERECO) NUNCA entra na projeção (RN-10).
   * @returns {{parceiraId: string, condicoes: {
   *   valorMensal: number,
   *   formatosContratados: string[],
   *   quantidadePorFormato: Object<string, number>}}[]}
   */
  listarAtivasComCondicoes() {
    const valores = this.sheet.getDataRange().getValues();
    const coluna = this.resolvedorDeColuna(valores[0]);
    return valores
      .slice(1)
      .filter((linha) => String(linha[coluna('INFLU_KEY')]).trim() !== '')
      .filter(
        (linha) => this.statusParaCanonico(linha[coluna('STATUS')]) === 'Ativa'
      )
      .map((linha) => ({
        parceiraId: String(linha[coluna('INFLU_KEY')]).trim(),
        condicoes: this.condicoesDaLinha(linha, coluna),
      }));
  }

  /**
   * Porta de contato de envio para a Logística (SPEC-016 UC-016.01, D-03):
   * projeção mínima com endereço e chave PIX da Parceira, para a mensagem
   * de confirmação de envio manual. Não expõe a linha completa nem
   * qualquer outro dado da BASE DE DADOS; ParceiraACL segue sendo o único
   * ponto que toca esta aba (Freeze §4).
   * @param {string} parceiraId INFLU_KEY da Parceira.
   * @returns {{endereco: string, pix: string}|null} null se a Parceira não existir.
   */
  obterContatoDeEnvio(parceiraId) {
    const valores = this.sheet.getDataRange().getValues();
    const coluna = this.resolvedorDeColuna(valores[0]);
    const colInfluKey = coluna('INFLU_KEY');
    const colEndereco = coluna('INFLUENCIADORA_ENDERECO');
    const colPix = coluna('CHAVE_PIX');
    const linha = valores
      .slice(1)
      .find((l) => String(l[colInfluKey]).trim() === String(parceiraId).trim());
    if (!linha) {
      return null;
    }
    return {
      endereco: String(linha[colEndereco] == null ? '' : linha[colEndereco]).trim(),
      pix: String(linha[colPix] == null ? '' : linha[colPix]).trim(),
    };
  }

  /**
   * Porta do Cadastro para a Geração de Documentos (SPEC-023 §14.1):
   * projeção da linha da Parceira com o estado do vínculo, a sinalização
   * e os campos de mesclagem (§6.1). Segue o padrão de obterContatoDeEnvio
   * (SPEC-016 D-03): ParceiraACL permanece o ÚNICO ponto que toca a
   * BASE DE DADOS (Freeze §4). Os campos contêm PII (CNPJ, endereço)
   * porque o destino é o documento do destinatário (RNF-01) — nunca
   * registrá-los em log/evento.
   * @param {string} parceiraId INFLU_KEY da Parceira.
   * @returns {{estado: ('Ativa'|'Inativa'), sinalizada: boolean,
   *   campos: {razaoSocial: string, cnpj: string, endereco: string,
   *     quantidades: Object<string, string>, valorNumero: (number|null),
   *     valorExtenso: string, canaisUsoImagem: string,
   *     prazoUsoImagem: string, cidadeAssinatura: string,
   *     dataAssinatura: string}}|null} null se a Parceira não existir.
   */
  obterParaDocumentos(parceiraId) {
    const valores = this.sheet.getDataRange().getValues();
    const coluna = this.resolvedorDeColuna(valores[0]);
    const linha = valores
      .slice(1)
      .find((l) => String(l[coluna('INFLU_KEY')]).trim() === String(parceiraId).trim());
    if (!linha) {
      return null;
    }
    const texto = (nome) =>
      String(linha[coluna(nome)] == null ? '' : linha[coluna(nome)]).trim();
    const rotulos = {
      Reels: 'REELS_TEXTO',
      Carrossel: 'CARROSSEL_TEXTO',
      Stories: 'STORIES_TEXTO',
      Looks: 'LOOKS_QTD_TEXTO',
    };
    const quantidades = {};
    Object.keys(rotulos).forEach((formato) => {
      const valor = texto(rotulos[formato]);
      if (valor !== '') {
        quantidades[formato] = valor;
      }
    });
    return {
      estado: this.statusParaCanonico(linha[coluna('STATUS')]),
      sinalizada: this.sinalizacaoParaCanonico(linha[coluna('SIM/NÃO')]),
      campos: {
        razaoSocial: texto('INFLUENCIADORA_RAZAO_SOCIAL'),
        cnpj: texto('INFLUENCIADORA_CNPJ'),
        endereco: texto('INFLUENCIADORA_ENDERECO'),
        quantidades: quantidades,
        valorNumero:
          texto('VALOR_TOTAL') === ''
            ? null
            : this.valorMensalDe(linha[coluna('VALOR_TOTAL')]),
        valorExtenso: texto('VALOR_TOTAL_EXTENSO'),
        canaisUsoImagem: texto('CANAIS_USO_IMAGEM'),
        prazoUsoImagem: texto('PRAZO_USO_IMAGEM'),
        cidadeAssinatura: texto('CIDADE_ASSINATURA'),
        dataAssinatura: texto('DATA_ASSINATURA'),
      },
    };
  }

  /**
   * Porta do Cadastro para o Acesso ao Portal (SPEC-025 §14.1): projeção
   * mínima para o adaptador legado de credencial (RN-16 — cupom + prefixo
   * do CNPJ; provisório, 🟠 P5/Q-07). Localiza a Parceira pelo CUPOM
   * (normalização ADR-001 §2: trim + casefold) e devolve identidade + CNPJ.
   * O CNPJ é PII: destino exclusivo é a comparação de credencial no
   * adaptador — NUNCA em log/evento (Contrato §5; SPEC-025 RN-04).
   * ParceiraACL segue o ÚNICO ponto que toca a BASE DE DADOS (Freeze §4).
   * @param {string} identificador cupom apresentado na credencial.
   * @returns {{parceiraId: string, cnpj: string}|null} null se não existir.
   */
  obterAcessoLegado(identificador) {
    const valores = this.sheet.getDataRange().getValues();
    const coluna = this.resolvedorDeColuna(valores[0]);
    const alvo = String(identificador == null ? '' : identificador).trim().toLowerCase();
    if (alvo === '') {
      return null;
    }
    const linha = valores
      .slice(1)
      .find(
        (l) => String(l[coluna('CUPOM')]).trim().toLowerCase() === alvo
      );
    if (!linha) {
      return null;
    }
    return {
      parceiraId: String(linha[coluna('INFLU_KEY')]).trim(),
      cnpj: String(linha[coluna('INFLUENCIADORA_CNPJ')] == null ? '' : linha[coluna('INFLUENCIADORA_CNPJ')]).trim(),
    };
  }

  /**
   * Coage a sinalização física crua ('SIM/NÃO') → canônico do domínio
   * (SPEC-023 RN-02). Normalização ADR-001 §2: trim + casefold; vazio é
   * "não sinalizada"; valor desconhecido → erro barulhento.
   * @param {string} cru valor lido da coluna SIM/NÃO.
   * @returns {boolean}
   */
  sinalizacaoParaCanonico(cru) {
    const normalizado = String(cru == null ? '' : cru).trim().toLowerCase();
    if (normalizado === 'sim') return true;
    if (normalizado === 'não' || normalizado === 'nao' || normalizado === '') return false;
    throw new Error(
      "Sinalização desconhecida em 'BASE DE DADOS'.SIM/NÃO: '" + cru + "'."
    );
  }

  /**
   * Porta do Perfil no Portal (SPEC-032 §6.2/§14.1): projeção mínima dos
   * campos editáveis pela própria Parceira. Nunca expõe o resto da linha
   * (razão social, CNPJ, condições comerciais — RN-04/INV-03).
   * @param {string} parceiraId INFLU_KEY da Parceira.
   * @returns {{email: string, pix: string, cep: string, numero: string,
   *   complemento: string, rua: string, bairro: string, cidade: string,
   *   uf: string}|null} null se a Parceira não existir.
   */
  obterPerfil(parceiraId) {
    const valores = this.sheet.getDataRange().getValues();
    const coluna = this.resolvedorDeColuna(valores[0]);
    const linha = valores
      .slice(1)
      .find((l) => String(l[coluna('INFLU_KEY')]).trim() === String(parceiraId).trim());
    if (!linha) {
      return null;
    }
    const texto = (nome) =>
      String(linha[coluna(nome)] == null ? '' : linha[coluna(nome)]).trim();
    return {
      email: texto('EMAIL'),
      pix: texto('CHAVE_PIX'),
      cep: texto('CEP'),
      numero: texto('NUMERO'),
      complemento: texto('COMPLEMENTO'),
      rua: texto('RUA'),
      bairro: texto('BAIRRO'),
      cidade: texto('CIDADE'),
      uf: texto('UF'),
    };
  }

  /**
   * Porta do Perfil no Portal (SPEC-032 §14.1): grava SÓ os campos de
   * perfil informados, célula a célula, na linha existente da Parceira.
   * DECISÃO LOCAL: 'BASE DE DADOS' é a fonte da verdade compartilhada com
   * outras SPECs (961 linhas, colunas não modeladas por este domínio —
   * VALOR_TOTAL, quantidades contratadas etc.) — por isso NUNCA reescreve a
   * aba inteira (padrão `reescrever` de ENTREGAS/BRIEFING não se aplica
   * aqui: reconstruir a matriz a partir de um modelo parcial apagaria
   * colunas que este domínio não conhece). Escreve apenas as colunas
   * presentes em `campos`, preservando cada célula não informada.
   * @param {string} parceiraId INFLU_KEY da Parceira.
   * @param {{email: (string|undefined), pix: (string|undefined),
   *   cep: (string|undefined), numero: (string|undefined),
   *   complemento: (string|undefined), rua: (string|undefined),
   *   bairro: (string|undefined), cidade: (string|undefined),
   *   uf: (string|undefined), enderecoCompleto: (string|undefined)}} campos
   * @throws {Error} Parceira inexistente.
   */
  atualizarPerfil(parceiraId, campos) {
    const valores = this.sheet.getDataRange().getValues();
    const cabecalho = valores[0];
    const coluna = this.resolvedorDeColuna(cabecalho);
    const indice = valores
      .slice(1)
      .findIndex((l) => String(l[coluna('INFLU_KEY')]).trim() === String(parceiraId).trim());
    if (indice === -1) {
      throw new Error("Parceira '" + parceiraId + "' não encontrada em 'BASE DE DADOS'.");
    }
    const linhaFisica = indice + 2; // +1 pelo cabeçalho, +1 por ser 1-based.
    const mapaDeColuna = {
      email: 'EMAIL',
      pix: 'CHAVE_PIX',
      cep: 'CEP',
      numero: 'NUMERO',
      complemento: 'COMPLEMENTO',
      rua: 'RUA',
      bairro: 'BAIRRO',
      cidade: 'CIDADE',
      uf: 'UF',
      enderecoCompleto: 'INFLUENCIADORA_ENDERECO',
    };
    Object.keys(mapaDeColuna).forEach((campo) => {
      if (Object.prototype.hasOwnProperty.call(campos, campo)) {
        this.sheet.getRange(linhaFisica, coluna(mapaDeColuna[campo]) + 1).setValue(campos[campo]);
      }
    });
  }

  /**
   * Porta da vinculação de identidade (SPEC-035 §5.1-A/§10.2.4): localiza
   * uma Parceira candidata por e-mail, para apresentação e confirmação
   * manual explícita — NUNCA associação automática (RN-02). Ignora
   * candidatas já vinculadas a outro SUB_PROVIDER (RN-01: unicidade da
   * identidade técnica).
   * @param {string} email e-mail informado pelo provedor de identidade.
   * @returns {{parceiraId: string}|null} null se não houver candidata.
   */
  buscarCandidataPorEmail(email) {
    const alvo = String(email == null ? '' : email).trim().toLowerCase();
    if (alvo === '') {
      return null;
    }
    const valores = this.sheet.getDataRange().getValues();
    const coluna = this.resolvedorDeColuna(valores[0]);
    const linha = valores.slice(1).find((l) => {
      const emailDaLinha = String(l[coluna('EMAIL')] == null ? '' : l[coluna('EMAIL')])
        .trim()
        .toLowerCase();
      const jaVinculada = String(l[coluna('SUB_PROVIDER')] == null ? '' : l[coluna('SUB_PROVIDER')]).trim() !== '';
      return emailDaLinha === alvo && !jaVinculada;
    });
    if (!linha) {
      return null;
    }
    return { parceiraId: String(linha[coluna('INFLU_KEY')]).trim() };
  }

  /**
   * Porta da vinculação de identidade (SPEC-035 §5.1-A/§10.2.4): grava o
   * `SUB_PROVIDER` na linha EXISTENTE da Parceira confirmada pela
   * utilizadora, célula a célula (mesmo padrão/cautela de
   * `atualizarPerfil` — nunca reescreve a aba inteira). `INFLU_KEY`
   * permanece a chave relacional soberana; `SUB_PROVIDER` não a substitui.
   * @param {string} parceiraId INFLU_KEY da Parceira confirmada.
   * @param {string} subProvider identificador federado do Google.
   * @throws {Error} Parceira inexistente.
   */
  vincularSubProvider(parceiraId, subProvider) {
    const valores = this.sheet.getDataRange().getValues();
    const cabecalho = valores[0];
    const coluna = this.resolvedorDeColuna(cabecalho);
    const indice = valores
      .slice(1)
      .findIndex((l) => String(l[coluna('INFLU_KEY')]).trim() === String(parceiraId).trim());
    if (indice === -1) {
      throw new Error("Parceira '" + parceiraId + "' não encontrada em 'BASE DE DADOS'.");
    }
    const linhaFisica = indice + 2; // +1 pelo cabeçalho, +1 por ser 1-based.
    this.sheet.getRange(linhaFisica, coluna('SUB_PROVIDER') + 1).setValue(subProvider);
  }

  /**
   * Porta do login (SPEC-035 §11.2): resolve a `INFLU_KEY` soberana a
   * partir do `SUB_PROVIDER` já vinculado — usada por `UsuarioService`
   * para emitir a Sessão (SPEC-025) com o identificador correto.
   * @param {string} subProvider
   * @returns {{parceiraId: string}|null} null se não houver vínculo.
   */
  obterPorSubProvider(subProvider) {
    const alvo = String(subProvider == null ? '' : subProvider).trim();
    if (alvo === '') {
      return null;
    }
    const valores = this.sheet.getDataRange().getValues();
    const coluna = this.resolvedorDeColuna(valores[0]);
    const linha = valores
      .slice(1)
      .find((l) => String(l[coluna('SUB_PROVIDER')] == null ? '' : l[coluna('SUB_PROVIDER')]).trim() === alvo);
    if (!linha) {
      return null;
    }
    return { parceiraId: String(linha[coluna('INFLU_KEY')]).trim() };
  }

  /**
   * Porta de escrita da Importação Inicial da Base (SPEC-003 §6.3): grava
   * em lote (um único `setValues`, sem tocar as linhas já existentes —
   * mesma cautela de `atualizarPerfil`, a aba tem colunas não modeladas por
   * este domínio) as Parceiras curadas pelo `ImportadorService`. Cada
   * `registro.camposFisicos` pode trazer QUALQUER coluna reconhecida pelo
   * cabeçalho (RN-05: campos ausentes ficam vazios) — INFLU_KEY/STATUS
   * sempre vêm de `registro.parceiraId`/`registro.estado` (coeridos aqui,
   * nunca do valor cru do legado, RN-02).
   * @param {{parceiraId: string, estado: ('Ativa'|'Inativa'),
   *   camposFisicos: Object<string, *>}[]} registros
   */
  importarLote(registros) {
    if (!registros || registros.length === 0) {
      return;
    }
    const valores = this.sheet.getDataRange().getValues();
    const cabecalho = valores[0];
    const linhaInicial = valores.length + 1;
    const linhas = registros.map((registro) => {
      const fisico = Object.assign({}, registro.camposFisicos, {
        INFLU_KEY: registro.parceiraId,
        STATUS: this.statusParaCru(registro.estado),
      });
      return cabecalho.map((nome) =>
        Object.prototype.hasOwnProperty.call(fisico, nome) ? fisico[nome] : ''
      );
    });
    this.sheet.getRange(linhaInicial, 1, linhas.length, cabecalho.length).setValues(linhas);
  }

  /**
   * Porta de idempotência da Importação Inicial da Base (SPEC-003
   * RNF-03/CB-02): chaves já existentes na base nova, para o
   * `ImportadorService` nunca duplicar/sobrescrever uma Parceira.
   * @returns {string[]} INFLU_KEY de cada linha existente, trimados.
   */
  listarChaves() {
    const valores = this.sheet.getDataRange().getValues();
    const coluna = this.resolvedorDeColuna(valores[0]);
    return valores
      .slice(1)
      .map((linha) => String(linha[coluna('INFLU_KEY')]).trim())
      .filter((chave) => chave !== '');
  }

  /**
   * @param {Array} cabecalho
   * @returns {function(string): number} resolve nome → índice, fail-fast.
   */
  resolvedorDeColuna(cabecalho) {
    return criarResolvedorDeColuna(cabecalho, 'BASE DE DADOS');
  }

  /**
   * Coage a linha física → condições comerciais canônicas.
   * Formatos canônicos fechados: Reels, Carrossel, Stories, Looks
   * (Contrato §7.3: entregáveis da BASE DE DADOS).
   * @param {Array} linha linha crua da aba.
   * @param {function(string): number} coluna resolve nome → índice.
   * @returns {{valorMensal: number, formatosContratados: string[],
   *   quantidadePorFormato: Object<string, number>}}
   */
  condicoesDaLinha(linha, coluna) {
    const entregaveis = {
      Reels: 'REELS_TEXTO',
      Carrossel: 'CARROSSEL_TEXTO',
      Stories: 'STORIES_TEXTO',
      Looks: 'LOOKS_QTD',
    };
    const quantidadePorFormato = {};
    Object.keys(entregaveis).forEach((formato) => {
      const quantidade = this.quantidadeContratada(
        linha[coluna(entregaveis[formato])],
        entregaveis[formato]
      );
      if (quantidade > 0) {
        quantidadePorFormato[formato] = quantidade;
      }
    });
    return {
      valorMensal: this.valorMensalDe(linha[coluna('VALOR_TOTAL')]),
      formatosContratados: Object.keys(quantidadePorFormato),
      quantidadePorFormato: quantidadePorFormato,
    };
  }

  /**
   * Coage VALOR_TOTAL cru → número. Desconhecido → erro barulhento.
   * @param {*} cru
   * @returns {number}
   */
  valorMensalDe(cru) {
    const texto = String(cru == null ? '' : cru).trim();
    const valor = Number(texto);
    if (texto === '' || isNaN(valor)) {
      throw new Error(
        "VALOR_TOTAL inválido em 'BASE DE DADOS'.VALOR_TOTAL: '" + cru + "'."
      );
    }
    return valor;
  }

  /**
   * Coage o texto de um entregável → quantidade contratada.
   * Vazio → 0 (não contratado); prefixo numérico ('2 reels') → 2;
   * texto sem número à frente → erro barulhento (ADR-001 §2).
   * @param {*} cru valor lido da coluna do entregável.
   * @param {string} colunaFisica nome da coluna, para o erro.
   * @returns {number}
   */
  quantidadeContratada(cru, colunaFisica) {
    const texto = String(cru == null ? '' : cru).trim();
    if (texto === '') {
      return 0;
    }
    const prefixo = texto.match(/^(\d+)/);
    if (!prefixo) {
      throw new Error(
        colunaFisica + " inválido em 'BASE DE DADOS'." + colunaFisica + ": '" + cru + "'."
      );
    }
    return parseInt(prefixo[1], 10);
  }
};

// ============================================================================
// ACL — LegadoACL.js (ex-src/acl/LegadoACL.js)
// ============================================================================

/**
 * ACL: LegadoACL — leitura da base legada (SPEC-003; aba física
 * `BASE DE DADOS` da planilha legada, `PLANILHA_TEAR_2.0_MAPA.md` §3).
 *
 * SOMENTE LEITURA (RN-01/INV-01): esta classe não tem nenhum método de
 * escrita — estruturalmente impossível gravar na base legada por aqui.
 *
 * DECISÃO LOCAL: o esquema físico da aba `BASE DE DADOS` legada já é
 * idêntico ao da `BASE DE DADOS` nova (mesmos nomes de coluna — confirmado
 * em `PLANILHA_TEAR_2.0_MAPA.md` §3 e no docstring de `ParceiraACL.
 * atualizarPerfil`, que cita as mesmas 961 linhas). Por isso esta ACL não
 * faz nenhuma tradução de coluna: devolve cada linha como um objeto cru
 * `{NOME_DA_COLUNA: valor}`, exatamente como lida — a curadoria (RN-02/
 * RN-05, quais campos são válidos) é regra de negócio e pertence ao
 * Service (`ImportadorService`), nunca à ACL.
 *
 * Não pode conter regra de negócio nem ser duplicada.
 *
 * @param {object} sheet Sheet do SpreadsheetApp (ou fake com a mesma API:
 *   getDataRange().getValues()).
 */

this.LegadoACL = class LegadoACL {
  constructor(sheet) {
    this.sheet = sheet;
  }

  /**
   * Lê a aba legada inteira e devolve um objeto cru por linha, ignorando
   * linhas totalmente vazias. Nenhuma validação/curadoria acontece aqui.
   * @returns {Object<string, *>[]}
   */
  listarRegistros() {
    const valores = this.sheet.getDataRange().getValues();
    const cabecalho = valores[0];
    return valores
      .slice(1)
      .filter((linha) => linha.some((celula) => String(celula == null ? '' : celula).trim() !== ''))
      .map((linha) => {
        const registro = {};
        cabecalho.forEach((nome, indice) => {
          registro[nome] = linha[indice];
        });
        return registro;
      });
  }
};

// ============================================================================
// REPOSITORY — ParceiraRepository.js (ex-src/repository/ParceiraRepository.js)
// ============================================================================

/**
 * REPOSITORY: ParceiraRepository — persistência da Parceira.
 *
 * Único ponto (junto da ACL) que trata persistência. Define a projeção
 * explícita de campos e acessa a planilha SEMPRE por cabeçalho e SEMPRE via
 * ACL — nunca toca SpreadsheetApp diretamente nem lê por índice físico.
 *
 * Não pode conter regra de negócio nem formatar envelope.
 *
 * @param {ParceiraACL} acl ACL única da Parceira.
 */

this.ParceiraRepository = class ParceiraRepository {
  constructor(acl) {
    this.acl = acl;
  }

  /**
   * Persiste uma Parceira recém-cadastrada.
   * @param {Parceira} parceira
   * @returns {Parceira} a mesma Parceira persistida.
   */
  salvar(parceira) {
    this.acl.inserir(parceira);
    return parceira;
  }
};

// ============================================================================
// SERVICE — CadastrarParceiraService.js (ex-src/service/CadastrarParceiraService.js)
// ============================================================================

/**
 * SERVICE: CadastrarParceiraService — caso de uso de cadastro (SPEC-001 RF-001).
 *
 * Orquestra o cadastro: cria a Parceira no domínio e a persiste via
 * repositório. Coordena Domínio + Repository.
 *
 * RN-01 (SPEC-001 §4/§11): o cadastro cria a Parceira sempre Inativa; nenhum
 * dado do formulário pode ativá-la automaticamente. A garantia mora na própria
 * entidade (constrói Inativa e ignora status externo) — o service não decide
 * estado, apenas orquestra.
 *
 * Não pode: falar HTTP/HTML; formatar envelope (Controller); conhecer coluna
 * física (ACL).
 *
 * @param {ParceiraRepository} parceiraRepository
 */

this.CadastrarParceiraService = class CadastrarParceiraService {
  constructor(parceiraRepository) {
    this.parceiraRepository = parceiraRepository;
  }

  /**
   * Cadastra uma nova Parceira a partir dos dados do formulário.
   * @param {{nome: string}} dados dados curados do cadastro.
   * @returns {Parceira} a Parceira persistida (Inativa).
   */
  executar(dados) {
    const parceira = new Parceira(dados && dados.nome);
    return this.parceiraRepository.salvar(parceira);
  }
};

// ============================================================================
// SERVICE — ImportadorService.js (ex-src/service/ImportadorService.js)
// ============================================================================

/**
 * SERVICE: ImportadorService — caso de uso da Importação Inicial da Base
 * (SPEC-003 UC-003.01).
 *
 * ✅ D-02/RN-05 (Q-10 opção A, PO 2026-07-17): registro válido = possui
 * `INFLU_KEY` e nome da influenciadora. No esquema físico real
 * (`PLANILHA_TEAR_2.0_MAPA.md` §3) não existe coluna de nome separada de
 * `INFLU_KEY` — o nome da influenciadora É a própria chave, mesma
 * equivalência já estabelecida em `Parceira` (SPEC-001: `Parceira.nome` é
 * persistido como `INFLU_KEY`, `ParceiraACL.inserir`). Por isso as duas
 * condições do PO colapsam numa só checagem física: `INFLU_KEY` não vazio
 * (`ChaveInfluenciadora`, IM-02). HIPÓTESE registrada aqui (não há campo
 * físico alternativo a checar) — se surgir uma coluna de nome distinta no
 * futuro, esta equivalência precisa ser revista.
 *
 * - RN-01/INV-01: a base legada nunca é escrita — `LegadoACL` não tem
 *   nenhum método de escrita (estrutural, não apenas por convenção).
 * - RN-02/CB-03: chaves grafadas de formas divergentes normalizam para uma
 *   única grafia canônica (`ChaveInfluenciadora`); a primeira ocorrência no
 *   lote legado vence.
 * - CB-02/RNF-03: reexecução é idempotente — chaves já existentes na base
 *   nova (`ParceiraRepository.listarChaves`) nunca são reimportadas/
 *   sobrescritas.
 * - RN-05: demais campos vazios não descartam o registro — são importados
 *   assim mesmo (completáveis depois, SPEC-032).
 * - STATUS legado ausente/desconhecido não descarta o registro (RN-05):
 *   nasce `Inativa`, mesmo default de `Parceira` (SPEC-001 RN-01) — decisão
 *   local, documentada aqui.
 * - Evento publicado SÓ APÓS persistência bem-sucedida, payload sem PII
 *   (RNF-02/INV-03): `{ totalImportado }`.
 *
 * DÍVIDA REGISTRADA: autorização por papel (§13, IM-03) — mesma dívida das
 * demais SPECs administrativas (Q-08 pendente).
 *
 * Não pode: tocar SpreadsheetApp; formatar envelope. Conhece coerção de
 * ESTADO via `ParceiraACL` (mesmo padrão de EnvioService/DocumentoService,
 * que também recebem `ParceiraACL` diretamente como porta do Cadastro) —
 * nunca coluna física em si (isso segue exclusivo da ACL).
 *
 * @param {LegadoACL} legadoACL porta de leitura da base legada (RN-01).
 * @param {ParceiraACL} parceiraACL porta do Cadastro: listarChaves()
 *   (RNF-03/CB-02), importarLote() (§6.3) e statusParaCanonico() (coerção).
 * @param {object} publicadorDeEventos porta de eventos: publicar(evento).
 */

this.ImportadorService = class ImportadorService {
  constructor(legadoACL, parceiraACL, publicadorDeEventos) {
    this.legadoACL = legadoACL;
    this.parceiraACL = parceiraACL;
    this.publicadorDeEventos = publicadorDeEventos;
  }

  /**
   * UC-003.01 · Importa a base legada, curada e normalizada.
   * @returns {{totalImportado: number}}
   */
  importarBase() {
    const existentes = new Set(
      this.parceiraACL.listarChaves().map((chave) => chave.toLowerCase())
    );
    const vistas = new Set();
    const curados = [];

    this.legadoACL.listarRegistros().forEach((bruto) => {
      let chave;
      try {
        chave = new ChaveInfluenciadora(bruto.INFLU_KEY);
      } catch {
        // CB-01: registro sem INFLU_KEY é descartado da curadoria, sem lançar.
        return;
      }
      const normalizada = chave.normalizada();
      if (existentes.has(normalizada) || vistas.has(normalizada)) {
        // CB-02/CB-03: já existe na base nova ou duplicado no próprio lote
        // legado (a primeira ocorrência já venceu) — idempotente.
        return;
      }
      vistas.add(normalizada);
      curados.push({
        parceiraId: chave.toString(),
        estado: this.estadoDoRegistro(bruto),
        camposFisicos: bruto,
      });
    });

    if (curados.length > 0) {
      this.parceiraACL.importarLote(curados);
    }

    this.publicadorDeEventos.publicar({
      nome: 'BaseImportada',
      totalImportado: curados.length,
    });
    return { totalImportado: curados.length };
  }

  /**
   * Coage o STATUS cru do legado; ausente/desconhecido nasce Inativa
   * (mesmo default de RN-01 SPEC-001) em vez de descartar o registro
   * (RN-05).
   * @param {Object<string, *>} bruto registro cru do legado.
   * @returns {'Ativa'|'Inativa'}
   */
  estadoDoRegistro(bruto) {
    try {
      return this.parceiraACL.statusParaCanonico(bruto.STATUS);
    } catch {
      return 'Inativa';
    }
  }
};

// ============================================================================
// CONTROLLER — ParceiraController.js (ex-src/controller/ParceiraController.js)
// ============================================================================

/**
 * CONTROLLER: ParceiraController — adapta o contrato externo do cadastro.
 *
 * Recebe a chamada do Entrypoint (google.script.run), invoca o Service e
 * devolve SEMPRE o envelope padrão {success,data}/{success,error}
 * (PROJECT_GOVERNANCE §3.3, via envelopeOk/envelopeFail).
 *
 * Não pode: tocar SpreadsheetApp; conter regra de negócio; conhecer coluna
 * física. Expõe apenas uma projeção serializável da Parceira — nunca a
 * instância de domínio.
 *
 * @param {CadastrarParceiraService} cadastrarParceiraService
 */

this.ParceiraController = class ParceiraController {
  constructor(cadastrarParceiraService) {
    this.cadastrarParceiraService = cadastrarParceiraService;
  }

  /**
   * Adapta o cadastro de Parceira ao contrato externo.
   * @param {{nome: string}} dados dados do formulário.
   * @returns {{success: true, data: object}|{success: false, error: object}}
   */
  cadastrar(dados) {
    try {
      const parceira = this.cadastrarParceiraService.executar(dados);
      return envelopeOk({ nome: parceira.nome, estado: parceira.estado });
    } catch (erro) {
      return envelopeFail({ mensagem: erro.message });
    }
  }
};

// ============================================================================
// CONTROLLER — ImportacaoController.js (ex-src/controller/ImportacaoController.js)
// ============================================================================

/**
 * CONTROLLER: ImportacaoController — adapta o contrato externo da
 * Importação Inicial da Base (SPEC-003 UC-003.01).
 *
 * Recebe a chamada do Entrypoint (google.script.run), invoca o
 * ImportadorService e devolve SEMPRE o envelope padrão {success,data}/
 * {success,error} (§3.3) — mesmo padrão de DocumentoController/
 * EntregaController. O payload de sucesso é só `{totalImportado}` — sem
 * PII (RNF-02/INV-03).
 *
 * Não pode: tocar SpreadsheetApp; conter regra de negócio; conhecer coluna
 * física.
 *
 * @param {ImportadorService} importadorService
 */

this.ImportacaoController = class ImportacaoController {
  constructor(importadorService) {
    this.importadorService = importadorService;
  }

  /**
   * Adapta o comando ImportarBase (UC-003.01) ao contrato externo.
   * @returns {{success: true, data: {totalImportado: number}}|{success: false, error: object}}
   */
  importarBase() {
    try {
      return envelopeOk(this.importadorService.importarBase());
    } catch (erro) {
      return envelopeFail({ mensagem: erro.message });
    }
  }
};

// ============================================================================
// ADAPTERS — AdaptadorDeCepBrasilApi.js (ex-src/adapters/AdaptadorDeCepBrasilApi.js)
// ============================================================================

/**
 * ADAPTADOR: AdaptadorDeCepBrasilApi — cumpre a porta "Adaptador de CEP"
 * (SPEC-032 §6.3; RN-01) usando o serviço externo BrasilAPI (PRD §6.1/§10).
 *
 * Contrato da porta: `resolver(cep)` devolve `{rua, bairro, cidade, uf}` em
 * caso de sucesso, ou LANÇA um Error em qualquer falha (CEP inválido,
 * serviço fora do ar, resposta malformada) — a falha é degradável por
 * inteiro no Service (RN-02/CB-01: nunca impede salvar os dados principais).
 *
 * Não pode conter regra de negócio (o que fazer com a falha é do Service).
 */

this.AdaptadorDeCepBrasilApi = class AdaptadorDeCepBrasilApi {
  /**
   * @param {string} cep CEP informado pela Parceira (com ou sem máscara).
   * @returns {{rua: string, bairro: string, cidade: string, uf: string}}
   * @throws {Error} CEP inválido ou serviço indisponível.
   */
  resolver(cep) {
    const limpo = String(cep == null ? '' : cep).replace(/\D/g, '');
    if (limpo === '') {
      throw new Error('CEP vazio — não é possível resolver o endereço.');
    }
    const resposta = UrlFetchApp.fetch('https://brasilapi.com.br/api/cep/v1/' + limpo, {
      muteHttpExceptions: true,
    });
    if (resposta.getResponseCode() !== 200) {
      throw new Error('Serviço de CEP indisponível ou CEP inexistente: ' + limpo);
    }
    const json = JSON.parse(resposta.getContentText());
    return {
      rua: String(json.street || ''),
      bairro: String(json.neighborhood || ''),
      cidade: String(json.city || ''),
      uf: String(json.state || ''),
    };
  }
};
