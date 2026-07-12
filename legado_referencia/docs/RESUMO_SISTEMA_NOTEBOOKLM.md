# O Sistema Jescri: ERP + Portal de Influenciadoras — Como Tudo Funciona

Este documento explica, do início ao fim, como funciona o sistema que a Estúdio Elã usa para gerenciar a campanha de influenciadoras Jescri. Ele foi escrito para quem não mexe com código: se você trabalha na agência e quer entender o caminho completo — desde o cadastro de uma nova criadora até ela ver o pagamento cair — este texto cobre cada etapa, na ordem em que elas acontecem na prática.

O sistema tem duas metades que conversam entre si o tempo todo:

- **A planilha (o "ERP")**: uma Planilha Google onde a equipe da agência planeja campanhas, registra ativações, controla pagamentos e acompanha entregas. É o centro de comando, usado pela equipe interna.
- **O Portal**: um aplicativo web simples, no celular ou no computador, que cada influenciadora usa para ver o que precisa entregar, enviar o material e acompanhar se já foi pago. É a "vitrine" voltada para fora, usada pelas criadoras de conteúdo.

Por baixo dos panos, as duas metades são a mesma planilha — o Portal não guarda nada por conta própria, ele só lê e escreve na mesma Planilha Google que a equipe usa. Isso é explicado com mais detalhe na seção 6.

---

## 1. Visão geral: qual problema esse sistema resolve

Antes deste sistema existir, gerenciar uma campanha com dezenas de influenciadoras — cada uma com um cachê, um conjunto de entregas (reels, carrossel, stories), um endereço para receber produtos, uma chave PIX para pagamento — significava um emaranhado de planilhas soltas, mensagens de WhatsApp copiadas manualmente e nenhuma visibilidade do lado da influenciadora sobre o que ela deveria estar fazendo.

O sistema resolve isso de duas pontas:

1. **Do lado da agência**, uma única planilha organiza tudo — quem está ativa na campanha, o que cada uma precisa postar, quando cada pagamento foi feito, o status de cada entrega logística — com automações que evitam trabalho manual repetitivo (calcular datas, arquivar histórico, montar mensagens de cobrança).
2. **Do lado da influenciadora**, um aplicativo simples e bonito mostra exatamente o que ela precisa fazer naquele mês, deixa ela enviar o material de dentro do próprio app, e mostra o status do pagamento — sem ela precisar trocar mensagens com a equipe para saber "cadê meu briefing" ou "meu pagamento já saiu?".

Quem usa cada parte:
- **A planilha (ERP)** é usada pela equipe da agência Elã — quem planeja as campanhas, aprova conteúdos, cuida do financeiro e da logística.
- **O Portal** é usado pelas influenciadoras — cada uma vê só as próprias informações, nunca as das outras.

---

## 2. O formulário de cadastro (como uma criadora entra no sistema)

Antes de qualquer campanha começar, a influenciadora precisa ser cadastrada. Isso acontece por um formulário público, hospedado no site da agência, endereçado como uma página de cadastro da Jescri em parceria com a Elã.

O formulário pede, em três blocos:

- **Dados pessoais**: como ela prefere ser chamada, o melhor e-mail (usado depois para assinar contrato) e a chave PIX.
- **Dados empresariais** (para emissão de nota fiscal): razão social e CNPJ.
- **Endereço de entrega**: CEP, número e complemento — usados depois para o envio dos produtos da campanha.

Quando ela clica em "enviar cadastro", os dados vão direto para um Google Formulário conectado à planilha (o envio acontece por trás de um iframe invisível na própria página, então ela não é redirecionada para outro site — só vê uma mensagem de confirmação, "tudo certo, [nome]!"). Nesse momento, os dados caem automaticamente na aba **CADASTROS** da planilha.

A partir daí, um processo automático (que roda assim que uma nova resposta chega) pega esses dados brutos, organiza e formata (nome em maiúsculas, e-mail em minúsculas, CNPJ e chave PIX preservados como texto para não perder zeros à esquerda) e cria uma nova linha na aba **BASE DE DADOS** — a aba principal de cadastro de influenciadoras. Se ela informou um CEP válido de 8 dígitos, o sistema também consulta automaticamente um serviço público de CEP e já preenche rua, bairro, cidade e estado, montando o endereço completo formatado, sem a equipe precisar digitar nada disso à mão.

Toda influenciadora recém-cadastrada entra com o status **"OFF"** — ou seja, cadastrada, mas ainda não ativa em nenhuma campanha. A equipe decide quando ativá-la (ligando o status para "ON"), o que a torna elegível para entrar no próximo mês de campanha.

Esse formulário também pode ser aberto de dentro da própria planilha, por um item de menu ("Abrir Formulário de Cadastro"), útil quando alguém da equipe precisa cadastrar uma criadora manualmente durante uma reunião ou ligação.

---

## 3. A planilha (ERP), aba por aba

A planilha é dividida em abas, cada uma com uma responsabilidade clara. Pense nelas como "gavetas" de um arquivo — cada uma guarda um tipo de informação, e o sistema sabe como cruzar as gavetas entre si.

### BASE DE DADOS
O cadastro mestre de cada influenciadora: nome, cupom (identificador único usado para login no Portal), e-mail, chave PIX, CNPJ, endereço completo, valor do cachê e quantas peças de cada formato (reels, carrossel, stories) ela deve entregar no ciclo. É também aqui que fica o status ON/OFF que decide se ela participa do mês atual. Linhas ON aparecem destacadas em verde na planilha; linhas OFF, em vermelho claro — só de bater o olho, a equipe já vê quem está ativa.

### CADASTROS
A caixa de entrada bruta do formulário de onboarding, antes de virar um registro organizado na BASE DE DADOS. Funciona como um histórico do que cada pessoa preencheu no formulário.

### BRIEFING
O conteúdo criativo de cada campanha: o que a influenciadora deve postar em cada formato (reel, carrossel, stories), um resumo do mês, e as datas em que cada peça foi aprovada. É essa aba que alimenta a tela de "briefing" que a influenciadora vê no Portal.

### ATIVAÇÕES
A lista de tudo que precisa ser entregue no mês — uma linha por peça de conteúdo (um reel, um carrossel, um story). Cada linha guarda o formato, as datas de entrega e aprovação, o status atual (em aberto, em aprovação, aprovado, postado) e o link do material já enviado. É a aba mais "viva" do sistema: quase tudo que acontece no Portal atualiza uma linha aqui.

### PAGAMENTOS
Uma linha por pagamento devido a cada influenciadora no mês — valor, chave PIX, e o status daquele pagamento. Quando o status muda para "pago", o sistema arquiva a linha automaticamente (ver "Histórico" abaixo).

### FLUXO LOGÍSTICO
Acompanha o envio físico de produtos: endereço de entrega, status da confirmação com a influenciadora, código de rastreio e status da transportadora (atualizado automaticamente via integração com o serviço de rastreamento BRComerce).

### Históricos (HISTÓRICO DE CONTEÚDOS, HISTÓRICO DE PAGAMENTOS, HISTÓRICO LOGÍSTICO)
Cada uma dessas é o "arquivo morto" da aba viva correspondente. Quando um conteúdo é marcado como postado, um pagamento como pago, ou uma entrega como concluída, aquela linha sai da aba ativa e é movida para a aba de histórico correspondente — mantendo as abas de trabalho do dia a dia enxutas, sem perder o registro histórico de nada.

### Como elas se relacionam
No fim de cada mês, uma única ação de planejamento ("Iniciar Novo Mês") lê a BASE DE DADOS (só as influenciadoras ON) e, para cada uma, gera automaticamente: linhas de BRIEFING em branco para preencher, linhas de ATIVAÇÕES (uma por peça de conteúdo esperada), uma linha de PAGAMENTOS com o valor do cachê, e uma linha de FLUXO LOGÍSTICO para o envio de produtos. É o "motor" que transforma um cadastro em uma campanha ativa todo mês.

---

## 4. O menu do ERP — o que cada botão faz

Dentro da planilha existe um menu próprio, "ERP ELÃ", organizado por área:

**Planejamento & Campanhas**
- *Iniciar Novo Mês*: pergunta o mês/ano da campanha e gera automaticamente briefing, ativações, fluxo logístico e pagamentos para todas as influenciadoras ativas — o pontapé inicial de cada ciclo mensal.
- *Puxar Looks da Planilha Externa para Briefing*: cada influenciadora pode ter uma planilha própria (externa) com sugestões de look para cada formato de conteúdo; esta opção busca essas sugestões e as copia automaticamente para o briefing de cada uma.

**Financeiro & PIX**
- *Lançar Pagamentos Avulsos do Mês*: cria lançamentos de pagamento extras fora do ciclo automático mensal, por exemplo para acertos pontuais.
- *Copiar Mensagem de PIX*: gera automaticamente uma mensagem de cobrança formatada (valor, referência, chave PIX) pronta para colar no WhatsApp, a partir da linha de pagamento selecionada.

**Logística & Envios**
- *Atualizar Rastreios Automáticos*: consulta a transportadora (BRComerce) e atualiza o status de entrega de todos os envios com código de rastreio cadastrado.
- *Copiar Dados de Confirmação*: gera uma mensagem pronta pedindo à influenciadora que confirme endereço e chave PIX antes do envio dos produtos.

**Cadastros & Configurações**
- *Abrir Formulário de Cadastro*: atalho para o mesmo formulário de onboarding descrito na seção 2.
- *Preencher Endereço por CEP*: para a linha selecionada na BASE DE DADOS, busca o endereço completo a partir do CEP informado.
- *Executar Limpeza e Arquivamento Geral*: varre ATIVAÇÕES, PAGAMENTOS e FLUXO LOGÍSTICO em busca de itens já concluídos (postado, pago, entregue) e os move para as respectivas abas de histórico, de uma vez.
- *Estruturar Planilha (Setup Inicial)*: cria as abas do sistema com os cabeçalhos corretos, caso alguma esteja faltando — usado ao configurar a planilha pela primeira vez ou recuperar uma aba apagada por engano.
- *Editar Dados da Influenciadora* e *Lançar Pagamento Extra/UGC*: dois painéis laterais (sidebars) rápidos, para editar o cadastro de uma influenciadora ou lançar um pagamento avulso sem precisar navegar até a aba correspondente.

**Portal de Apoio**
- *Abrir Portal (Modal)*: abre uma prévia do Portal da influenciadora dentro de uma janela, direto de dentro da planilha — útil para a equipe testar como o app está aparecendo sem precisar sair da planilha.

Além do menu, o sistema reage sozinho a certas edições feitas diretamente na planilha: marcar um conteúdo como "postado" arquiva a linha automaticamente; preencher uma data de aprovação recalcula sozinha a data de entrega esperada (sete dias antes, ajustada para nunca cair num fim de semana); editar o CEP de uma influenciadora já preenche o endereço completo sem precisar rodar nada manualmente.

---

## 5. O ciclo mensal completo, do início ao fim

1. **Fechamento do mês anterior**: a equipe roda a limpeza e arquivamento geral, movendo tudo que já foi concluído (postado, pago, entregue) para o histórico.
2. **Início do novo mês**: a equipe roda "Iniciar Novo Mês", informando o mês e ano da campanha. O sistema gera, para cada influenciadora ativa: um rascunho de briefing, uma linha de pagamento com o cachê do mês, uma linha de fluxo logístico e uma linha de ativação para cada peça de conteúdo esperada (um reel, um carrossel, os stories — a quantidade de cada um vem do cadastro dela na BASE DE DADOS).
3. **Preenchimento do briefing**: a equipe de conteúdo preenche, na aba BRIEFING, o que cada influenciadora deve postar em cada formato, e um resumo geral do mês.
4. **A influenciadora acessa o Portal**: ela faz login e vê, na tela de pendências, a lista das peças que precisa entregar naquele mês. Ao abrir uma delas, vê o briefing completo — incluindo o resumo do mês em destaque — com as datas de entrega e postagem esperadas.
5. **Envio do material**: direto do Portal, ela sobe o arquivo (foto ou vídeo). O sistema guarda automaticamente numa pasta organizada no Drive (por influenciadora, mês e formato) e atualiza o status daquela peça para "em aprovação".
6. **Aprovação**: a equipe de conteúdo revisa o material enviado e atualiza o status na planilha. Assim que uma peça é aprovada, o sistema recalcula sozinho a data de postagem esperada.
7. **Postagem e arquivamento**: quando a influenciadora publica e a equipe marca a peça como "postada", ela sai da lista de pendências e vai para o histórico — permanecendo visível para consulta, mas fora da lista de "coisas a fazer".
8. **Pagamento**: em paralelo, a equipe financeira processa o pagamento e atualiza o status na aba PAGAMENTOS. A influenciadora acompanha esse status pelo Portal, na tela de pagamentos.

---

## 6. O aplicativo (Portal da influenciadora), tela por tela

O Portal é pensado para ser usado no celular, como um app comum, mas funciona em qualquer navegador. Cada influenciadora só enxerga as próprias informações.

**Login**: ela entra com o cupom (o identificador dela na campanha) e uma senha simples baseada nos primeiros dígitos do CNPJ cadastrado. Por segurança, depois de 5 tentativas erradas o sistema bloqueia novas tentativas por 15 minutos, evitando que alguém tente adivinhar a senha de outra pessoa.

**Pendências**: a tela inicial depois do login. Mostra, organizadas por mês, todas as peças de conteúdo que ela precisa entregar — o formato, a data de entrega esperada, a data de postagem e o status atual (aguardando material, em aprovação, aprovado, publicado). Um seletor permite navegar entre meses diferentes, inclusive meses anteriores.

**Briefing**: ao tocar em uma pendência, ela vê o briefing completo daquela peça — formato, datas, e um resumo do mês em destaque visual próprio (separado do restante do texto), seguido do texto detalhado do que precisa ser produzido.

**Enviar material**: dentro do próprio briefing, um botão leva direto para a tela de upload. Ela escolhe o arquivo (foto ou vídeo, podendo ser mais de um) e acompanha uma barra de progresso do envio. O upload acontece em pedaços (útil para arquivos grandes ou conexões instáveis) e, ao concluir, o status da peça muda automaticamente para "em aprovação".

**Pagamentos**: mostra o total previsto e o total já pago no mês selecionado, e uma lista de cada pagamento com uma barra de progresso visual em três etapas — pendente, aprovado, pago. A barra só avança quando o status correspondente estiver realmente confirmado na planilha da equipe financeira.

**Histórico**: reúne tudo que já foi concluído — conteúdos publicados e pagamentos já realizados —, navegável por mês, incluindo meses de campanhas anteriores já arquivadas.

**Perfil**: mostra os dados cadastrais (nome, CNPJ, cidade, endereço) como informação só de leitura, e permite que ela mesma atualize alguns dados de contato — chave PIX, e-mail, CEP, número e complemento do endereço —, sem precisar pedir para a equipe alterar manualmente na planilha.

**Sair**: encerra a sessão de forma explícita (antes disso, a sessão só expirava sozinha depois de um tempo de inatividade). Se a sessão expirar enquanto ela está usando o app, aparece um aviso claro pedindo para fazer login novamente, em vez de simplesmente voltar para a tela de login sem explicação.

---

## 7. Como as duas pontas se conectam

Não existem "dois bancos de dados" que precisam ficar sincronizados — existe **uma única planilha**, e o Portal é só uma porta de entrada diferente para ler e escrever nela.

Pense assim: a planilha é como um grande arquivo de gavetas (as abas). A equipe da agência mexe nessas gavetas diretamente, abrindo a planilha no navegador. O Portal, quando a influenciadora faz login, pede para "abrir a gaveta certa" por trás dos panos — sem ela nunca ver a planilha em si — e mostra só a informação que é dela, formatada de um jeito simples de entender no celular. Quando ela envia um material ou atualiza seu e-mail no Portal, é a mesma gaveta (a mesma planilha) que está sendo atualizada — a equipe vê a mudança na hora, sem precisar de nenhum passo extra de sincronização.

Essa ponte entre o Portal e a planilha é feita por um serviço interno do Google (parte do mesmo ambiente onde a planilha vive), publicado como um pequeno aplicativo web — é ele que efetivamente processa os pedidos do Portal ("me mostra as pendências desta pessoa", "grave este arquivo enviado") e faz a leitura/escrita na planilha em nome dela, sempre validando antes que aquela pessoa realmente tem permissão para ver ou alterar aqueles dados específicos.

---

## 8. Glossário rápido

- **Cupom**: o código que identifica uma influenciadora dentro do sistema — usado como "usuário" para fazer login no Portal.
- **Chave PIX**: a chave de pagamento cadastrada pela influenciadora, para onde o cachê é transferido.
- **Ativação**: o termo usado internamente para uma peça de conteúdo que precisa ser produzida e entregue (um reel, um carrossel ou um story fazem parte de uma "ativação").
- **Briefing**: a orientação criativa — o que postar, como, com que mensagem — para cada formato de conteúdo num determinado mês.
- **Cachê**: o valor pago à influenciadora por sua participação na campanha do mês.
- **Formato**: o tipo de peça de conteúdo esperada — reel, carrossel ou stories (podendo haver mais de um story por campanha).
- **Status ON/OFF**: indica se aquela influenciadora está participando ativamente da campanha do mês atual (ON) ou está apenas cadastrada, sem participação corrente (OFF).
- **Histórico**: o arquivo de tudo que já foi concluído (conteúdo publicado, pagamento realizado, entrega finalizada) — mantido para consulta, fora das listas de trabalho ativo.
- **Sessão**: o período em que a influenciadora permanece "logada" no Portal depois de entrar com cupom e senha; expira automaticamente depois de um tempo sem uso, ou quando ela escolhe sair manualmente.
