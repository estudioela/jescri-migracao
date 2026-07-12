/* ═══════════════════════════════════════════════════════════════════════════
   Repositories.js — Camada de acesso a dados do TEAR V2.

   Responsabilidade única: ser o ÚNICO ponto que toca a planilha e traduzir
   "Linha da Planilha" → "Objeto de Domínio", delegando a tradução de colunas à
   ACL.js. NÃO contém regra de negócio (nada de prazos, cálculos, elegibilidade).

   Fonte de dados (seam único com a planilha):
   - Apps Script: usa `SpreadsheetApp` automaticamente.
   - node/teste: injete uma fonte com `lerAba(nome) -> { cabecalho, linhas }`.

   Fail-fast (ADR-001): cabeçalho/coluna ausente ou linha inconsistente → erro
   descritivo imediato. Depende de ACL.js carregada no mesmo escopo global
   (`COLUNAS_BASE_DE_DADOS`, `lerParceiraDaBase`, `normalizarChave`).
   ═══════════════════════════════════════════════════════════════════════════ */

const ABA_BASE_DE_DADOS = 'BASE DE DADOS';

/** Fonte padrão em Apps Script. Fora do GAS, exige injeção explícita. */
function _fontePadraoDaPlanilha() {
  if (typeof SpreadsheetApp === 'undefined') {
    throw new Error(
      'ParceiroRepository: sem fonte de dados. Em Apps Script o SpreadsheetApp é ' +
      'usado automaticamente; fora dele, injete uma fonte com lerAba(nomeAba).'
    );
  }
  return {
    lerAba: function (nomeAba) {
      const aba = SpreadsheetApp.getActive().getSheetByName(nomeAba);
      if (!aba) {
        throw new Error('ParceiroRepository: aba não encontrada na planilha: "' + nomeAba + '".');
      }
      const valores = aba.getDataRange().getValues();
      const cabecalho = valores.shift() || [];
      return { cabecalho: cabecalho, linhas: valores };
    }
  };
}

class ParceiroRepository {
  constructor(fonte) {
    this.fonte = fonte || null;
  }

  _fonte() {
    return this.fonte || (this.fonte = _fontePadraoDaPlanilha());
  }

  /**
   * Lê a aba BASE DE DADOS e devolve objetos de domínio (via ACL). Ignora linhas
   * em branco (sem INFLU_KEY) — não são registros. Sem qualquer regra de negócio.
   */
  _carregarParceiras() {
    const dados = this._fonte().lerAba(ABA_BASE_DE_DADOS);
    const cabecalho = dados && dados.cabecalho;
    const linhas = (dados && dados.linhas) || [];

    if (!Array.isArray(cabecalho) || cabecalho.length === 0) {
      throw new Error('ParceiroRepository: cabeçalho ausente na aba "' + ABA_BASE_DE_DADOS + '".');
    }

    const idxChave = cabecalho.indexOf(COLUNAS_BASE_DE_DADOS.chave);
    if (idxChave === -1) {
      throw new Error(
        'ParceiroRepository: coluna de identidade "' + COLUNAS_BASE_DE_DADOS.chave +
        '" ausente na aba "' + ABA_BASE_DE_DADOS + '".'
      );
    }

    const parceiras = [];
    linhas.forEach(function (linha) {
      const bruto = linha[idxChave];
      if (bruto === null || bruto === undefined || String(bruto).trim() === '') {
        return; // linha em branco: sem identidade, não é registro
      }
      const objetoLinha = {};
      cabecalho.forEach(function (coluna, i) {
        if (coluna !== '' && coluna !== null && coluna !== undefined) {
          objetoLinha[coluna] = linha[i];
        }
      });
      parceiras.push(lerParceiraDaBase(objetoLinha)); // ACL: Linha → Domínio
    });

    return parceiras;
  }

  /** Parceiras com status 'ON' (canônico 'Ativa', já coagido pela ACL). */
  listarParceirasAtivas() {
    return this._carregarParceiras().filter(function (parceira) {
      return parceira.status === 'Ativa';
    });
  }

  /** Localiza uma parceira pela chave, com a mesma normalização da ACL. */
  buscarPorChave(influKey) {
    const alvo = normalizarChave(influKey);
    if (!alvo) {
      throw new Error('ParceiroRepository.buscarPorChave: chave vazia.');
    }
    return this._carregarParceiras().find(function (parceira) {
      return normalizarChave(parceira.chave) === alvo;
    }) || null;
  }
}
