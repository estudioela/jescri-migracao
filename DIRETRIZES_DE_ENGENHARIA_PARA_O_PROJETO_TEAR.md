# Diretrizes de Engenharia para o Projeto Tear

> Este documento não descreve nenhum repositório específico. Ele consolida princípios de arquitetura, documentação, fluxo de trabalho e manutenção destinados a orientar a evolução do Projeto Tear ao longo dos próximos anos. O foco não é código — é sustentabilidade.

---

## 1. Princípio central

Cada elemento de engenharia do Tear — uma pasta, um documento, uma regra de CI — deve existir para responder a uma pergunta específica que alguém (humano ou IA) fará no futuro. Se uma decisão de estrutura não corresponde a uma pergunta real que alguém fará mais tarde, ela é decoração, não engenharia.

As perguntas que o Tear precisa estar sempre pronto para responder:

- *Por que isso foi feito assim?*
- *O que aconteceria se eu mudasse isso?*
- *Quem — ou o quê — pode tocar essa parte do sistema?*
- *Como sei que isso ainda funciona depois da minha mudança?*
- *O que já tentamos e não deu certo?*

Toda diretriz abaixo serve a uma dessas perguntas.

---

## 2. Arquitetura do repositório

**Organize por fronteira de execução real, não por categoria estética.**

Pastas como `utils/`, `helpers/`, `components/` não comunicam nada sobre risco ou responsabilidade. Prefira nomear a estrutura pelo que muda de contexto de execução: o que roda em qual processo, o que fala com qual serviço externo, o que é síncrono e o que pode falhar de forma assíncrona.

Regras práticas:

- **Um único ponto de contato por dependência externa instável** (API de terceiros, serviço de IA, fila, storage). Todo o resto do sistema deve depender de uma interface pura em cima desse ponto de contato — nunca da dependência diretamente. Isso torna testável tudo que não é a própria dependência.
- **Separe trabalho síncrono de trabalho assíncrono/pesado em processos distintos** assim que existir qualquer operação lenta (chamada de IA, geração de arquivo, envio de notificação). Não espere o sistema ficar lento para fazer essa separação — o custo de fazer cedo é baixo; o custo de fazer tarde é uma reescrita.
- **Tipos ou contratos compartilhados entre camadas vivem em um único lugar identificável**, nunca duplicados. Se client e server (ou dois serviços) precisam concordar sobre o formato de um dado, esse formato tem um dono único no código.
- **A estrutura deve crescer por domínio de negócio, não por tipo técnico**, assim que o sistema tiver mais de um domínio claro. Agrupar por "controllers", "services", "models" funciona para projetos pequenos e para de escalar quando o número de funcionalidades cresce; agrupar por domínio (ex. "cobrança", "agentes", "integrações") escala melhor porque isola o raio de impacto de uma mudança.

---

## 3. Engenharia documental

**Cada documento tem uma responsabilidade única e não sobreposta com nenhum outro.**

O Tear deve manter, desde o início — mesmo pequenos — os seguintes documentos, cada um respondendo a uma pergunta diferente:

| Documento | Responde a | Não deve conter |
|---|---|---|
| Guia operacional para agentes de IA | *Como um agente deve operar neste repo agora?* (comandos, regras de ouro, o que é proibido) | Histórico de decisões antigas; arquitetura estável de longo prazo |
| Documento de arquitetura | *Como o sistema é estruturado hoje e por quê?* | Decisões pontuais de uma única feature; discussões já resolvidas |
| Registros de decisão datados (um por mudança arquitetural relevante) | *Por que fizemos essa mudança específica, naquele momento?* | Estado atual do sistema (isso é o documento de arquitetura) |
| Modelo de ameaça / documento de risco vivo | *O que pode dar errado e o que já mitigamos?* | Detalhes de implementação sem relação com risco |
| Guia de contribuição | *Como alguém novo começa a trabalhar aqui?* | Arquitetura profunda (deve linkar para o documento de arquitetura, não repetir) |

**Regra contra duplicação:** antes de escrever qualquer informação em um documento, pergunte "esse fato já tem um dono em outro lugar?". Se sim, linke — não copie. Duplicação de informação é a principal causa de documentação desatualizada.

**Regra contra documentação decorativa:** um documento gerado automaticamente e nunca revisado por humano é pior do que a ausência de documento, porque cria falsa confiança. Todo documento do Tear deve ter um autor humano responsável por sua precisão, mesmo que o rascunho inicial seja assistido por IA.

---

## 4. Fluxo de desenvolvimento

**O processo deve impedir mecanicamente os erros mais caros, não apenas documentá-los.**

- Toda mudança de código nasce associada a uma unidade rastreável de trabalho (issue, ticket) — nunca "solta".
- Trabalho em progresso nunca acontece diretamente nas branches que representam o estado publicado do sistema. Isso deve ser verificado no início de cada sessão de trabalho, não assumido.
- Testes e verificações de qualidade rodam em pelo menos duas camadas com a mesma sequência: localmente antes de cada commit (rápido, feedback imediato) e centralmente antes de qualquer integração (rede de segurança final, não contorna a máquina de ninguém).
- Publicar em produção é um ato distinto de "buildar" ou "testar" — deve exigir uma confirmação humana explícita e nunca deve ser uma ação automática de um agente de IA, mesmo que o agente tenha permissão para todo o resto do fluxo.
- Toda exclusão de teste, cobertura ou verificação precisa de uma justificativa escrita e versionada junto da exclusão. Uma exclusão sem explicação é dívida técnica invisível.

---

## 5. Engenharia de software

- **Prefira erros de compilação a erros de runtime.** Sempre que existir uma lista fechada de "tipos de coisa que o sistema processa" (tipos de tarefa, tipos de integração, tipos de evento), estruture o código para que adicionar um novo tipo sem tratar todos os casos necessários quebre o build — não a produção.
- **Convenções importantes de arquitetura (como fronteiras entre camadas) devem ser impostas por ferramenta sempre que possível**, não apenas descritas em documentação. Documentação é a segunda linha de defesa, não a primeira.
- **Automação que "faz mágica" (geração de código, extração automática, plugins customizados) precisa de um caminho manual documentado e testável.** Se a única forma de entender por que algo funciona é ler o código do plugin, isso é risco de manutenção de longo prazo — mesmo que funcione bem hoje.
- **Todo mecanismo de segurança ou controle de acesso relevante (isolamento de dados sensíveis, permissões) deve ser implementado como um ponto único e obrigatório no caminho de execução** — nunca como uma checagem que cada desenvolvedor precisa lembrar de repetir manualmente em cada lugar novo.

---

## 6. Engenharia para IA

O Tear deve tratar agentes de IA como um tipo de colaborador com regras operacionais próprias, não como uma ferramenta genérica:

- Existe um documento único e atualizado dizendo a um agente de IA exatamente como operar no repositório *neste momento*: comandos válidos, arquivos que uma mudança típica precisa tocar, e — mais importante — erros já cometidos que não devem se repetir.
- Ações irreversíveis ou de alto impacto (publicar em produção, apagar dados, alterar permissões de acesso) são bloqueadas tecnicamente para agentes de IA, não apenas proibidas por texto. Uma regra que só existe em prosa será eventualmente ignorada, por acidente ou por um agente que não a leu.
- Decisões de design tomadas com ou por um agente de IA são registradas com a mesma disciplina que decisões humanas — datadas, versionadas, ligadas a uma mudança específica — para que sirvam de memória de longo prazo tanto para humanos quanto para sessões futuras de IA.
- Processo de trabalho paralelo (múltiplos agentes ou múltiplas frentes simultâneas) precisa de isolamento explícito — cada frente de trabalho em seu próprio espaço, com uma regra clara de qual frente está "ativa" quando há recurso compartilhado (ex. um único ambiente de deploy de teste).

---

## 7. Escalabilidade e manutenção de longo prazo

Perguntas que devem ser respondidas positivamente para qualquer decisão estrutural nova no Tear:

1. Se a pessoa que tomou essa decisão sair do projeto amanhã, existe um documento que explica o porquê?
2. Se um agente de IA autônomo receber uma tarefa ambígua, existe algo que o impeça de tomar uma ação destrutiva?
3. Se o sistema crescer 10x em número de funcionalidades, essa estrutura de pastas ainda faz sentido, ou vai virar uma pasta única com centenas de arquivos desorganizados?
4. Se um novo domínio de negócio for adicionado, ele exige tocar em código de domínios não relacionados, ou é aditivo?
5. Existe alguma parte do sistema cuja corretude depende inteiramente de disciplina manual, sem nenhuma rede de segurança automatizada?

Decisões que respondem "não" à pergunta 5 são aceitáveis no curto prazo, mas devem ser explicitamente marcadas como dívida técnica a ser automatizada, não deixadas como está indefinidamente.

---

## 8. Resumo executivo

O Projeto Tear deve ser construído para ser compreendido por alguém que nunca esteve na sala onde as decisões foram tomadas — seja um humano novo na equipe, seja um agente de IA numa sessão futura sem memória da anterior. Isso significa:

- Estrutura de pastas que espelha fronteiras reais de execução e risco, não categorias estéticas.
- Documentação com responsabilidade única por documento e zero duplicação de fatos.
- Processo que impede mecanicamente os erros mais caros, em vez de apenas pedir cuidado.
- Regras para agentes de IA impostas tecnicamente, não apenas escritas.
- Toda decisão relevante, humana ou assistida por IA, deixando um rastro datado e explicável.

Nenhum desses princípios exige um repositório grande ou uma equipe grande para começar. O momento certo de adotá-los é o primeiro commit, não o commit número mil.
