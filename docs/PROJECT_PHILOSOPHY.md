# PROJECT_PHILOSOPHY.md
# Projeto Tear V2

Versão: 1.0

======================================================================
FILOSOFIA OPERACIONAL
======================================================================

Este projeto prioriza execução, estabilidade e evolução incremental.

O objetivo do agente NÃO é produzir a solução mais sofisticada possível.

O objetivo é concluir corretamente a tarefa solicitada consumindo o mínimo
possível de contexto, tokens, leituras, tempo e iterações.

======================================================================
ORDEM DE PRIORIDADE
======================================================================

1. Correção funcional.
2. Testes verdes.
3. Estabilidade.
4. Escopo solicitado.
5. Economia de contexto.
6. Economia de tokens.
7. Velocidade de entrega.
8. Elegância do código.

======================================================================
REGRAS GERAIS
======================================================================

• Execute apenas o escopo solicitado.

• Não amplie a sprint por iniciativa própria.

• Não implemente funcionalidades futuras.

• Não faça refatorações não solicitadas.

• Não reabra decisões arquiteturais já aprovadas.

• Não interrompa a implementação para buscar uma arquitetura mais elegante.

======================================================================
INVESTIGAÇÃO
======================================================================

Investigue apenas até possuir informação suficiente para implementar.

Assim que houver informação suficiente:

PARE DE INVESTIGAR.

COMECE A IMPLEMENTAR.

Evite:

- releitura de arquivos;
- auditorias repetidas;
- validações redundantes;
- exploração desnecessária do projeto.

======================================================================
DECISÕES
======================================================================

Se existirem duas soluções tecnicamente corretas:

Escolha a que:

- altera menos arquivos;
- exige menos contexto;
- exige menos tokens;
- possui menor risco;
- preserva a arquitetura existente.

======================================================================
INCONSISTÊNCIAS
======================================================================

Caso encontre inconsistências:

Se impedirem tecnicamente a implementação:

→ pare e solicite uma decisão.

Caso contrário:

→ registre a observação em poucas linhas;
→ continue implementando.

Não interrompa a sprint.

======================================================================
MELHORIAS
======================================================================

Se identificar melhorias fora do escopo:

- registre a sugestão;
- não implemente;
- continue a tarefa principal.

======================================================================
COMUNICAÇÃO
======================================================================

Durante a implementação seja objetivo.

Informe apenas:

- etapa atual;
- resultado;
- bloqueios.

Evite relatórios longos durante a execução.

======================================================================
SESSÕES
======================================================================

Considere que haverá outro agente depois de você.

Sua responsabilidade termina quando a tarefa atual estiver concluída.

Não prepare funcionalidades futuras.

Não prolongue a sessão sem necessidade.

======================================================================
REGRA DE OURO
======================================================================

A melhor implementação é aquela que entrega corretamente o que foi solicitado
com o menor consumo possível de contexto, tokens, tempo e alterações.

Perfeccionismo não é um objetivo deste projeto.
