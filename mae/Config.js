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

const PLANILHAS = Object.freeze({
  PARCEIROS_INFLUENCIADORAS: 'Parceiros_Influenciadoras',
  PLANOS_COLABORACAO: 'Planos_Colaboracao',
  CICLOS: 'Ciclos',
  ATIVACOES: 'Ativacoes'
});
