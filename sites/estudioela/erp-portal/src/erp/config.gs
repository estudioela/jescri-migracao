/**
 * Configurações compartilhadas do ERP: IDs de planilhas/pastas e mapeamento
 * de colunas. Usado por todos os arquivos .gs do projeto (escopo global do
 * Apps Script).
 */

const SCRIPT_PROP_PASTA_RAIZ = "PASTA_RAIZ_ENTREGAS";
const PASTA_MAE_ID = "1X7BSY9R7dUUNYXgYnmnCIACVMFcqBUPH";

// Planilhas usadas pelo sincronizador (Mãe -> Portal)
const ID_PLANILHA_MAE    = "1ZKqrmz80oOaU70gcHeIgr-yK9zeJ_5YkE8b5CKkuRdM";
const ABA_MAE            = "BASE DE DADOS";
const ID_PLANILHA_PORTAL = "1289Eu3hk-L3GnHbNwAfxgHy3UfVnjfB0LnlHEMoOg1M";
const ABA_PORTAL         = "BASE DE APOIO";

// Abas de histórico geradas por script na Mãe, só leitura no Portal.
const ABAS_HISTORICO = [
  "HISTÓRICO DE CONTEÚDOS",
  "HISTÓRICO DE PAGAMENTOS"
];

// ======================================================
// MAPEAMENTO DE COLUNAS
// ======================================================
const MAP = {
  BASE: {
    NOME_ABA: "BASE DE APOIO", // Corrigido: era "BASE", a aba real se chama "BASE DE APOIO"
    INFLU_KEY: 2, // B (faltava, quebrava getInfluKeyByCupom)
    CUPOM: 3, // C
    NOME: 4, // D
    EMAIL: 5, // E
    CHAVE_PIX: 6, // F
    CNPJ: 7, // G
    CEP: 8, // H
    RUA: 9, // I
    NUMERO: 10, // J
    COMPLEMENTO: 11, // K
    CIDADE: 13, // M
    UF: 14, // N
    VALOR: 16, // P - VALOR_TOTAL (faltava, quebrava getPerfil)
    ID_PASTA_DRIVE: 32 // AF (Nova coluna, livre. A planilha real usa até a coluna 31 hoje;
                        // era 25, que colidia com CIDADE_ASSINATURA já existente)
  },
  ATIVACOES: {
    NOME_ABA: "ATIVAÇÕES",
    INFLU_KEY: 1, // A
    MES: 2, // B
    FORMATO: 3, // C
    DATA_APROVACAO: 4, // D
    DATA_ATIVACAO: 5, // E
    STATUS: 6, // F
    LINK_ARQUIVO: 7 // G (Nova coluna)
  },
  PAGAMENTOS: {
    NOME_ABA: "PAGAMENTOS",
    INFLU_KEY: 1, // A
    MES: 2, // B
    VALOR: 3, // C
    STATUS: 5, // E
    DATA_PAGAMENTO: 6 // F
  },
  BRIEFING: {
    NOME_ABA: "BRIEFING",
    INFLU_KEY: 1, // A
    CUPOM: 2, // B
    MES: 3, // C
    RESUMO: 4, // D
    // Mapeamento dinâmico baseado no formato
  },
  HISTORICO_CONT: {
    NOME_ABA: "HISTÓRICO DE CONTEÚDOS",
    INFLU_KEY: 1,
    MES: 2,
    FORMATO: 3,
    DATA_APROVACAO: 4,
    DATA_ATIVACAO: 5,
    STATUS: 6
  },
  HISTORICO_PAG: {
    NOME_ABA: "HISTÓRICO DE PAGAMENTOS",
    INFLU_KEY: 1,
    MES: 2,
    VALOR: 3,
    STATUS: 5,
    DATA_PAGAMENTO: 6
  }
};
