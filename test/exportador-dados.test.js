/**
 * tools/ExportadorDeDados.js — filtros de migração V1 → V2.
 *
 * A asserção que mais importa: nenhum registro sem ANO_REFERENCIA pode
 * atravessar o filtro de PAGAMENTOS. Foi a célula vazia desses registros que
 * criou o "período fantasma" no seletor do Portal (FIN-01) — migrá-los levaria
 * o bug junto para a V2.
 *
 * A recíproca também é testada: BASE DE DADOS é cadastro, não tem ano, e não
 * pode ser filtrada por ele. Filtrar por ano ali zeraria a exportação.
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');

const EXPORTADOR = path.join(__dirname, '..', 'tools', 'ExportadorDeDados.js');

const modulo = loadGasFiles([EXPORTADOR], {});

const CAB_BASE = ['ATIVO', 'INFLU_KEY', 'CUPOM', 'INFLUENCIADORA_RAZAO_SOCIAL', 'EMAIL', 'INFLUENCIADORA_CNPJ'];
const CAB_PAG = ['INFLU_KEY', 'MES_REFERENCIA', 'ANO_REFERENCIA', 'STATUS_PAGAMENTO', 'DATA_PAGAMENTO', 'VALOR_TOTAL'];

describe('filtrarPagamentosComAno()', () => {
  test('nenhuma linha sem ANO_REFERENCIA atravessa o filtro', () => {
    const valores = [
      CAB_PAG,
      ['k1', 'AGOSTO', 2026, 'pago', '2026-08-10', 500],
      ['k2', 'AGOSTO', '', 'pago', '', 300],       // ano vazio
      ['k3', 'JULHO', null, 'aprovado', '', 200],  // ano null
      ['k4', 'JULHO', '   ', 'pago', '', 100],     // ano só espaços
      ['k5', 'JULHO', 2025, 'pago', '2025-07-02', 150]
    ];

    const r = modulo.filtrarPagamentosComAno(valores);

    expect(r.linhas).toHaveLength(2);
    expect(r.descartadas).toHaveLength(3);
    expect(r.descartadas.every((d) => d.motivo === 'SEM_ANO_REFERENCIA')).toBe(true);

    const anosExportados = r.linhas.map((l) => l[2]);
    expect(anosExportados.every((a) => String(a).trim() !== '')).toBe(true);
  });

  test('linhas em branco no fim da aba não viram descarte nem exportação', () => {
    const valores = [CAB_PAG, ['k1', 'AGOSTO', 2026, 'pago', '', 500], ['', '', '', '', '', '']];

    const r = modulo.filtrarPagamentosComAno(valores);

    expect(r.linhas).toHaveLength(1);
    expect(r.descartadas).toHaveLength(0);
  });

  test('coluna ANO_REFERENCIA ausente não exporta nada — e diz por quê', () => {
    const semAno = ['INFLU_KEY', 'MES_REFERENCIA', 'STATUS_PAGAMENTO'];
    const r = modulo.filtrarPagamentosComAno([semAno, ['k1', 'AGOSTO', 'pago']]);

    expect(r.colunaAusente).toBe(true);
    expect(r.linhas).toHaveLength(0);
  });
});

describe('filtrarInfluenciadorasAtivas()', () => {
  test('ativa = coluna A em ON/TRUE E cupom preenchido', () => {
    const valores = [
      CAB_BASE,
      ['ON', 'k1', 'CUPOM1', 'Fulana', 'f@x.com', '111'],
      [true, 'k2', 'CUPOM2', 'Beltrana', 'b@x.com', '222'],
      ['OFF', 'k3', 'CUPOM3', 'Sicrana', 's@x.com', '333'],  // inativa
      ['ON', 'k4', '', 'Sem Cupom', 'n@x.com', '444'],       // sem cupom
      ['TRUE', 'k5', 'CUPOM5', 'Quinta', 'q@x.com', '555']
    ];

    const r = modulo.filtrarInfluenciadorasAtivas(valores);

    expect(r.linhas.map((l) => l[1])).toEqual(['k1', 'k2', 'k5']);
    expect(r.descartadas.map((d) => d.motivo).sort()).toEqual(['INATIVA', 'SEM_CUPOM']);
  });

  test('não filtra por ano: BASE DE DADOS é cadastro e não tem ANO_REFERENCIA', () => {
    const valores = [CAB_BASE, ['ON', 'k1', 'CUPOM1', 'Fulana', 'f@x.com', '111']];

    expect(CAB_BASE).not.toContain('ANO_REFERENCIA');
    expect(modulo.filtrarInfluenciadorasAtivas(valores).linhas).toHaveLength(1);
  });
});

describe('montarPacote()', () => {
  const valoresBase = [CAB_BASE, ['ON', 'k1', 'CUPOM1', 'Fulana', 'f@x.com', '111']];
  const valoresPag = [CAB_PAG, ['k1', 'AGOSTO', 2026, 'pago', '', 500], ['k2', 'JULHO', '', 'pago', '', 100]];

  test('exporta parceiros no formato de Parceiros_Influenciadoras', () => {
    const p = modulo.montarPacote(valoresBase, valoresPag, '2026-07-09T00:00:00.000Z');

    expect(p.parceiros).toHaveLength(1);
    expect(p.parceiros[0]).toMatchObject({
      ID_Influenciadora: 'k1',
      Nome: 'Fulana',
      Status_Contrato: 'ATIVO',
      Categoria: ''
    });
  });

  test('o pagamento sem ano fica de fora e aparece em descartados', () => {
    const p = modulo.montarPacote(valoresBase, valoresPag, '2026-07-09T00:00:00.000Z');

    expect(p.pagamentos).toHaveLength(1);
    expect(p.pagamentos[0].ANO_REFERENCIA).toBe(2026);
    expect(p.descartados.pagamentos).toHaveLength(1);
    expect(p.descartados.pagamentos[0].influKey).toBe('k2');
  });

  test('Categoria sem origem na V1 é reportada, não inventada', () => {
    const p = modulo.montarPacote(valoresBase, valoresPag, '2026-07-09T00:00:00.000Z');

    expect(p.inconsistencias.some((i) => /Categoria/.test(i.mensagem))).toBe(true);
  });

  test('coluna ANO_REFERENCIA ausente gera inconsistência BLOQUEIA', () => {
    const semAno = [['INFLU_KEY', 'MES_REFERENCIA'], ['k1', 'AGOSTO']];
    const p = modulo.montarPacote(valoresBase, semAno, '2026-07-09T00:00:00.000Z');

    expect(p.inconsistencias.some((i) => i.gravidade === 'BLOQUEIA')).toBe(true);
    expect(p.pagamentos).toHaveLength(0);
  });
});
