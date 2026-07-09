/**
 * Testes das funções puras de mae/SchemaExporter.js.
 *
 * Contexto (docs/auditoria/06_inteligencia_operacional.md §5.1, §5.5): nenhum
 * arquivo de test/ carregava SchemaExporter.js. São ~120 linhas de lógica pura
 * — calcularHashEstado, formatarValorParaJson, gerarMarkdownDoSchema,
 * normalizarCabecalhoIntegridade — testáveis sem um único mock de planilha.
 *
 * O teste de equivalência com getHeaderMap() (INT-06) é o mais importante do
 * arquivo: as duas funções normalizam cabeçalho e PRECISAM concordar, mas estão
 * escritas de formas diferentes. getHeaderMap (Código.js) usa os escapes
 * unicode no range de combinantes; normalizarCabecalhoIntegridade
 * (SchemaExporter.js) escreve esse mesmo range com os caracteres combinantes
 * LITERAIS no source — bytes invisíveis num editor. Semanticamente o intervalo
 * é o mesmo hoje. Se um linter, um editor ou um canal de cópia perder esses
 * bytes, o checklist de integridade passa a reportar falso positivo em toda
 * coluna acentuada — e o mecanismo que existe para detectar drift vira a fonte
 * do alarme. Este teste falha antes disso chegar em produção.
 */
const path = require('path');
const crypto = require('crypto');
const { loadGasModule, loadGasFiles } = require('./helpers/loadGasModule');
const { criarAbaFake } = require('./helpers/gasServiceMocks');

const SCHEMA_PATH = path.join(__dirname, '..', 'mae', 'SchemaExporter.js');
const CODIGO_PATH = path.join(__dirname, '..', 'mae', 'Código.js');

// GAS devolve bytes COM SINAL (-128..127) de Utilities.computeDigest — é por
// isso que calcularHashEstado faz `b < 0 ? b + 256 : b`. O fake reproduz isso;
// um fake com bytes não-assinados nunca exercitaria esse ramo.
function criarUtilitiesComDigest() {
  return {
    DigestAlgorithm: { SHA_256: 'SHA_256' },
    computeDigest(_algoritmo, texto) {
      const digest = crypto.createHash('sha256').update(texto, 'utf8').digest();
      return Array.from(digest).map((b) => (b > 127 ? b - 256 : b));
    },
    formatDate(date, _tz, _pattern) {
      const dia = String(date.getDate()).padStart(2, '0');
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      return `${dia}/${mes}/${date.getFullYear()} ${hh}:${mm}`;
    }
  };
}

function carregarSchemaExporter() {
  return loadGasModule(SCHEMA_PATH, { Utilities: criarUtilitiesComDigest() });
}

describe('SchemaExporter — calcularHashEstado', () => {
  const { calcularHashEstado } = carregarSchemaExporter();

  test('produz o SHA-256 hex do JSON das abas', () => {
    const abas = [{ nomeAba: 'BASE DE DADOS', totalColunas: 3 }];
    const esperado = crypto.createHash('sha256').update(JSON.stringify(abas), 'utf8').digest('hex');

    expect(calcularHashEstado(abas)).toBe(esperado);
  });

  test('bytes negativos viram hex de 2 dígitos (sem "-" e sem perder o zero à esquerda)', () => {
    const hash = calcularHashEstado([{ x: 1 }]);

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain('-');
  });

  test('é determinístico e sensível a qualquer mudança estrutural', () => {
    const abas = [{ nomeAba: 'ATIVAÇÕES', totalLinhasDados: 10 }];

    expect(calcularHashEstado(abas)).toBe(calcularHashEstado(abas));
    expect(calcularHashEstado(abas)).not.toBe(
      calcularHashEstado([{ nomeAba: 'ATIVAÇÕES', totalLinhasDados: 11 }])
    );
  });
});

describe('SchemaExporter — formatarValorParaJson', () => {
  const { formatarValorParaJson } = carregarSchemaExporter();

  test('Date vira string dd/MM/yyyy HH:mm', () => {
    expect(formatarValorParaJson(new Date(2026, 6, 9, 14, 30))).toBe('09/07/2026 14:30');
  });

  test('valores não-Date passam intactos (inclusive falsy)', () => {
    expect(formatarValorParaJson('em aberto')).toBe('em aberto');
    expect(formatarValorParaJson(1500)).toBe(1500);
    expect(formatarValorParaJson('')).toBe('');
    expect(formatarValorParaJson(null)).toBeNull();
    expect(formatarValorParaJson(false)).toBe(false);
  });
});

describe('SchemaExporter — normalizarCabecalhoIntegridade', () => {
  const { normalizarCabecalhoIntegridade } = carregarSchemaExporter();

  test('maiúsculas, sem acento, espaço vira underscore', () => {
    expect(normalizarCabecalhoIntegridade(' Status Conteúdo ')).toBe('STATUS_CONTEUDO');
    expect(normalizarCabecalhoIntegridade('Mês de Referência')).toBe('MES_DE_REFERENCIA');
    expect(normalizarCabecalhoIntegridade('ATIVAÇÕES')).toBe('ATIVACOES');
  });

  test('vazio/nulo não lança', () => {
    expect(normalizarCabecalhoIntegridade('')).toBe('');
    expect(normalizarCabecalhoIntegridade(null)).toBe('');
    expect(normalizarCabecalhoIntegridade(undefined)).toBe('');
  });

  test('INT-06: concorda com getHeaderMap() — as duas normalizações não podem divergir', () => {
    // getHeaderMap (Código.js) é a fonte de verdade da resolução por nome. Se
    // esta asserção quebrar, o checklist de integridade passa a acusar colunas
    // que existem. Carrega os dois arquivos no MESMO contexto vm, como o Apps
    // Script faz (namespace global único).
    const sandbox = loadGasFiles([CODIGO_PATH, SCHEMA_PATH], {
      Utilities: criarUtilitiesComDigest()
    });

    const cabecalho = [
      'INFLU_KEY', 'Status Conteúdo', 'MÊS_REFERENCIA', 'ANO_REFERENCIA',
      'Influenciadora Razão Social', 'CHAVE_PIX', 'Endereço', 'UF', 'AÇÕES'
    ];
    const aba = criarAbaFake([cabecalho]);
    const mapa = sandbox.getHeaderMap(aba);

    // Toda chave produzida por getHeaderMap tem que ser exatamente o que
    // normalizarCabecalhoIntegridade produz para o mesmo cabeçalho bruto.
    cabecalho.forEach((bruto) => {
      const chaveSchemaExporter = sandbox.normalizarCabecalhoIntegridade(bruto);
      expect(Object.keys(mapa)).toContain(chaveSchemaExporter);
    });
  });
});

describe('SchemaExporter — gerarMarkdownDoSchema', () => {
  const { gerarMarkdownDoSchema } = carregarSchemaExporter();

  const schemaBase = () => ({
    planilha: '[JESCRI] INFLUÊNCIA 360º',
    versao: { geradoEm: '09/07/2026 10:00', hashEstado: 'abcdef0123456789deadbeef' },
    triggersInstalados: [],
    observacaoTriggers: 'Triggers são globais.',
    integridade: { ok: true, totalProblemas: 0, problemas: [] },
    abas: []
  });

  test('cabeçalho traz nome da planilha e hash truncado em 12 chars', () => {
    const md = gerarMarkdownDoSchema(schemaBase());

    expect(md).toContain('# SYSTEM_SCHEMA — [JESCRI] INFLUÊNCIA 360º');
    expect(md).toContain('hash `abcdef012345…`');
    expect(md).not.toContain('abcdef0123456789deadbeef');
  });

  test('sem triggers instalados, avisa em vez de emitir tabela vazia', () => {
    const md = gerarMarkdownDoSchema(schemaBase());

    expect(md).toContain('_Nenhum trigger instalável encontrado');
    expect(md).not.toContain('| Função | Tipo de evento |');
  });

  test('com triggers, emite uma linha de tabela por trigger', () => {
    const schema = schemaBase();
    schema.triggersInstalados = [
      { funcaoManipuladora: 'onFormSubmit', tipoEvento: 'ON_FORM_SUBMIT', origem: 'SPREADSHEETS' },
      { funcaoManipuladora: 'exportarSchemaAutomatico', tipoEvento: null, origem: null }
    ];
    const md = gerarMarkdownDoSchema(schema);

    expect(md).toContain('| `onFormSubmit` | ON_FORM_SUBMIT | SPREADSHEETS |');
    expect(md).toContain('| `exportarSchemaAutomatico` | - | - |'); // null vira "-"
  });

  test('integridade OK vs. com problemas', () => {
    expect(gerarMarkdownDoSchema(schemaBase())).toContain('✓ Nenhum problema encontrado.');

    const comProblema = schemaBase();
    comProblema.integridade = {
      ok: false,
      totalProblemas: 1,
      problemas: [{ tipo: 'COLUNA_AUSENTE', detalhe: 'CHAVE_PIX em BASE DE DADOS' }]
    };
    const md = gerarMarkdownDoSchema(comProblema);

    expect(md).toContain('⚠️ 1 problema(s) encontrado(s):');
    expect(md).toContain('- **COLUNA_AUSENTE**: CHAVE_PIX em BASE DE DADOS');
  });

  test('aba vazia, sem amostra e sem coluna de status usa os textos de fallback', () => {
    const schema = schemaBase();
    schema.abas = [
      { nomeAba: 'VAZIA', totalColunas: 0, totalLinhasDados: 0, colunas: [], amostraPrimeiraLinha: null, colunasStatus: {} }
    ];
    const md = gerarMarkdownDoSchema(schema);

    expect(md).toContain('## Aba: `VAZIA`');
    expect(md).toContain('_Aba vazia._');
    expect(md).toContain('_Sem dados._');
    expect(md).toContain('_Nenhuma coluna com "STATUS" no nome._');
  });

  test('aba populada lista colunas numeradas, amostra em JSON e valores de status', () => {
    const schema = schemaBase();
    schema.abas = [
      {
        nomeAba: 'ATIVAÇÕES',
        totalColunas: 2,
        totalLinhasDados: 1,
        colunas: ['ID', ''], // coluna sem nome vira "(vazio)"
        amostraPrimeiraLinha: { ID: 'uuid-1' },
        colunasStatus: { STATUS_CONTEUDO: ['em aberto', 'postado'] }
      }
    ];
    const md = gerarMarkdownDoSchema(schema);

    expect(md).toContain('1. `ID`');
    expect(md).toContain('2. `(vazio)`');
    expect(md).toContain('"ID": "uuid-1"');
    expect(md).toContain('- `STATUS_CONTEUDO`: `em aberto`, `postado`');
  });
});
