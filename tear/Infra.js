/* ═══════════════════════════════════════════════════════════════
   infra/Config.js
   ═══════════════════════════════════════════════════════════════ */

const ESTADOS_ATIVACAO = Object.freeze({
  PLANEJAMENTO: 'Planejamento',
  PRONTA_PARA_ENVIO: 'Pronta para Envio',
  AGUARDANDO_RECEBIMENTO: 'Aguardando Recebimento',
  EM_PRODUCAO: 'Em Produção',
  AGUARDANDO_APROVACAO: 'Aguardando Aprovação',
  EM_AJUSTES: 'Em Ajustes',
  APROVADA: 'Aprovada',
  AGENDADA: 'Agendada',
  PUBLICADA: 'Publicada',
  AGUARDANDO_UPLOAD_HD: 'Aguardando Upload HD',
  CONCLUIDA: 'Concluída',
  ELEGIVEL_PARA_PAGAMENTO: 'Elegível para Pagamento',
  ARQUIVADA: 'Arquivada'
});

/**
 * Máquina de estados da aba `Logistica` (docs/spec/SCHEMA_V2.md). Domínio
 * fechado, como `ESTADOS_ATIVACAO`. Transições em `Logistica.TRANSICOES_PERMITIDAS`
 * (tear/Modelos.js). `Cancelado` é terminal e alcançável de qualquer estado ativo.
 */
const ESTADOS_LOGISTICA = Object.freeze({
  PENDENTE: 'Pendente',
  AGUARDANDO_ENVIO: 'Aguardando Envio',
  ENVIADO: 'Enviado',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado'
});

const PLANILHAS = Object.freeze({
  PARCEIROS_INFLUENCIADORAS: 'Parceiros_Influenciadoras',
  PLANOS_COLABORACAO: 'Planos_Colaboracao',
  CICLOS: 'Ciclos',
  ATIVACOES: 'Ativacoes',
  LOGISTICA: 'Logistica'
});

/* ═══════════════════════════════════════════════════════════════
   infra/PlanilhaHelpers.js
   ═══════════════════════════════════════════════════════════════ */

/**
 * Leitura de aba por NOME de cabeçalho, compartilhada pelos Repositories.
 *
 * São `function` declarations de propósito, não uma classe base: `class X
 * extends Y` resolve `Y` em tempo de carga, e a ordem de carga entre arquivos
 * do Apps Script não é garantida (CLAUDE.md §13). Funções sofrem hoisting; a
 * herança não.
 *
 * Só Repositories chamam estas funções — são elas que tocam `SpreadsheetApp`.
 */

function abaObrigatoria(planilha, nomeAba) {
  const aba = planilha.getSheetByName(nomeAba);

  if (!aba) {
    throw new Error(`Aba "${nomeAba}" não encontrada na planilha.`);
  }

  return aba;
}

function lerAbaComCabecalho(planilha, nomeAba) {
  const aba = abaObrigatoria(planilha, nomeAba);
  const valores = aba.getDataRange().getValues();
  const cabecalho = valores.shift() || [];

  return { aba, cabecalho, linhas: valores };
}

/**
 * Resolver coluna por nome, nunca por índice: inserir uma coluna na planilha
 * não pode quebrar a leitura em silêncio. Foi o risco #1 do sistema até 2026-07-07.
 */
function indiceDaColuna(cabecalho, campo, nomeAba) {
  const indice = cabecalho.indexOf(campo);

  if (indice === -1) {
    throw new Error(`Coluna "${campo}" ausente em "${nomeAba}".`);
  }

  return indice;
}

function linhaParaObjeto(cabecalho, linha) {
  return cabecalho.reduce((obj, coluna, i) => {
    if (coluna) {
      obj[coluna] = linha[i];
    }
    return obj;
  }, {});
}

/**
 * `getDataRange()` devolve também as linhas em branco que o Sheets mantém
 * abaixo dos dados. Sem este filtro elas viram registros fantasma.
 */
function linhasComChave(cabecalho, linhas, campoChave, nomeAba) {
  const idx = indiceDaColuna(cabecalho, campoChave, nomeAba);

  return linhas.filter(linha => String(linha[idx]).trim() !== '');
}

/* ═══════════════════════════════════════════════════════════════
   infra/EventDispatcher.js
   ═══════════════════════════════════════════════════════════════ */

class EventDispatcher {
  constructor() {
    this.listeners = new Map();
  }

  subscribe(eventName, callback) {
    if (typeof callback !== 'function') {
      throw new TypeError(`Listener de "${eventName}" deve ser uma função.`);
    }

    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }

    this.listeners.get(eventName).push(callback);
  }

  dispatch(eventName, payload) {
    const callbacks = this.listeners.get(eventName);

    if (!callbacks || callbacks.length === 0) {
      return;
    }

    callbacks.slice().forEach(callback => {
      try {
        callback(payload);
      } catch (error) {
        console.error(`Listener de "${eventName}" falhou e foi ignorado: ${error.message}`);
      }
    });
  }
}

