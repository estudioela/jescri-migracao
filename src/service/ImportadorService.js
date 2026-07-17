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
