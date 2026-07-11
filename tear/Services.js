/* ═══════════════════════════════════════════════════════════════
   services/AtivacaoService.js
   ═══════════════════════════════════════════════════════════════ */

const EVENTO_ATIVACAO_ESTADO_ALTERADO = 'AtivacaoEstadoAlterado';

/** Prazo de aprovação = 7 dias corridos antes da entrega (regra do briefing). */
const DIAS_ANTECEDENCIA_APROVACAO = 7;

class AtivacaoService {
  constructor(eventDispatcher, repository) {
    if (!eventDispatcher) {
      throw new TypeError('AtivacaoService exige um EventDispatcher.');
    }

    this.eventDispatcher = eventDispatcher;
    this.repository = repository || new AtivacaoRepository();
  }

  /**
   * Leitura de todas as ativações de um ciclo, já em DTO.
   *
   * O Service nunca devolve a linha crua do Repository: a UI não pode depender
   * do nome das colunas da planilha, senão trocar Sheets por um banco na V3
   * quebraria o front-end — que é exatamente o que a camada existe para evitar.
   */
  listarPorCiclo(idCiclo) {
    if (!idCiclo) {
      throw new Error('É obrigatório informar o ciclo.');
    }

    return this.repository.findByCiclo(idCiclo).map(linha => this._paraDto(linha));
  }

  /**
   * Escopo por parceira. Sem isto, uma influenciadora autenticada veria as
   * entregas de todas as outras do mesmo ciclo.
   */
  listarDaInfluenciadoraNoCiclo(idCiclo, idInfluenciadora) {
    if (!idInfluenciadora) {
      throw new Error('É obrigatório informar a influenciadora.');
    }

    return this.listarPorCiclo(idCiclo)
      .filter(dto => dto.idInfluenciadora === String(idInfluenciadora));
  }

  /**
   * O histórico da V2 não é uma aba: é o próprio ciclo de vida da ativação.
   * `Arquivada` é o estado terminal (docs/spec/SCHEMA_V2.md) — nada sai de lá.
   */
  listarArquivadasDaInfluenciadoraNoCiclo(idCiclo, idInfluenciadora) {
    return this.listarDaInfluenciadoraNoCiclo(idCiclo, idInfluenciadora)
      .filter(dto => dto.estado === ESTADOS_ATIVACAO.ARQUIVADA);
  }

  obter(idAtivacao, idInfluenciadora) {
    return this._paraDto(this._exigirPropria(idAtivacao, idInfluenciadora));
  }

  /**
   * Posse, antes de qualquer leitura ou escrita de UMA ativação.
   *
   * `listarDaInfluenciadoraNoCiclo` já filtrava por parceira, mas `obter` e
   * `alterarEstado` recebiam só o id da ativação: bastava trocar o argumento
   * para ler — e alterar o estado — a entrega de outra influenciadora.
   *
   * "Não é sua" e "não existe" devolvem a MESMA mensagem: distinguir as duas
   * revelaria quais ids existem na planilha.
   */
  _exigirPropria(idAtivacao, idInfluenciadora) {
    if (!idInfluenciadora) {
      throw new Error('É obrigatório informar a influenciadora.');
    }

    const dados = this.repository.getById(idAtivacao);
    const propria = dados &&
      String(dados[CAMPOS_ATIVACAO.INFLUENCIADORA]) === String(idInfluenciadora);

    if (!propria) {
      throw new Error(`Ativação "${idAtivacao}" não encontrada.`);
    }

    return dados;
  }

  /**
   * A planilha devolve `Date` para colunas de data e `''` para célula vazia.
   * Serializar aqui evita que cada tela invente seu próprio tratamento — e
   * `google.script.run` não preserva `Date` de forma confiável.
   */
  _paraDto(linha) {
    const C = CAMPOS_ATIVACAO;

    return {
      idAtivacao: textoDeCelula(linha[C.ID]),
      idCiclo: textoDeCelula(linha[C.CICLO]),
      idInfluenciadora: textoDeCelula(linha[C.INFLUENCIADORA]),
      tipoConteudo: textoDeCelula(linha[C.TIPO_CONTEUDO]),
      estado: textoDeCelula(linha[C.ESTADO]),
      lookReferencia: textoDeCelula(linha[C.LOOK]),
      entregaPrevista: dataIsoDeCelula(linha[C.ENTREGA_PREVISTA]),
      // Derivado, não persistido: 7 dias corridos antes da entrega (regra do
      // briefing). A parceira precisa aprovar o conteúdo até aqui.
      prazoAprovacao: dataMenosDiasCorridos(dataIsoDeCelula(linha[C.ENTREGA_PREVISTA]), DIAS_ANTECEDENCIA_APROVACAO),
      linkBriefing: textoDeCelula(linha[C.LINK_BRIEFING]),
      linkUploadHd: textoDeCelula(linha[C.LINK_UPLOAD_HD])
    };
  }

  alterarEstado(idAtivacao, novoEstado, idInfluenciadora) {
    return this._transicionarEstado(this._exigirPropria(idAtivacao, idInfluenciadora), novoEstado);
  }

  /**
   * Caminho administrativo: transiciona sem checar posse. A autoridade é o
   * ADMIN_TOKEN, validado no entrypoint (`_exigirAdmin`), não a influenciadora.
   * Mesma decisão de `LogisticaService.alterarStatusComoAdmin`.
   */
  alterarEstadoComoAdmin(idAtivacao, novoEstado) {
    const dados = this.repository.getById(idAtivacao);
    if (!dados) {
      throw new Error(`Ativação "${idAtivacao}" não encontrada.`);
    }
    return this._transicionarEstado(dados, novoEstado);
  }

  _transicionarEstado(dados, novoEstado) {
    const ativacao = new Ativacao(dados);
    ativacao.validateStateTransition(novoEstado);

    const estadoAnterior = ativacao.estadoAtual;

    const atualizado = Object.assign({}, dados);
    atualizado[CAMPOS_ATIVACAO.ESTADO] = novoEstado;

    const salvo = this.repository.save(atualizado);

    const dto = {
      idAtivacao: salvo[CAMPOS_ATIVACAO.ID],
      estadoAnterior: estadoAnterior,
      novoEstado: novoEstado,
      atualizadoEm: new Date().toISOString()
    };

    this.eventDispatcher.dispatch(EVENTO_ATIVACAO_ESTADO_ALTERADO, dto);

    return dto;
  }
}

/* ═══════════════════════════════════════════════════════════════
   services/CicloService.js
   ═══════════════════════════════════════════════════════════════ */

/**
 * Orquestra a leitura de ciclos. Devolve DTO, nunca a linha crua do Repository:
 * a UI não pode depender do nome das colunas da planilha.
 *
 * Ciclo não tem invariante de negócio hoje (nenhuma transição, nenhuma regra),
 * então não existe Entity `Ciclo`. Criar uma classe vazia só para simetria com
 * `Ativacao` seria abstração antecipada — CLAUDE.md §12.3.
 */
class CicloService {
  constructor(repository) {
    this.repository = repository || new CicloRepository();
  }

  listar() {
    return this.repository.listarTodos().map(linha => this._paraDto(linha));
  }

  _paraDto(linha) {
    const C = CAMPOS_CICLO;

    return {
      idCiclo: textoDeCelula(linha[C.ID]),
      nome: textoDeCelula(linha[C.NOME]) || textoDeCelula(linha[C.ID]),
      inicioLogistica: dataIsoDeCelula(linha[C.INICIO_LOGISTICA]),
      fimOperacao: dataIsoDeCelula(linha[C.FIM_OPERACAO])
    };
  }
}

/* ═══════════════════════════════════════════════════════════════
   services/PagamentoService.js
   ═══════════════════════════════════════════════════════════════ */

/**
 * Pagamento é um MODELO DE LEITURA derivado, não uma entidade persistida.
 * A V2 não tem aba de pagamentos: a informação já existe em
 * `Planos_Colaboracao` (o quanto foi acordado) cruzada com `Ativacoes`
 * (o que de fato foi entregue).
 *
 * ⚠️ A regra de elegibilidade abaixo foi DERIVADA da máquina de estados, não
 * extraída de uma especificação de negócio — mesma ressalva que
 * `docs/spec/SCHEMA_V2.md` faz sobre o grafo de transições. Confirmar com o
 * usuário antes de tratar como definitiva.
 */
class PagamentoService {
  constructor(planoRepository, ativacaoRepository) {
    if (!planoRepository || !ativacaoRepository) {
      throw new TypeError('PagamentoService exige PlanoRepository e AtivacaoRepository.');
    }

    this.planoRepository = planoRepository;
    this.ativacaoRepository = ativacaoRepository;
  }

  /** Escopo por parceira: ninguém vê o cachê acordado com outra influenciadora. */
  listarPorCiclo(idCiclo, idInfluenciadora) {
    if (!idCiclo) {
      throw new Error('É obrigatório informar o ciclo.');
    }

    if (!idInfluenciadora) {
      throw new Error('É obrigatório informar a influenciadora.');
    }

    const ativacoesPorInfluenciadora = this._agruparPorInfluenciadora(
      this.ativacaoRepository.findByCiclo(idCiclo)
    );

    const planos = this.planoRepository
      .findByCiclo(idCiclo)
      .filter(plano => String(plano[CAMPOS_PLANO.INFLUENCIADORA]) === String(idInfluenciadora));

    return planos.map(plano => {
      const ativacoes = ativacoesPorInfluenciadora[plano[CAMPOS_PLANO.INFLUENCIADORA]] || [];

      return {
        idPlano: textoDeCelula(plano[CAMPOS_PLANO.ID]),
        idInfluenciadora: textoDeCelula(plano[CAMPOS_PLANO.INFLUENCIADORA]),
        idCiclo: textoDeCelula(plano[CAMPOS_PLANO.CICLO]),
        valorCache: textoDeCelula(plano[CAMPOS_PLANO.VALOR_CACHE]),
        entregaveisAcordados: textoDeCelula(plano[CAMPOS_PLANO.QTD_ENTREGAVEIS]),
        entregaveisConcluidos: this._contarConcluidas(ativacoes),
        estado: this._estadoDoPagamento(ativacoes)
      };
    });
  }

  _agruparPorInfluenciadora(ativacoes) {
    return ativacoes.reduce((mapa, ativacao) => {
      const chave = ativacao[CAMPOS_ATIVACAO.INFLUENCIADORA];

      if (!mapa[chave]) mapa[chave] = [];
      mapa[chave].push(ativacao);

      return mapa;
    }, {});
  }

  _contarConcluidas(ativacoes) {
    const finais = [
      ESTADOS_ATIVACAO.CONCLUIDA,
      ESTADOS_ATIVACAO.ELEGIVEL_PARA_PAGAMENTO,
      ESTADOS_ATIVACAO.ARQUIVADA
    ];

    return ativacoes.filter(a => finais.indexOf(a[CAMPOS_ATIVACAO.ESTADO]) !== -1).length;
  }

  /**
   * Elegível só quando NENHUMA entrega do ciclo está pendente. Um plano sem
   * ativação nenhuma é `Pendente`, nunca elegível — senão um cadastro
   * incompleto pareceria pronto para pagar.
   */
  _estadoDoPagamento(ativacoes) {
    if (!ativacoes.length) {
      return 'Pendente';
    }

    const liberadas = [ESTADOS_ATIVACAO.ELEGIVEL_PARA_PAGAMENTO, ESTADOS_ATIVACAO.ARQUIVADA];
    const todasLiberadas = ativacoes.every(a => liberadas.indexOf(a[CAMPOS_ATIVACAO.ESTADO]) !== -1);

    return todasLiberadas ? 'Elegível para Pagamento' : 'Pendente';
  }
}

/* ═══════════════════════════════════════════════════════════════
   services/AuthService.js
   ═══════════════════════════════════════════════════════════════ */

/**
 * Autenticação da V2.
 *
 * Nenhum DTO daqui carrega `Senha_Hash`. Nenhuma mensagem de erro distingue
 * "cupom não existe" de "senha errada": a diferença permitiria enumerar
 * parceiras cadastradas.
 */
/** Formato `salt$hash` válido, senha nenhuma. Só existe para gastar o mesmo tempo. */
const HASH_FICTICIO_PARA_TEMPO_CONSTANTE =
  '00000000-0000-0000-0000-000000000000$' +
  '0000000000000000000000000000000000000000000000000000000000000000';

class AuthService {
  constructor(parceiroRepository, sessaoRepository) {
    if (!parceiroRepository || !sessaoRepository) {
      throw new TypeError('AuthService exige ParceiroRepository e SessaoRepository.');
    }

    this.parceiroRepository = parceiroRepository;
    this.sessaoRepository = sessaoRepository;
  }

  login(cupom, senha) {
    if (!cupom || !senha) {
      throw new Error('Informe o cupom e a senha.');
    }

    if (this.sessaoRepository.estaBloqueado(cupom)) {
      throw new Error('Muitas tentativas. Tente novamente em alguns minutos.');
    }

    const parceiro = this.parceiroRepository.findByCupom(cupom);

    // Hash fictício, com formato válido, para cupom inexistente: sem ele, o
    // caminho "não existe" não calcularia SHA-256 e responderia mais rápido que
    // "senha errada" — um oráculo de tempo que permite enumerar cupons apesar
    // de as mensagens serem idênticas.
    const armazenado = parceiro
      ? parceiro[CAMPOS_PARCEIRO.SENHA_HASH]
      : HASH_FICTICIO_PARA_TEMPO_CONSTANTE;

    const senhaCorreta = senhaConfere(senha, armazenado);

    // Uma parceira sem senha definida não loga — a aba nasce sem credencial.
    if (!parceiro || !senhaCorreta) {
      this.sessaoRepository.registrarTentativa(cupom);
      throw new Error('Cupom ou senha inválidos.');
    }

    this.sessaoRepository.limparTentativas(cupom);

    return {
      token: this.sessaoRepository.criar(parceiro[CAMPOS_PARCEIRO.ID]),
      perfil: this._paraDto(parceiro)
    };
  }

  sessaoAtual(token) {
    const idInfluenciadora = this.sessaoRepository.resolver(token);

    if (!idInfluenciadora) {
      throw new Error('Sessão expirada. Entre novamente.');
    }

    const parceiro = this.parceiroRepository.getById(idInfluenciadora);

    if (!parceiro) {
      throw new Error('Sessão expirada. Entre novamente.');
    }

    return this._paraDto(parceiro);
  }

  logout(token) {
    this.sessaoRepository.destruir(token);

    return { encerrada: true };
  }

  /** `Senha_Hash` e `Cupom` não saem daqui. */
  _paraDto(parceiro) {
    return {
      idInfluenciadora: textoDeCelula(parceiro[CAMPOS_PARCEIRO.ID]),
      nome: textoDeCelula(parceiro[CAMPOS_PARCEIRO.NOME]),
      statusContrato: textoDeCelula(parceiro[CAMPOS_PARCEIRO.STATUS_CONTRATO]),
      categoria: textoDeCelula(parceiro[CAMPOS_PARCEIRO.CATEGORIA])
    };
  }
}


/* ═══════════════════════════════════════════════════════════════
   services/ParceiroService.js
   ═══════════════════════════════════════════════════════════════ */

/** Chave de identidade do cadastro (upsert casa por ela). */
const CHAVE_PARCEIRO = 'INFLU_KEY';

/** Mínimo para um cadastro fazer sentido: quem é, razão social e cupom. */
const CAMPOS_OBRIGATORIOS_PARCEIRO = Object.freeze(['INFLU_KEY', 'INFLUENCIADORA_RAZAO_SOCIAL', 'CUPOM']);

/** Só e-mail e CNPJ são chaves de busca: não se varre a base por coluna arbitrária. */
const CAMPOS_BUSCAVEIS_PARCEIRO = Object.freeze(['EMAIL', 'INFLUENCIADORA_CNPJ']);

class ParceiroService {
  constructor(parceiroRepository) {
    if (!parceiroRepository) {
      throw new TypeError('ParceiroService exige uma instância de ParceiroRepository.');
    }

    this.repository = parceiroRepository;
  }

  /** Preenchimento inteligente: devolve o cadastro por e-mail/CNPJ, ou null. */
  buscar(campo, valor) {
    if (CAMPOS_BUSCAVEIS_PARCEIRO.indexOf(campo) === -1) {
      throw new Error('Busca permitida apenas por e-mail ou CNPJ.');
    }

    return this.repository.buscarPorCampo(campo, valor);
  }

  salvar(dados) {
    if (!dados || typeof dados !== 'object') {
      throw new Error('Dados da parceira ausentes.');
    }

    CAMPOS_OBRIGATORIOS_PARCEIRO.forEach(function (campo) {
      if (!dados[campo] || String(dados[campo]).trim() === '') {
        throw new Error(`É obrigatório informar "${campo}".`);
      }
    });

    return this.repository.upsert(dados, CHAVE_PARCEIRO);
  }

  /**
   * Funil de cadastro (Google Forms → aba CADASTROS → Parceiros_Influenciadoras).
   *
   * Escreve no cabeçalho CANÔNICO (`CAMPOS_PARCEIRO`), diferente do `salvar()`
   * legado (vocabulário físico do wizard). Upsert SEGURO por `ID_Influenciadora`:
   * - registro NOVO   → grava dados cadastrais + Status_Contrato = PENDENTE;
   *                     Cupom, Autocrat e Senha_Hash nascem vazios.
   * - registro EXISTE → atualiza SÓ os dados cadastrais (Nome, Endereço);
   *                     jamais toca Cupom, Status_Contrato, Autocrat ou Senha_Hash.
   *
   * `valoresPorColuna`: mapa título-da-pergunta → resposta (ex.: `e.namedValues`
   * achatado). Devolve `{ ignorado, criado?, chave? }`.
   */
  registrarCadastro(valoresPorColuna) {
    // Resolve Rua/Bairro/Cidade a partir do CEP (o Forms não pergunta a Rua).
    // Se todas as APIs falharem, `enderecoApi` vem null e o endereço degrada
    // graciosamente — o cadastro nunca se perde por causa do CEP.
    const cep = _cepDoCadastro_(valoresPorColuna);
    const enderecoApi = cep ? buscarCepMultiAPI(cep) : null;
    const base = parceiroDeCadastro_(valoresPorColuna, enderecoApi);

    if (!base) {
      return { ignorado: true, motivo: 'SEM_APELIDO' };
    }

    const id = base[CAMPOS_PARCEIRO.ID];
    const jaExiste = !!this.repository.getById(id);

    // Novo: acrescenta o status inicial. Existente: só os campos cadastrais de
    // `base` — o upsert preserva toda coluna não presente no payload.
    const dados = jaExiste
      ? base
      : Object.assign({}, base, { [CAMPOS_PARCEIRO.STATUS_CONTRATO]: STATUS_CADASTRO_PADRAO });

    const resultado = this.repository.upsert(dados, CAMPOS_PARCEIRO.ID);

    return { ignorado: false, criado: resultado.criado, chave: resultado.chave };
  }
}

/* ── Funil de cadastro: transform puro (Forms → cadastro canônico) ─────────── */

const STATUS_CADASTRO_PADRAO = 'PENDENTE';

// Títulos candidatos por campo do formulário (a comparação normaliza acentos,
// caixa e pontuação). O 1º de cada lista é o título LITERAL da pergunta no Google
// Forms; os demais são fallbacks tolerantes. Ajuste aqui se os títulos mudarem.
const CANDIDATOS_CADASTRO = Object.freeze({
  APELIDO: [
    'como prefere ser chamada (pode ser apelido + sobrenome, por exemplo)',
    'como prefere ser chamada', 'como prefere ser chamado', 'apelido', 'como gostaria de ser chamada'
  ],
  RAZAO: ['razão social', 'razao social', 'nome completo', 'nome', 'razao social ou nome completo'],
  RUA: ['rua', 'logradouro', 'endereco'],
  NUMERO: ['número (prédio, casa, condomínio...)', 'numero', 'nº', 'no', 'n'],
  COMPLEMENTO: ['complemento (se houver: bloco, torre, apto...)', 'complemento'],
  // No Forms o CEP veio rotulado ora como "CEP", ora como "CNPJ" (título trocado
  // na origem). Tentamos "cep" primeiro; "cnpj" é o fallback observado.
  CEP: ['cep', 'cnpj']
});

function _textoCadastro_(valor) {
  return valor === null || valor === undefined ? '' : String(valor).trim();
}

// Normaliza uma chave de cabeçalho/pergunta: sem acento, minúscula, pontuação
// vira espaço, espaços colapsados. "Como prefere ser chamada?" → "como prefere ser chamada".
function _normalizarChaveCadastro_(texto) {
  return String(texto === null || texto === undefined ? '' : texto)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Devolve um leitor que resolve o primeiro título candidato presente no mapa.
function _leitorDeCadastro_(valoresPorColuna) {
  const normalizado = {};
  Object.keys(valoresPorColuna || {}).forEach(chave => {
    normalizado[_normalizarChaveCadastro_(chave)] = valoresPorColuna[chave];
  });

  return function (candidatos) {
    for (let i = 0; i < candidatos.length; i++) {
      const chave = _normalizarChaveCadastro_(candidatos[i]);
      if (chave in normalizado) {
        return _textoCadastro_(normalizado[chave]);
      }
    }
    return '';
  };
}

// Lê o CEP cru do formulário (título candidato), para alimentar a busca multi-API.
function _cepDoCadastro_(valoresPorColuna) {
  return _leitorDeCadastro_(valoresPorColuna)(CANDIDATOS_CADASTRO.CEP);
}

// Formata 8 dígitos como CEP brasileiro (XXXXX-XXX); devolve o texto original
// trimado se não tiver 8 dígitos. PURA.
function _formatarCep_(cep) {
  const digitos = String(cep === null || cep === undefined ? '' : cep).replace(/\D/g, '');
  return digitos.length === 8
    ? `${digitos.slice(0, 5)}-${digitos.slice(5)}`
    : _textoCadastro_(cep);
}

/**
 * Monta o Endereço_Formatado no padrão EXATO exigido pelo Autocrat:
 *   "RUA, NÚMERO, COMPLEMENTO, BAIRRO - CIDADE/UF, CEP"  (tudo em caixa alta)
 * Ex.: "RUA QUELUZ, 450, APTO 202, BOM PASTOR - DIVINÓPOLIS/MG, 35500-166".
 * Segmentos vazios são omitidos junto do separador (sem complemento não deixa
 * vírgula solta; sem bairro/cidade não deixa " - " órfão). PURA.
 */
function _montarEnderecoFormatado_(partes) {
  const rua = _textoCadastro_(partes.rua);
  const numero = _textoCadastro_(partes.numero);
  const complemento = _textoCadastro_(partes.complemento);
  const bairro = _textoCadastro_(partes.bairro);
  const cidade = _textoCadastro_(partes.cidade);
  const uf = _textoCadastro_(partes.uf);
  const cep = _formatarCep_(partes.cep);

  const cidadeUf = cidade ? (uf ? `${cidade}/${uf}` : cidade) : '';
  const local = [bairro, cidadeUf].filter(Boolean).join(' - ');

  return [rua, numero, complemento, local, cep].filter(Boolean).join(', ').toUpperCase();
}

/* ── Resolução de CEP: varredura multi-API com fallback sequencial ─────────── */

// Cada provedor devolve um shape diferente; normalizamos todos para
// { logradouro, bairro, localidade, uf }. Funções PURAS (testáveis no Jest).
function _normViaCep_(j) {
  if (!j || j.erro) return null;
  return { logradouro: j.logradouro, bairro: j.bairro, localidade: j.localidade, uf: j.uf };
}
function _normBrasilApi_(j) {
  if (!j || !j.city) return null;
  return { logradouro: j.street, bairro: j.neighborhood, localidade: j.city, uf: j.state };
}
function _normAwesomeApi_(j) {
  if (!j || !j.city) return null;
  return { logradouro: j.address, bairro: j.district, localidade: j.city, uf: j.state };
}
function _normOpenCep_(j) {
  if (!j || j.erro) return null;
  return { logradouro: j.logradouro, bairro: j.bairro, localidade: j.localidade, uf: j.uf };
}

// Ordem de tentativa: ViaCEP → BrasilAPI → AwesomeAPI → OpenCEP.
const PROVEDORES_CEP = Object.freeze([
  { nome: 'ViaCEP',     url: (c) => `https://viacep.com.br/ws/${c}/json/`,        norm: _normViaCep_ },
  { nome: 'BrasilAPI',  url: (c) => `https://brasilapi.com.br/api/cep/v1/${c}`,   norm: _normBrasilApi_ },
  { nome: 'AwesomeAPI', url: (c) => `https://cep.awesomeapi.com.br/json/${c}`,    norm: _normAwesomeApi_ },
  { nome: 'OpenCEP',    url: (c) => `https://opencep.com/v1/${c}`,                norm: _normOpenCep_ }
]);

// Um resultado só vale se trouxe ao menos a localidade (cidade sempre presente
// quando o CEP existe). Sem isso, cai para o próximo provedor.
function _cepValido_(dados) {
  return !!(dados && String(dados.localidade || '').trim());
}

/**
 * Varre os provedores de CEP em ORDEM; devolve { logradouro, bairro, localidade,
 * uf } do primeiro que responder 200 com dados válidos, ou `null` se todos
 * falharem/estiverem fora do ar ou o CEP for inválido. NUNCA lança — a
 * indisponibilidade do CEP degrada o endereço, não derruba o gatilho.
 */
function buscarCepMultiAPI(cep) {
  const digitos = String(cep === null || cep === undefined ? '' : cep).replace(/\D/g, '');
  if (digitos.length !== 8) return null;
  if (typeof UrlFetchApp === 'undefined') return null; // ambiente sem rede (Jest)

  for (let i = 0; i < PROVEDORES_CEP.length; i++) {
    const provedor = PROVEDORES_CEP[i];
    try {
      const resposta = UrlFetchApp.fetch(provedor.url(digitos), {
        muteHttpExceptions: true,
        followRedirects: true
      });
      if (resposta.getResponseCode() !== 200) continue;
      const dados = provedor.norm(JSON.parse(resposta.getContentText()));
      if (_cepValido_(dados)) return dados;
    } catch (erro) {
      console.warn(`buscarCepMultiAPI: ${provedor.nome} falhou (${erro.message}); tentando o próximo.`);
    }
  }
  return null;
}

/**
 * Transform PURO da resposta bruta do formulário para o cadastro canônico.
 * `enderecoApi` (opcional) traz { logradouro, bairro, localidade, uf } resolvidos
 * pelo CEP; quando ausente, o endereço degrada para o que veio no formulário.
 * Devolve `null` quando falta o apelido (sem chave primária não há registro).
 * `Nome` cai para o apelido quando a razão social vem vazia — nunca fica vazio.
 */
function parceiroDeCadastro_(valoresPorColuna, enderecoApi) {
  const get = _leitorDeCadastro_(valoresPorColuna);
  const id = get(CANDIDATOS_CADASTRO.APELIDO).trim().toUpperCase();

  if (!id) {
    return null;
  }

  const api = enderecoApi || {};
  const parceiro = {};
  parceiro[CAMPOS_PARCEIRO.ID] = id;
  parceiro[CAMPOS_PARCEIRO.NOME] = get(CANDIDATOS_CADASTRO.RAZAO) || id;
  parceiro['Endereço_Formatado'] = _montarEnderecoFormatado_({
    rua: api.logradouro || get(CANDIDATOS_CADASTRO.RUA),
    numero: get(CANDIDATOS_CADASTRO.NUMERO),
    complemento: get(CANDIDATOS_CADASTRO.COMPLEMENTO),
    bairro: api.bairro,
    cidade: api.localidade,
    uf: api.uf,
    cep: get(CANDIDATOS_CADASTRO.CEP)
  });

  return parceiro;
}

/* ═══════════════════════════════════════════════════════════════
   services/LogisticaService.js
   ═══════════════════════════════════════════════════════════════ */

const EVENTO_LOGISTICA_ENVIADA = 'LogisticaEnviada';
const EVENTO_LOGISTICA_STATUS_ALTERADO = 'LogisticaStatusAlterado';

/**
 * Orquestra a logística de envios. Devolve DTO, nunca a linha crua — a UI não
 * pode depender do nome das colunas da planilha (mesma razão de `AtivacaoService`).
 *
 * A "automação" da V1 (avisar a influenciadora quando o envio sai) é modelada
 * como EVENTO (`EVENTO_LOGISTICA_ENVIADA`), não como chamada direta a `MailApp`
 * dentro do Service: quem quiser notificar assina o evento. Nenhum listener de
 * e-mail é registrado aqui — disparo real de e-mail é efeito externo e exige
 * autorização explícita (CLAUDE.md §12.4).
 */
class LogisticaService {
  constructor(eventDispatcher, repository) {
    if (!eventDispatcher) {
      throw new TypeError('LogisticaService exige um EventDispatcher.');
    }

    this.eventDispatcher = eventDispatcher;
    this.repository = repository || new LogisticaRepository();
  }

  listarPorCiclo(idCiclo) {
    if (!idCiclo) {
      throw new Error('É obrigatório informar o ciclo.');
    }

    return this.repository.findByCiclo(idCiclo).map(linha => this._paraDto(linha));
  }

  /**
   * Escopo por parceira: uma influenciadora só vê os próprios envios (endereço,
   * rastreio), nunca os das outras do mesmo ciclo.
   */
  listarDaInfluenciadoraNoCiclo(idCiclo, idInfluenciadora) {
    if (!idInfluenciadora) {
      throw new Error('É obrigatório informar a influenciadora.');
    }

    return this.listarPorCiclo(idCiclo)
      .filter(dto => dto.idInfluenciadora === String(idInfluenciadora));
  }

  obter(idLogistica, idInfluenciadora) {
    return this._paraDto(this._exigirPropria(idLogistica, idInfluenciadora));
  }

  /**
   * Automação de envio: grava o rastreio e transiciona para "Enviado" numa
   * operação só, disparando `EVENTO_LOGISTICA_ENVIADA`.
   */
  registrarEnvio(idLogistica, codigoRastreio, idInfluenciadora) {
    if (!codigoRastreio || String(codigoRastreio).trim() === '') {
      throw new Error('É obrigatório informar o código de rastreio.');
    }

    const dados = this._exigirPropria(idLogistica, idInfluenciadora);

    const logistica = new Logistica(dados);
    logistica.validateStateTransition(ESTADOS_LOGISTICA.ENVIADO);

    const atualizado = Object.assign({}, dados);
    atualizado[CAMPOS_LOGISTICA.STATUS] = ESTADOS_LOGISTICA.ENVIADO;
    atualizado[CAMPOS_LOGISTICA.RASTREIO] = String(codigoRastreio).trim();
    atualizado[CAMPOS_LOGISTICA.DATA_ENVIO] = new Date().toISOString();

    const salvo = this.repository.save(atualizado);

    const dto = {
      idLogistica: salvo[CAMPOS_LOGISTICA.ID],
      idInfluenciadora: String(idInfluenciadora),
      codigoRastreio: atualizado[CAMPOS_LOGISTICA.RASTREIO],
      status: ESTADOS_LOGISTICA.ENVIADO,
      enviadoEm: atualizado[CAMPOS_LOGISTICA.DATA_ENVIO]
    };

    this.eventDispatcher.dispatch(EVENTO_LOGISTICA_ENVIADA, dto);

    return dto;
  }

  alterarStatus(idLogistica, novoStatus, idInfluenciadora) {
    return this._transicionarStatus(this._exigirPropria(idLogistica, idInfluenciadora), novoStatus);
  }

  /**
   * Alteração de status pelo Painel Admin. A autoridade é o ADMIN_TOKEN validado
   * no entrypoint (`_exigirAdmin` em Roteador.js), não a posse por parceira — por
   * isso NÃO passa por `_exigirPropria`. Mesma transição/evento de `alterarStatus`.
   */
  alterarStatusComoAdmin(idLogistica, novoStatus) {
    const dados = this.repository.getById(idLogistica);

    if (!dados) {
      throw new Error(`Logística "${idLogistica}" não encontrada.`);
    }

    return this._transicionarStatus(dados, novoStatus);
  }

  _transicionarStatus(dados, novoStatus) {
    const logistica = new Logistica(dados);
    logistica.validateStateTransition(novoStatus);

    const statusAnterior = logistica.statusAtual;

    const atualizado = Object.assign({}, dados);
    atualizado[CAMPOS_LOGISTICA.STATUS] = novoStatus;

    const salvo = this.repository.save(atualizado);

    const dto = {
      idLogistica: salvo[CAMPOS_LOGISTICA.ID],
      statusAnterior: statusAnterior,
      novoStatus: novoStatus,
      atualizadoEm: new Date().toISOString()
    };

    this.eventDispatcher.dispatch(EVENTO_LOGISTICA_STATUS_ALTERADO, dto);

    return dto;
  }

  /**
   * Posse antes de qualquer leitura/escrita de UM envio. "Não é sua" e "não
   * existe" devolvem a MESMA mensagem — distinguir revelaria ids existentes
   * (mesma decisão de `AtivacaoService._exigirPropria`).
   */
  _exigirPropria(idLogistica, idInfluenciadora) {
    if (!idInfluenciadora) {
      throw new Error('É obrigatório informar a influenciadora.');
    }

    const dados = this.repository.getById(idLogistica);
    const propria = dados &&
      String(dados[CAMPOS_LOGISTICA.INFLUENCIADORA]) === String(idInfluenciadora);

    if (!propria) {
      throw new Error(`Logística "${idLogistica}" não encontrada.`);
    }

    return dados;
  }

  _paraDto(linha) {
    const C = CAMPOS_LOGISTICA;

    return {
      idLogistica: textoDeCelula(linha[C.ID]),
      idCiclo: textoDeCelula(linha[C.CICLO]),
      idInfluenciadora: textoDeCelula(linha[C.INFLUENCIADORA]),
      enderecoEntrega: textoDeCelula(linha[C.ENDERECO]),
      codigoRastreio: textoDeCelula(linha[C.RASTREIO]),
      dataEnvio: dataIsoDeCelula(linha[C.DATA_ENVIO]),
      status: textoDeCelula(linha[C.STATUS])
    };
  }
}
