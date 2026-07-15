// ESLint 9 (flat config). Lint local da fundação — pipeline `npm run lint`.
'use strict';

module.exports = [
  {
    // Código de produção NOVO (Sprint 0), sob src/. Runtime V8 do Apps Script.
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'script',
      globals: {
        // Serviços globais do Apps Script.
        SpreadsheetApp: 'readonly',
        HtmlService: 'readonly',
        PropertiesService: 'readonly',
        UrlFetchApp: 'readonly',
        DriveApp: 'readonly',
        Logger: 'readonly',
        console: 'readonly',
        // Ponte opcional para o harness de teste.
        module: 'writable',
        // Globais de primeira-parte (GAS tem namespace único entre arquivos).
        envelopeOk: 'readonly',
        envelopeFail: 'readonly',
        include: 'readonly',
        getConfig: 'readonly',
        CONFIG_KEYS: 'readonly',
        // Entidade de domínio referenciada pelo Service (Vertical Slice Parceira).
        Parceira: 'readonly',
        // VOs de domínio referenciados pelo agregado ColaboracaoMensal (SPEC-005).
        MesReferencia: 'readonly',
        CondicaoComercialSnapshot: 'readonly',
        // Agregado reidratado pela ColaboracaoMensalACL (ADR-005).
        ColaboracaoMensal: 'readonly',
        // Classes da fatia compostas pelo Entrypoint Portal (namespace único GAS).
        ParceiraACL: 'readonly',
        ParceiraRepository: 'readonly',
        CadastrarParceiraService: 'readonly',
        ParceiraController: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
    },
  },
  {
    // Testes e ferramentas rodam em Node.
    files: ['test/**/*.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'writable',
        __dirname: 'readonly',
        process: 'readonly',
        console: 'readonly',
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
    },
  },
  {
    // Fora do escopo do Sprint 0: legado da raiz migra para src/ em M1 (ADR-004);
    // docs/dados não são código de aplicação.
    ignores: [
      'node_modules/**',
      'coverage/**',
      'docs/**',
      'CONHECIMENTO/**',
      'ACL.js',
      'Repositories.js',
    ],
  },
];
