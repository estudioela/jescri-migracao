/* ═══════════════════════════════════════════════════════════════════════════
   ACL.js — Camada Anticorrupção do TEAR V2.

   Responsabilidade única: traduzir uma LINHA FÍSICA da planilha (objeto cru,
   chaveado pelos nomes de coluna) em um OBJETO DE DOMÍNIO limpo. Este é o único
   ponto do sistema que conhece a grafia das colunas (DOMAIN_MODEL_V2 §5).

   Código puro: sem SpreadsheetApp, sem I/O. Fail-fast (ADR-001): dado fora do
   contrato estoura erro imediato — não é aceito nem corrigido em silêncio.

   Escopo desta entrega: apenas BASE DE DADOS → Parceira. Sem Value Objects por
   antecipação; eles nascerão quando encapsularem uma regra real.
   ═══════════════════════════════════════════════════════════════════════════ */

/* Mapa domínio → coluna física (BASE DE DADOS). Campos de formatação/infra
   (…_EXTENSO, SIM/NÃO, …_SHEET_URL) não entram: não são conceito de negócio. */
const COLUNAS_BASE_DE_DADOS = Object.freeze({
  chave: 'INFLU_KEY',
  status: 'STATUS',
  cupom: 'CUPOM',
  razaoSocial: 'INFLUENCIADORA_RAZAO_SOCIAL',
  email: 'EMAIL',
  pix: 'CHAVE_PIX',
  cnpj: 'INFLUENCIADORA_CNPJ',
  endereco: 'INFLUENCIADORA_ENDERECO',
  valorTotal: 'VALOR_TOTAL',
  reels: 'REELS_TEXTO',
  carrossel: 'CARROSSEL_TEXTO',
  stories: 'STORIES_TEXTO',
  looksQtd: 'LOOKS_QTD',
  pastaDrive: 'PASTA_DRIVE_LINK'
});

/* Normalização canônica de identidade (INFLU_KEY): remove acentos, colapsa
   espaços e ignora caixa. Resolve o descompasso físico das chaves entre abas
   (DOMAIN_MODEL_V2 §5.1) num ponto único. Pública: o repositório a usa para
   comparar chaves sem reimplementar a regra. */
function normalizarChave(valor) {
  return String(valor === null || valor === undefined ? '' : valor)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/* Status da Parceira: única regra de negócio da BASE nesta entrega. Domínio
   fechado (ADR-001 §2.1); cru → canônico, insensível a caixa; desconhecido = erro. */
const _STATUS_PARCEIRA = Object.freeze({ on: 'Ativa', off: 'Inativa' });

function _coagirStatusParceira(cru) {
  const chave = String(cru === null || cru === undefined ? '' : cru).trim().toLowerCase();
  const canonico = _STATUS_PARCEIRA[chave];
  if (!canonico) {
    throw new Error('ACL BASE DE DADOS: STATUS desconhecido "' + cru + '" (aceitos: ON, OFF).');
  }
  return canonico;
}

/* Lê uma coluna exigindo que ela exista na linha física. Uma coluna ausente
   (renomeada/removida na planilha) falha alto e localizada, nunca em silêncio. */
function _celula(linha, colunaFisica) {
  if (!linha || typeof linha !== 'object' || !(colunaFisica in linha)) {
    throw new Error('ACL BASE DE DADOS: coluna ausente na linha física: "' + colunaFisica + '".');
  }
  const valor = linha[colunaFisica];
  return valor === null || valor === undefined ? '' : String(valor).trim();
}

/**
 * Converte uma linha da aba BASE DE DADOS em um objeto de domínio Parceira.
 * Espera `linha` já chaveada pelos nomes de coluna (produzida pela leitura de
 * cabeçalho). Linhas em branco (sem INFLU_KEY) devem ser filtradas antes —
 * ainda assim, uma chave vazia aqui é erro (defesa de identidade).
 */
function lerParceiraDaBase(linha) {
  const M = COLUNAS_BASE_DE_DADOS;

  const chave = _celula(linha, M.chave);
  if (!chave) {
    throw new Error('ACL BASE DE DADOS: INFLU_KEY vazia — linha sem identidade de parceira.');
  }

  return {
    chave: chave,
    status: _coagirStatusParceira(_celula(linha, M.status)),
    cupom: _celula(linha, M.cupom),
    razaoSocial: _celula(linha, M.razaoSocial),
    email: _celula(linha, M.email),
    pix: _celula(linha, M.pix),
    cnpj: _celula(linha, M.cnpj),
    endereco: _celula(linha, M.endereco),
    valorTotal: _celula(linha, M.valorTotal),
    entregaveis: {
      reels: _celula(linha, M.reels),
      carrossel: _celula(linha, M.carrossel),
      stories: _celula(linha, M.stories)
    },
    looksQtd: _celula(linha, M.looksQtd),
    pastaDrive: _celula(linha, M.pastaDrive)
  };
}
