/**
 * Exportador de dados da V1 para a migração da V2.
 *
 * SOMENTE LEITURA. Nenhuma função aqui escreve na planilha de origem.
 *
 * Roda no Apps Script da planilha de ORIGEM (a de produção), porque só de
 * dentro dela o SpreadsheetApp enxerga as abas. Não faz parte da allowlist de
 * deploy: é ferramenta de migração, executada uma vez, adicionada a
 * mae/.claspignore só enquanto durar a migração.
 *
 * As funções puras (filtrar*, mapear*, montarPacote) não tocam o GAS e são
 * testadas em test/exportador-dados.test.js.
 */

const ABA_BASE = 'BASE DE DADOS';
const ABA_PAGAMENTOS = 'PAGAMENTOS';

// A coluna de ativação de BASE DE DADOS é lida por POSIÇÃO (índice 0) em toda
// a V1 — `Código.js:gerarNovoMesCompleto()`, `sincronizarLooks()`, `setupERP()`.
// Ela não tem nome de cabeçalho estável, então aqui também é posicional.
const COLUNA_ATIVACAO = 0;

function normalizarChave_(valor) {
  return valor === null || valor === undefined ? '' : valor.toString().trim();
}

function estaAtiva_(linha) {
  const bruto = linha[COLUNA_ATIVACAO];
  if (bruto === true) return true;
  return normalizarChave_(bruto).toUpperCase() === 'ON' || normalizarChave_(bruto).toUpperCase() === 'TRUE';
}

function mapaDeCabecalho_(cabecalho) {
  return cabecalho.reduce((mapa, nome, indice) => {
    const chave = normalizarChave_(nome);
    if (chave) mapa[chave] = indice;
    return mapa;
  }, {});
}

function celula_(linha, mapa, nome) {
  return nome in mapa ? linha[mapa[nome]] : '';
}

/**
 * Influenciadora ativa = coluna A em ON/TRUE **e** CUPOM preenchido.
 * Regra fixada pelo usuário em 2026-07-09.
 *
 * BASE DE DADOS é um CADASTRO, não um registro temporal: não tem coluna
 * ANO_REFERENCIA e NÃO deve ser filtrada por ano. Filtrar por ano aqui
 * eliminaria todas as influenciadoras.
 */
function filtrarInfluenciadorasAtivas(valores) {
  if (!valores || valores.length < 2) return { linhas: [], mapa: {}, descartadas: [] };

  const mapa = mapaDeCabecalho_(valores[0]);
  const linhas = [];
  const descartadas = [];

  for (let i = 1; i < valores.length; i++) {
    const linha = valores[i];
    const cupom = normalizarChave_(celula_(linha, mapa, 'CUPOM'));

    if (!estaAtiva_(linha)) {
      if (cupom) descartadas.push({ linha: i + 1, motivo: 'INATIVA', cupom: cupom });
      continue;
    }
    if (!cupom) {
      descartadas.push({ linha: i + 1, motivo: 'SEM_CUPOM', cupom: '' });
      continue;
    }

    linhas.push(linha);
  }

  return { linhas: linhas, mapa: mapa, descartadas: descartadas };
}

/**
 * Pagamento exportável = ANO_REFERENCIA preenchido.
 *
 * Pressupõe que `backfillAnoReferenciaPagamentos()` (Código.js, menu item 11)
 * já rodou. Antes do backfill as linhas antigas têm a célula vazia, e este
 * filtro descartaria exatamente os registros que a migração quer levar.
 *
 * Se a coluna ANO_REFERENCIA não existir no cabeçalho, nada é exportado e o
 * fato é reportado — em vez de exportar tudo em silêncio.
 */
function filtrarPagamentosComAno(valores) {
  if (!valores || valores.length < 2) return { linhas: [], mapa: {}, descartadas: [], colunaAusente: false };

  const mapa = mapaDeCabecalho_(valores[0]);

  if (!('ANO_REFERENCIA' in mapa)) {
    return { linhas: [], mapa: mapa, descartadas: [], colunaAusente: true };
  }

  const linhas = [];
  const descartadas = [];

  for (let i = 1; i < valores.length; i++) {
    const linha = valores[i];
    const temConteudo = linha.some((c) => normalizarChave_(c) !== '');
    if (!temConteudo) continue;

    if (!normalizarChave_(celula_(linha, mapa, 'ANO_REFERENCIA'))) {
      descartadas.push({
        linha: i + 1,
        motivo: 'SEM_ANO_REFERENCIA',
        influKey: normalizarChave_(celula_(linha, mapa, 'INFLU_KEY')),
        mes: normalizarChave_(celula_(linha, mapa, 'MES_REFERENCIA'))
      });
      continue;
    }

    linhas.push(linha);
  }

  return { linhas: linhas, mapa: mapa, descartadas: descartadas, colunaAusente: false };
}

/**
 * BASE DE DADOS → Parceiros_Influenciadoras (docs/spec/SCHEMA_V2.md).
 *
 * `Categoria` não tem origem na V1: nenhuma coluna corresponde. Sai vazia e
 * entra em `inconsistencias`. Não se inventa valor de negócio.
 */
function mapearParceiros(linhas, mapa) {
  return linhas.map((linha) => ({
    ID_Influenciadora: normalizarChave_(celula_(linha, mapa, 'INFLU_KEY')),
    Nome: normalizarChave_(celula_(linha, mapa, 'INFLUENCIADORA_RAZAO_SOCIAL')),
    Status_Contrato: 'ATIVO',
    Categoria: '',
    _origem: {
      CUPOM: normalizarChave_(celula_(linha, mapa, 'CUPOM')),
      EMAIL: normalizarChave_(celula_(linha, mapa, 'EMAIL')),
      INFLUENCIADORA_CNPJ: normalizarChave_(celula_(linha, mapa, 'INFLUENCIADORA_CNPJ'))
    }
  }));
}

/**
 * PAGAMENTOS não tem aba de destino na V2: `SCHEMA_V2.md` define apenas
 * Ativacoes, Ciclos, Parceiros_Influenciadoras e Planos_Colaboracao.
 * Exporta-se fielmente, por nome de cabeçalho, para o importador decidir.
 */
function mapearPagamentos(linhas, mapa) {
  const campos = ['INFLU_KEY', 'MES_REFERENCIA', 'ANO_REFERENCIA', 'STATUS_PAGAMENTO', 'DATA_PAGAMENTO', 'VALOR_TOTAL'];

  return linhas.map((linha) =>
    campos.reduce((registro, campo) => {
      if (campo in mapa) registro[campo] = celula_(linha, mapa, campo);
      return registro;
    }, {})
  );
}

function montarPacote(valoresBase, valoresPagamentos, agora) {
  const base = filtrarInfluenciadorasAtivas(valoresBase);
  const pagamentos = filtrarPagamentosComAno(valoresPagamentos);

  const inconsistencias = [];

  if (pagamentos.colunaAusente) {
    inconsistencias.push({
      gravidade: 'BLOQUEIA',
      onde: ABA_PAGAMENTOS,
      mensagem: 'Coluna ANO_REFERENCIA ausente. Rode backfillAnoReferenciaPagamentos() (menu item 11) antes de exportar.'
    });
  }

  if (pagamentos.descartadas.length) {
    inconsistencias.push({
      gravidade: 'ATENCAO',
      onde: ABA_PAGAMENTOS,
      mensagem: `${pagamentos.descartadas.length} linha(s) sem ANO_REFERENCIA foram descartadas. Se o backfill já rodou, são registros sem data aproveitável.`
    });
  }

  const parceiros = mapearParceiros(base.linhas, base.mapa);

  if (parceiros.length) {
    inconsistencias.push({
      gravidade: 'ATENCAO',
      onde: 'Parceiros_Influenciadoras',
      mensagem: 'Campo Categoria exportado vazio: não existe coluna correspondente em BASE DE DADOS.'
    });
  }

  const semNome = parceiros.filter((p) => !p.Nome).length;
  if (semNome) {
    inconsistencias.push({
      gravidade: 'ATENCAO',
      onde: 'Parceiros_Influenciadoras',
      mensagem: `${semNome} parceira(s) ativa(s) sem INFLUENCIADORA_RAZAO_SOCIAL.`
    });
  }

  return {
    geradoEm: agora,
    origem: { abas: [ABA_BASE, ABA_PAGAMENTOS], observacao: 'Abas legado não são lidas.' },
    parceiros: parceiros,
    pagamentos: mapearPagamentos(pagamentos.linhas, pagamentos.mapa),
    descartados: {
      influenciadoras: base.descartadas,
      pagamentos: pagamentos.descartadas
    },
    inconsistencias: inconsistencias
  };
}

/** Entrada do Apps Script. Lê, monta e devolve o JSON. Não escreve nada. */
function exportarDadosLimpos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const abaBase = ss.getSheetByName(ABA_BASE);
  const abaPagamentos = ss.getSheetByName(ABA_PAGAMENTOS);

  if (!abaBase) throw new Error(`Aba "${ABA_BASE}" não encontrada.`);
  if (!abaPagamentos) throw new Error(`Aba "${ABA_PAGAMENTOS}" não encontrada.`);

  const pacote = montarPacote(
    abaBase.getDataRange().getValues(),
    abaPagamentos.getDataRange().getValues(),
    new Date().toISOString()
  );

  const json = JSON.stringify(pacote, null, 2);
  console.log(json);
  return json;
}
/**
 * Importador de Dados V2
 * Coloque o conteúdo do seu JSON dentro da função abaixo ou 
 * carregue-o via Script Properties se for muito grande.
 */
function importarDadosParaV2() {
  const jsonString = '{ /* COLE SEU JSON AQUI */ }'; 
  const dados = JSON.parse(jsonString);
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Exemplo de inserção na aba Ativacoes
  if (dados.ativacoes) {
    const aba = ss.getSheetByName('Ativacoes');
    const headers = ["ID", "Data", "Status"]; // Ajuste conforme seu schema
    aba.getRange(2, 1, dados.ativacoes.length, headers.length)
       .setValues(dados.ativacoes.map(item => [item.id, item.data, item.status]));
  }
  
  Logger.log("Importação concluída com sucesso.");
}
