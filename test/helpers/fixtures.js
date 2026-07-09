/**
 * Fixtures de linhas de planilha (BASE DE DADOS, ATIVAÇÕES) compartilhadas
 * entre arquivos de teste. Extraído depois de aparecer duplicado nos testes
 * de autenticação e de envio de material — não é infraestrutura antecipada.
 *
 * BASE DE DADOS (2026-07-07): migrada de índice fixo para getHeaderMap()
 * (ver mae/WebApp.js MAP.BASE) — a linha de cabeçalho agora precisa ter os
 * nomes reais de coluna (confirmados em mae/Código.js onFormSubmit/
 * gerarNovoMesCompleto, que já liam/escreviam essas mesmas colunas por
 * nome), não mais um array de posições em branco. HEADER_BASE documenta a
 * ordem "de produção" só por realismo — getHeaderMap() resolve por nome,
 * então a ordem em si não é significativa para o código testado.
 */
const HEADER_BASE = [
  'STATUS', 'INFLU_KEY', 'CUPOM', 'INFLUENCIADORA_RAZAO_SOCIAL', 'EMAIL',
  'CHAVE_PIX', 'INFLUENCIADORA_CNPJ', 'CEP', 'RUA', 'NUMERO', 'COMPLEMENTO',
  'BAIRRO', 'CIDADE', 'UF', 'VALOR_TOTAL'
];

function colBase(nome) { return HEADER_BASE.indexOf(nome) + 1; }

function linhaBase(dados) {
  dados = dados || {};
  return [
    dados.status || 'ON',
    dados.influKey,
    dados.cupom,
    dados.nome,
    dados.email || '',
    dados.chavePix || '',
    dados.cnpj || '',
    dados.cep || '',
    dados.rua || '',
    dados.numero || '',
    dados.complemento || '',
    dados.bairro || '',
    dados.cidade || '',
    dados.uf || '',
    dados.valor || 0
  ];
}

const INFLUENCIADORA_PADRAO = {
  influKey: 'MARIA INFLUENCER', cupom: 'MARIA10', nome: 'Maria Influencer',
  cnpj: '12345678000199' // senha esperada: 5 primeiros dígitos = "12345"
};

const HEADER_ATIVACOES = ['ID', 'INFLU_KEY', 'MES_REFERENCIA', 'ANO_REFERENCIA', 'FORMATO', 'DATA_APROVACAO', 'DATA_ATIVACAO', 'STATUS_CONTEUDO', 'LINK_ARQUIVO'];

function linhaAtivacao(dados) {
  dados = dados || {};
  return [
    dados.id,
    dados.influKey || INFLUENCIADORA_PADRAO.influKey,
    dados.mes || 'JULHO',
    dados.ano || 2026,
    dados.formato || 'REEL',
    dados.dataAprovacao || '',
    dados.dataAtivacao || '',
    dados.status || 'em aberto',
    dados.link || ''
  ];
}

module.exports = { HEADER_BASE, colBase, linhaBase, INFLUENCIADORA_PADRAO, HEADER_ATIVACOES, linhaAtivacao };
