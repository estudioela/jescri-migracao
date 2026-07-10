/**
 * Migração de `Parceiros_Influenciadoras` a partir da BASE DE DADOS da V1.
 *
 * Por que existe: a primeira importação (`tools/processador.js` +
 * `tear/Importador.js`) leu `base.csv` por ÍNDICE de coluna. Os cabeçalhos
 * reais são `STATUS, INFLU_KEY, CUPOM, INFLUENCIADORA_RAZAO_SOCIAL, ...`, então
 * `linha[0]` gravou `STATUS` ("ON"/"OFF") como chave primária, `linha[1]`
 * gravou `INFLU_KEY` como se fosse o nome, e `Cupom` — a única coluna que
 * permite login — nunca foi escrita. Resultado: 10 linhas com chave duplicada e
 * sem credencial. O login não falhava por autenticação; falhava por dado.
 *
 * Este módulo NÃO repete o erro: lê por NOME de cabeçalho, dos dois lados.
 *
 * A origem é a planilha da V1, aberta por ID — não há seed de PII no
 * repositório (que é público). O ID vem de `PropertiesService`, não do código.
 *
 * TRAVA: `migrarParceirosDaV1()` reescreve uma aba inteira. Toda função global
 * do Apps Script é invocável pelo cliente via `google.script.run`; para que
 * isso não seja uma porta de escrita, a migração só roda com a propriedade
 * `MIGRACAO_HABILITADA` = `true`. Ligue antes, desligue depois.
 */

const ABA_BASE_V1 = 'BASE DE DADOS';
const PROPRIEDADE_PLANILHA_V1 = 'ID_PLANILHA_V1';
const PROPRIEDADE_MIGRACAO_HABILITADA = 'MIGRACAO_HABILITADA';

function _textoDaCelula(valor) {
  return valor === null || valor === undefined ? '' : String(valor).trim();
}

function _mapaDeCabecalhoV1(cabecalho) {
  return cabecalho.reduce((mapa, nome, indice) => {
    const chave = _textoDaCelula(nome);
    if (chave) mapa[chave] = indice;
    return mapa;
  }, {});
}

function _celulaV1(linha, mapa, nome) {
  return nome in mapa ? _textoDaCelula(linha[mapa[nome]]) : '';
}

/**
 * BASE DE DADOS → parceiros da V2. Função pura: não toca o SpreadsheetApp.
 *
 * Regra de parceira ativa, fixada pelo usuário em 2026-07-09 e já aplicada em
 * `tools/ExportadorDeDados.js`: `STATUS` em ON/TRUE **e** `CUPOM` preenchido.
 * Sem cupom não há como logar, então a linha não tem destino na V2.
 *
 * `Categoria` não tem coluna de origem na V1. Sai vazia: não se inventa valor
 * de negócio.
 */
function parceirosDaBaseV1(valores) {
  if (!valores || valores.length < 2) {
    return { parceiros: [], descartadas: [] };
  }

  const mapa = _mapaDeCabecalhoV1(valores[0]);

  ['STATUS', 'INFLU_KEY', 'CUPOM'].forEach(coluna => {
    if (!(coluna in mapa)) {
      throw new Error(`Coluna "${coluna}" não encontrada em "${ABA_BASE_V1}".`);
    }
  });

  const parceiros = [];
  const descartadas = [];

  for (let i = 1; i < valores.length; i++) {
    const linha = valores[i];
    const status = _celulaV1(linha, mapa, 'STATUS').toUpperCase();
    const cupom = _celulaV1(linha, mapa, 'CUPOM');
    const id = _celulaV1(linha, mapa, 'INFLU_KEY');

    const ativa = status === 'ON' || status === 'TRUE' || linha[mapa.STATUS] === true;

    if (!ativa) {
      if (cupom) descartadas.push({ linha: i + 1, motivo: 'INATIVA' });
      continue;
    }
    if (!cupom) {
      descartadas.push({ linha: i + 1, motivo: 'SEM_CUPOM' });
      continue;
    }
    if (!id) {
      descartadas.push({ linha: i + 1, motivo: 'SEM_INFLU_KEY' });
      continue;
    }

    parceiros.push({
      [CAMPOS_PARCEIRO.ID]: id,
      [CAMPOS_PARCEIRO.NOME]: _celulaV1(linha, mapa, 'INFLUENCIADORA_RAZAO_SOCIAL') || id,
      [CAMPOS_PARCEIRO.STATUS_CONTRATO]: 'ATIVO',
      [CAMPOS_PARCEIRO.CATEGORIA]: '',
      [CAMPOS_PARCEIRO.CUPOM]: cupom
    });
  }

  const chaves = parceiros.map(p => p[CAMPOS_PARCEIRO.ID]);
  const duplicadas = chaves.filter((c, i) => chaves.indexOf(c) !== i);
  if (duplicadas.length) {
    throw new Error(`INFLU_KEY duplicada na V1: ${duplicadas.join(', ')}. A chave primária tem que ser única.`);
  }

  return { parceiros: parceiros, descartadas: descartadas };
}

/**
 * Monta a matriz a ser gravada, na ordem do cabeçalho de destino.
 *
 * `Senha_Hash` NUNCA vem da V1 (a V1 usa prefixo de CNPJ como senha). Quando
 * uma linha com o mesmo ID já existe, a senha dela é preservada — reimportar o
 * cadastro não pode deslogar ninguém nem apagar credencial.
 */
function linhasDeParceirosParaGravar(cabecalho, parceiros, hashesPorId) {
  const hashes = hashesPorId || {};

  return parceiros.map(parceiro =>
    cabecalho.map(coluna => {
      if (coluna === CAMPOS_PARCEIRO.SENHA_HASH) {
        return hashes[parceiro[CAMPOS_PARCEIRO.ID]] || '';
      }
      return coluna in parceiro ? parceiro[coluna] : '';
    })
  );
}

/**
 * Garante que a aba de destino tenha todas as colunas de `CAMPOS_PARCEIRO`.
 *
 * Só ACRESCENTA colunas ausentes ao final. Nunca renomeia, reordena nem apaga:
 * uma coluna extra desconhecida pode ser trabalho manual de alguém.
 */
function garantirCabecalhoDeParceiros(cabecalhoAtual) {
  const faltantes = Object.keys(CAMPOS_PARCEIRO)
    .map(chave => CAMPOS_PARCEIRO[chave])
    .filter(coluna => cabecalhoAtual.indexOf(coluna) === -1);

  return { cabecalho: cabecalhoAtual.concat(faltantes), acrescentadas: faltantes };
}

/** A trava vale para toda escrita administrativa deste módulo. */
function _exigirMigracaoHabilitada(propriedades) {
  if (propriedades.getProperty(PROPRIEDADE_MIGRACAO_HABILITADA) !== 'true') {
    throw new Error(
      `Operação desligada. Defina a propriedade "${PROPRIEDADE_MIGRACAO_HABILITADA}" como "true", rode, e apague-a em seguida.`
    );
  }
}

/** Entrada manual, rodada do editor do Apps Script. Reescreve a aba de destino. */
function migrarParceirosDaV1() {
  const propriedades = PropertiesService.getScriptProperties();

  _exigirMigracaoHabilitada(propriedades);

  const idPlanilhaV1 = propriedades.getProperty(PROPRIEDADE_PLANILHA_V1);
  if (!idPlanilhaV1) {
    throw new Error(`Defina a propriedade "${PROPRIEDADE_PLANILHA_V1}" com o ID da planilha da V1.`);
  }

  const origem = SpreadsheetApp.openById(idPlanilhaV1).getSheetByName(ABA_BASE_V1);
  if (!origem) {
    throw new Error(`Aba "${ABA_BASE_V1}" não encontrada na planilha da V1.`);
  }

  const resultado = parceirosDaBaseV1(origem.getDataRange().getValues());

  if (!resultado.parceiros.length) {
    throw new Error('Nenhuma parceira ativa com cupom na V1. Nada foi gravado.');
  }

  const destino = abaObrigatoria(SpreadsheetApp.getActiveSpreadsheet(), PLANILHAS.PARCEIROS_INFLUENCIADORAS);
  const valoresDestino = destino.getDataRange().getValues();
  const cabecalhoAtual = (valoresDestino[0] || []).map(_textoDaCelula).filter(Boolean);

  const { cabecalho, acrescentadas } = garantirCabecalhoDeParceiros(cabecalhoAtual);

  // Preserva senhas já definidas, casando pela chave primária.
  const idIdx = cabecalhoAtual.indexOf(CAMPOS_PARCEIRO.ID);
  const hashIdx = cabecalhoAtual.indexOf(CAMPOS_PARCEIRO.SENHA_HASH);
  const hashesPorId = {};
  if (idIdx !== -1 && hashIdx !== -1) {
    valoresDestino.slice(1).forEach(linha => {
      const id = _textoDaCelula(linha[idIdx]);
      const hash = _textoDaCelula(linha[hashIdx]);
      if (id && hash) hashesPorId[id] = hash;
    });
  }

  const linhas = linhasDeParceirosParaGravar(cabecalho, resultado.parceiros, hashesPorId);

  destino.clearContents();
  destino.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho]);
  destino.getRange(2, 1, linhas.length, cabecalho.length).setValues(linhas);

  const relatorio = [
    `Parceiras gravadas: ${linhas.length}`,
    `Linhas descartadas na V1: ${resultado.descartadas.length}`,
    `Colunas acrescentadas ao cabeçalho: ${acrescentadas.length ? acrescentadas.join(', ') : 'nenhuma'}`,
    `Senhas preservadas: ${Object.keys(hashesPorId).length}`,
    'Próximo passo: adminDefinirSenha(cupom, senha, ADMIN_TOKEN) para cada parceira.'
  ].join('\n');

  console.log(relatorio);
  return relatorio;
}

/**
 * Provisiona uma senha temporária para cada parceira que ainda não tem.
 *
 * Existe porque o editor do Apps Script executa funções SEM argumentos, então
 * `adminDefinirSenha(cupom, senha, token)` é inalcançável pela interface — e
 * sem senha ninguém entra no portal.
 *
 * As senhas em texto puro aparecem UMA VEZ no log de execução (só o dono do
 * script o vê) porque precisam ser entregues às parceiras. Não são gravadas em
 * lugar nenhum: a planilha guarda apenas o hash. Quem já tem `Senha_Hash` é
 * pulada — rodar de novo não desloga ninguém.
 */
function provisionarSenhasIniciais() {
  const propriedades = PropertiesService.getScriptProperties();

  _exigirMigracaoHabilitada(propriedades);

  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const { cabecalho, linhas } = lerAbaComCabecalho(planilha, PLANILHAS.PARCEIROS_INFLUENCIADORAS);
  const cupomIdx = indiceDaColuna(cabecalho, CAMPOS_PARCEIRO.CUPOM, PLANILHAS.PARCEIROS_INFLUENCIADORAS);
  const hashIdx = indiceDaColuna(cabecalho, CAMPOS_PARCEIRO.SENHA_HASH, PLANILHAS.PARCEIROS_INFLUENCIADORAS);

  const repositorio = new ParceiroRepository(planilha);
  const provisionadas = [];

  linhas.forEach(linha => {
    const cupom = _textoDaCelula(linha[cupomIdx]);
    if (!cupom || _textoDaCelula(linha[hashIdx])) {
      return;
    }

    const senha = Utilities.getUuid().replace(/-/g, '').slice(0, 10);
    repositorio.definirSenhaHash(cupom, criarSenhaHash(senha));
    provisionadas.push(`${cupom}\t${senha}`);
  });

  if (!provisionadas.length) {
    const aviso = 'Nenhuma parceira sem senha. Nada foi alterado.';
    console.log(aviso);
    return aviso;
  }

  const relatorio = [
    `${provisionadas.length} senha(s) provisionada(s). Entregue cada uma à parceira e apague este log.`,
    'CUPOM\tSENHA',
    ...provisionadas
  ].join('\n');

  console.log(relatorio);
  return relatorio;
}
