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
        falharComCodigo: 'readonly',
        include: 'readonly',
        getConfig: 'readonly',
        CONFIG_KEYS: 'readonly',
        // Fábrica de erro com código de contrato (shared/ErroComCodigo.js),
        // usada pelos Services de Acesso/Conteúdo/Perfil no Portal.
        erroComCodigo: 'readonly',
        // Utilitários físicos de aba compartilhados pelas ACLs (shared/
        // ColunaFisica.js — FASE 1 pós-SPECs: eliminação da duplicação de
        // resolvedorDeColuna/dataParaCanonica/reescrever entre as ACLs).
        criarResolvedorDeColuna: 'readonly',
        celulaParaData: 'readonly',
        reescreverAba: 'readonly',
        // Entidade de domínio referenciada pelo Service (Vertical Slice Parceira).
        Parceira: 'readonly',
        // VOs de domínio referenciados pelo agregado ColaboracaoMensal (SPEC-005).
        MesReferencia: 'readonly',
        CondicaoComercialSnapshot: 'readonly',
        // Agregado reidratado pela ColaboracaoMensalACL (ADR-005).
        ColaboracaoMensal: 'readonly',
        // Domínio do Briefing (SPEC-009): serviço e entidade referenciados
        // pelo agregado Briefing e pela BriefingACL.
        CalculadoraDeAprovacao: 'readonly',
        BlocoDeFormato: 'readonly',
        Briefing: 'readonly',
        BriefingACL: 'readonly',
        BriefingRepository: 'readonly',
        BriefingService: 'readonly',
        BriefingController: 'readonly',
        // Domínio do Envio (SPEC-016): VOs, camadas e Controller referenciados
        // pelo agregado e pela composição do Entrypoint.
        CodigoRastreio: 'readonly',
        EnderecoDeEntrega: 'readonly',
        Envio: 'readonly',
        EnvioACL: 'readonly',
        EnvioRepository: 'readonly',
        EnvioService: 'readonly',
        EnvioController: 'readonly',
        // Domínio da Entrega (SPEC-012): VOs referenciados pelo agregado.
        IdentificadorDeEntrega: 'readonly',
        LinkDoMaterial: 'readonly',
        Entrega: 'readonly',
        EntregaACL: 'readonly',
        EntregaRepository: 'readonly',
        EntregaService: 'readonly',
        EntregaController: 'readonly',
        // Domínio da Geração de Documentos (SPEC-023): VOs, entidade,
        // camadas e Controller referenciados pelo Service e pela composição.
        CamposDeMesclagem: 'readonly',
        Documento: 'readonly',
        DocumentoACL: 'readonly',
        DocumentoRepository: 'readonly',
        GeradorDeDocumentosTexto: 'readonly',
        DocumentoService: 'readonly',
        DocumentoController: 'readonly',
        // Serviços globais do Apps Script usados pela composição do Acesso.
        Utilities: 'readonly',
        LockService: 'readonly',
        // Domínio do Acesso ao Portal (SPEC-025): VOs, agregado, porta e
        // camadas referenciados pelo Service e pela composição.
        Credencial: 'readonly',
        TokenDeSessao: 'readonly',
        JanelaDeBloqueio: 'readonly',
        Sessao: 'readonly',
        Autenticador: 'readonly',
        SessaoACL: 'readonly',
        BloqueioACL: 'readonly',
        VerificadorDeCredencialLegado: 'readonly',
        SessaoRepository: 'readonly',
        BloqueioRepository: 'readonly',
        AcessoPortalService: 'readonly',
        AcessoController: 'readonly',
        // Domínio do Conteúdo no Portal (SPEC-027): VO de projeção, Service e
        // Controller referenciados pela composição (fachada sem agregado
        // próprio — §6.2/§6.4).
        ItemDePendencia: 'readonly',
        PortalDeConteudoService: 'readonly',
        PortalDeConteudoController: 'readonly',
        // Domínio do Perfil no Portal (SPEC-032): VOs, adaptador de CEP,
        // Service e Controller referenciados pela composição (fachada sem
        // agregado próprio, mesma natureza da SPEC-027).
        PIX: 'readonly',
        Endereco: 'readonly',
        AdaptadorDeCepBrasilApi: 'readonly',
        PerfilPortalService: 'readonly',
        PerfilPortalController: 'readonly',
        // Domínio da Gestão de Pagamentos (SPEC-020): agregado, camadas e
        // Controller referenciados pelo Service e pela composição.
        ObrigacaoFinanceira: 'readonly',
        PagamentoACL: 'readonly',
        PagamentoRepository: 'readonly',
        PagamentoService: 'readonly',
        PagamentoController: 'readonly',
        // Domínio do Financeiro e Histórico no Portal (SPEC-030): VOs de
        // projeção, fachada e Controller referenciados pela composição.
        ResumoFinanceiro: 'readonly',
        ItemDeHistorico: 'readonly',
        PortalFinanceiroService: 'readonly',
        PortalFinanceiroController: 'readonly',
        // Domínio da Importação Inicial da Base (SPEC-003): VO, ACLs, Service
        // e Controller referenciados pela composição.
        ChaveInfluenciadora: 'readonly',
        LegadoACL: 'readonly',
        ImportadorService: 'readonly',
        ImportacaoController: 'readonly',
        // Classes da fatia compostas pelo Entrypoint Portal (namespace único GAS).
        ParceiraACL: 'readonly',
        ParceiraRepository: 'readonly',
        CadastrarParceiraService: 'readonly',
        ParceiraController: 'readonly',
        ColaboracaoMensalACL: 'readonly',
        ColaboracaoMensalRepository: 'readonly',
        CompiladorDoMes: 'readonly',
        ColaboracaoMensalController: 'readonly',
        // Domínio do Arquivamento (SPEC-034): Service e Controller
        // referenciados pela composição (sem entidade de domínio nova —
        // reaproveita dataArquivamento/Object.freeze já existentes em
        // Entrega/Envio/ObrigacaoFinanceira/ColaboracaoMensal).
        ArquivamentoService: 'readonly',
        ArquivamentoController: 'readonly',
        // Domínio de Identidade e Acesso — M-ID (SPEC-035): agregado,
        // adaptador, ACLs/Repository, Service e Controller referenciados
        // pela composição. Reaproveita Sessao/TokenDeSessao/SessaoRepository/
        // AcessoPortalService/AcessoController de SPEC-025 (§9.2-A) — sem
        // globais novos para esse eixo.
        Usuario: 'readonly',
        ValidadorDeTokenGoogle: 'readonly',
        UsuarioACL: 'readonly',
        AdministradorACL: 'readonly',
        UsuarioRepository: 'readonly',
        UsuarioService: 'readonly',
        UsuarioController: 'readonly',
        // ADR-013 (OAuth Authorization Code Flow): adapters e serviços
        // Google tocados exclusivamente pela composição do entrypoint.
        AdaptadorOAuthGoogle: 'readonly',
        GuardiaoDeEstadoOAuth: 'readonly',
        ScriptApp: 'readonly',
        CacheService: 'readonly',
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
    ],
  },
];
