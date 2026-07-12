/**
 * Funil de cadastro (Google Forms → aba CADASTROS → Parceiros_Influenciadoras).
 *
 * Cobre:
 *  - transform puro `parceiroDeCadastro_` (leitura tolerante a acento/caixa/
 *    pontuação nos títulos; endereço no padrão Autocrat, em caixa alta);
 *  - enriquecimento de endereço por CEP (`buscarCepMultiAPI` + normalizadores);
 *  - upsert SEGURO de `ParceiroService.registrarCadastro`.
 *
 * O Jest roda sem `UrlFetchApp`, então `buscarCepMultiAPI` devolve null e o
 * endereço degrada graciosamente — o cadastro nunca se perde por causa do CEP.
 */
const path = require('path');
const { loadGasFiles } = require('./helpers/loadGasModule');

const RAIZ = path.join(__dirname, '..');
const arquivo = (nome) => path.join(RAIZ, 'tear', nome);

const exportados = [
  'parceiroDeCadastro_', 'ParceiroService', 'CAMPOS_PARCEIRO', 'buscarCepMultiAPI',
  '_montarEnderecoFormatado_', '_formatarCep_',
  '_normViaCep_', '_normBrasilApi_', '_normAwesomeApi_', '_normOpenCep_'
];

const {
  parceiroDeCadastro_, ParceiroService, CAMPOS_PARCEIRO, buscarCepMultiAPI,
  _montarEnderecoFormatado_, _formatarCep_,
  _normViaCep_, _normBrasilApi_, _normAwesomeApi_, _normOpenCep_
} = loadGasFiles(
  ['Infra.js', 'Modelos.js', 'Repositories.js', 'Services.js'].map(arquivo),
  { console: { warn() {}, error() {}, log() {} } },
  exportados
);

// Respostas cruas do formulário — títulos LITERAIS das perguntas do Google Forms
// (com parênteses e reticências) para provar que a normalização casa com eles.
const RESPOSTA = {
  'como prefere ser chamada (pode ser apelido + sobrenome, por exemplo)': ' Dani Perrut ',
  'razão social': 'Daniela Perrut ME',
  'Rua': 'Rua das Flores',
  'número (prédio, casa, condomínio...)': '120',
  'complemento (se houver: bloco, torre, apto...)': 'Apto 3',
  'CEP': '01000-000'
};

// Endereço resolvido pelo CEP (o que buscarCepMultiAPI devolveria em produção).
const ENDERECO_API = { logradouro: 'Rua Queluz', bairro: 'Bom Pastor', localidade: 'Divinópolis', uf: 'MG' };
const RESPOSTA_MG = Object.assign({}, RESPOSTA, {
  'número (prédio, casa, condomínio...)': '450',
  'complemento (se houver: bloco, torre, apto...)': 'APTO 202',
  'CEP': '35500-166'
});

describe('parceiroDeCadastro_ (transform puro)', () => {
  test('com endereço do CEP: monta o padrão EXATO do Autocrat em caixa alta', () => {
    const p = parceiroDeCadastro_(RESPOSTA_MG, ENDERECO_API);

    expect(p[CAMPOS_PARCEIRO.ID]).toBe('DANI PERRUT'); // trim das pontas + caixa alta
    expect(p[CAMPOS_PARCEIRO.NOME]).toBe('Daniela Perrut ME');
    expect(p['Endereço_Formatado'])
      .toBe('RUA QUELUZ, 450, APTO 202, BOM PASTOR - DIVINÓPOLIS/MG, 35500-166');
  });

  test('sem complemento (com CEP): não deixa vírgula sobressalente', () => {
    const semComplemento = Object.assign({}, RESPOSTA_MG, {
      'complemento (se houver: bloco, torre, apto...)': ''
    });
    expect(parceiroDeCadastro_(semComplemento, ENDERECO_API)['Endereço_Formatado'])
      .toBe('RUA QUELUZ, 450, BOM PASTOR - DIVINÓPOLIS/MG, 35500-166');
  });

  test('sem endereço do CEP (APIs fora do ar): degrada com o que veio no Forms', () => {
    const p = parceiroDeCadastro_(RESPOSTA, null);
    expect(p['Endereço_Formatado']).toBe('RUA DAS FLORES, 120, APTO 3, 01000-000');
  });

  test('sem razão social, o Nome cai para o apelido — nunca vazio', () => {
    const semRazao = Object.assign({}, RESPOSTA, { 'razão social': '' });
    expect(parceiroDeCadastro_(semRazao)[CAMPOS_PARCEIRO.NOME]).toBe('DANI PERRUT');
  });

  test('sem apelido (sem chave primária) devolve null — nada a gravar', () => {
    const semApelido = Object.assign({}, RESPOSTA, {
      'como prefere ser chamada (pode ser apelido + sobrenome, por exemplo)': '  '
    });
    expect(parceiroDeCadastro_(semApelido)).toBeNull();
  });
});

describe('_formatarCep_', () => {
  test('8 dígitos crus viram XXXXX-XXX', () => {
    expect(_formatarCep_('35500166')).toBe('35500-166');
  });
  test('já mascarado é preservado', () => {
    expect(_formatarCep_('35500-166')).toBe('35500-166');
  });
  test('tamanho inesperado é devolvido trimado (sem quebrar)', () => {
    expect(_formatarCep_('  123 ')).toBe('123');
  });
});

describe('_montarEnderecoFormatado_ (omite segmentos vazios)', () => {
  test('só cidade/UF, sem bairro: não deixa " - " órfão', () => {
    expect(_montarEnderecoFormatado_({ rua: 'Rua X', numero: '10', cidade: 'Belo Horizonte', uf: 'MG', cep: '30100000' }))
      .toBe('RUA X, 10, BELO HORIZONTE/MG, 30100-000');
  });
  test('endereço mínimo (só número e CEP)', () => {
    expect(_montarEnderecoFormatado_({ numero: '10', cep: '30100000' })).toBe('10, 30100-000');
  });
});

describe('normalizadores de CEP (shapes distintos → forma canônica)', () => {
  test('ViaCEP', () => {
    expect(_normViaCep_({ logradouro: 'Rua Queluz', bairro: 'Bom Pastor', localidade: 'Divinópolis', uf: 'MG' }))
      .toEqual(ENDERECO_API);
  });
  test('ViaCEP com {erro:true} → null', () => {
    expect(_normViaCep_({ erro: true })).toBeNull();
  });
  test('BrasilAPI (street/neighborhood/city/state)', () => {
    expect(_normBrasilApi_({ street: 'Rua Queluz', neighborhood: 'Bom Pastor', city: 'Divinópolis', state: 'MG' }))
      .toEqual(ENDERECO_API);
  });
  test('AwesomeAPI (address/district/city/state)', () => {
    expect(_normAwesomeApi_({ address: 'Rua Queluz', district: 'Bom Pastor', city: 'Divinópolis', state: 'MG' }))
      .toEqual(ENDERECO_API);
  });
  test('OpenCEP (shape ViaCEP)', () => {
    expect(_normOpenCep_({ logradouro: 'Rua Queluz', bairro: 'Bom Pastor', localidade: 'Divinópolis', uf: 'MG' }))
      .toEqual(ENDERECO_API);
  });
});

describe('buscarCepMultiAPI (guardas sem rede)', () => {
  test('CEP com tamanho inválido → null (nem tenta rede)', () => {
    expect(buscarCepMultiAPI('123')).toBeNull();
  });
  test('sem UrlFetchApp (ambiente Jest) → null, sem lançar', () => {
    expect(buscarCepMultiAPI('35500-166')).toBeNull();
  });
});

// Fake mínimo do ParceiroRepository: captura o payload e a chave do upsert.
function repositorioFalso(existentePorId) {
  const existentes = existentePorId || {};
  const chamadas = [];
  return {
    chamadas,
    getById: (id) => existentes[id] || null,
    upsert: (dados, chave) => {
      chamadas.push({ dados, chave });
      return { chave: dados[chave], criado: !existentes[dados[chave]] };
    }
  };
}

describe('ParceiroService.registrarCadastro (upsert seguro)', () => {
  test('registro NOVO: grava Status PENDENTE e não define Cupom', () => {
    const repo = repositorioFalso();
    const r = new ParceiroService(repo).registrarCadastro(RESPOSTA);

    expect(r).toEqual({ ignorado: false, criado: true, chave: 'DANI PERRUT' });
    expect(repo.chamadas).toHaveLength(1);

    const { dados, chave } = repo.chamadas[0];
    expect(chave).toBe(CAMPOS_PARCEIRO.ID);
    expect(dados[CAMPOS_PARCEIRO.STATUS_CONTRATO]).toBe('PENDENTE');
    expect(dados[CAMPOS_PARCEIRO.NOME]).toBe('Daniela Perrut ME');
    // Sem rede no Jest → endereço degrada para o que veio no Forms (caixa alta).
    expect(dados['Endereço_Formatado']).toBe('RUA DAS FLORES, 120, APTO 3, 01000-000');
    // Cupom em branco: nem entra no payload → upsert não escreve a coluna.
    expect(CAMPOS_PARCEIRO.CUPOM in dados).toBe(false);
  });

  test('registro EXISTENTE: atualiza cadastro sem tocar Status nem Cupom', () => {
    const repo = repositorioFalso({ 'DANI PERRUT': { [CAMPOS_PARCEIRO.ID]: 'DANI PERRUT' } });
    const r = new ParceiroService(repo).registrarCadastro(RESPOSTA);

    expect(r).toEqual({ ignorado: false, criado: false, chave: 'DANI PERRUT' });

    const { dados } = repo.chamadas[0];
    expect(CAMPOS_PARCEIRO.STATUS_CONTRATO in dados).toBe(false); // preserva contrato
    expect(CAMPOS_PARCEIRO.CUPOM in dados).toBe(false);           // preserva cupom manual
    expect(dados[CAMPOS_PARCEIRO.NOME]).toBe('Daniela Perrut ME'); // dados cadastrais sim
  });

  test('apelido ausente: ignora e não chama o upsert', () => {
    const repo = repositorioFalso();
    const r = new ParceiroService(repo).registrarCadastro({ 'Razão Social': 'Sem apelido' });

    expect(r).toEqual({ ignorado: true, motivo: 'SEM_APELIDO' });
    expect(repo.chamadas).toHaveLength(0);
  });
});
