const fs = require('fs');

function lerCSV(caminho) {
    const data = fs.readFileSync(caminho, 'utf8');
    // Quebra em linhas e remove aspas extras comuns em exportações do Google
    return data.split(/\r?\n/).map(linha => linha.split(',').map(c => c.replace(/^"|"$/g, '').trim()));
}

const base = lerCSV('tools/base.csv');
const pagamentos = lerCSV('tools/pagamentos.csv');

// Mapeamento simples (assumindo a estrutura que você já tem)
const dados = {
    parceiros: base.slice(1).map(linha => ({
        ID: linha[0],
        Nome: linha[1] // Ajuste o índice conforme a coluna real de nome
    })),
    pagamentos: pagamentos.slice(1).map(linha => ({
        ID_Influ: linha[0],
        Valor: linha[5]
    }))
};

fs.writeFileSync('tear/DataSeed.js', `const DADOS_IMPORTACAO = ${JSON.stringify(dados, null, 2)};`);
console.log("Sucesso: tear/DataSeed.js gerado.");
