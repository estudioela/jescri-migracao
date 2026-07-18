# Finalizar Sessão

Você está encerrando uma sessão de desenvolvimento do Projeto TEAR.

Objetivo:
Deixar o projeto consistente, documentado, sincronizado e pronto para ser retomado.

## Fluxo

1. Analise as alterações realizadas nesta sessão.
2. Execute apenas os testes necessários para validar as mudanças.
3. Atualize a documentação impactada (CHANGELOG, ADRs, SPECs ou outros documentos relevantes).
4. Atualize a pasta `knowledge/` caso algum documento precise ser refletido no NotebookLM.
5. Execute:

```bash
./scripts/sync-notebook.sh
```

6. Aguarde a sincronização terminar.
7. Execute `git status`.
8. Se tudo estiver consistente:
   - faça um commit com uma mensagem adequada;
   - faça push para a branch atual.
9. Apresente um resumo contendo:
   - objetivo da sessão;
   - arquivos alterados;
   - testes executados;
   - documentação atualizada;
   - status da sincronização com o NotebookLM;
   - commit realizado;
   - branch;
   - pendências para a próxima sessão.

## Interrompa apenas se houver

- conflito de merge;
- falha crítica;
- risco de perda de dados.