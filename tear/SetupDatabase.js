function cabecalhosV2_() {
  return Object.freeze({
    [PLANILHAS.ATIVACOES]: [
      'ID_Ativacao',
      'ID_Ciclo',
      'ID_Influenciadora',
      'Tipo_Conteudo',
      'Estado_Principal',
      'Look_Referencia',
      'Data_Prevista_Entrega',
      'Link_Briefing',
      'Link_Upload_HD',
      'Nota_Fiscal_Anexa',
      'Estado_Derivado'
    ],
    [PLANILHAS.CICLOS]: [
      'ID_Ciclo',
      'Nome_Ciclo',
      'Data_Inicio_Logistica',
      'Data_Fim_Operacao'
    ],
    [PLANILHAS.PARCEIROS_INFLUENCIADORAS]: [
      'ID_Influenciadora',
      'Nome',
      'Status_Contrato',
      'Categoria',
      'Cupom',
      'Senha_Hash'
    ],
    [PLANILHAS.PLANOS_COLABORACAO]: [
      'ID_Plano',
      'ID_Influenciadora',
      'ID_Ciclo',
      'Qtd_Entregaveis',
      'Valor_Cache'
    ]
  });
}

function setupV2Database() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const cabecalhos = cabecalhosV2_();
  const relatorio = [];

  Object.keys(cabecalhos).forEach(nomeAba => {
    const colunas = cabecalhos[nomeAba];
    let aba = planilha.getSheetByName(nomeAba);
    let situacao;

    if (aba) {
      situacao = 'aba já existia';
    } else {
      aba = planilha.insertSheet(nomeAba);
      situacao = 'aba criada';
    }

    if (aba.getRange(1, 1).isBlank()) {
      aba.getRange(1, 1, 1, colunas.length).setValues([colunas]);
      situacao += ', cabeçalho gravado';
    } else {
      situacao += ', cabeçalho preservado (linha 1 não estava vazia)';
    }

    aba.setFrozenRows(1);
    relatorio.push(`${nomeAba}: ${situacao}`);
  });

  console.log(relatorio.join('\n'));
  return relatorio;
}
