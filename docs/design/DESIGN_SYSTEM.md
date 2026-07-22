# DESIGN SYSTEM — TEAR

## 1. IDENTIDADE VISUAL

### 1.1 Conceito

O TEAR possui uma identidade visual baseada em um SaaS premium com linguagem editorial.

A interface deve transmitir:

- organização;
- confiança;
- sofisticação;
- proximidade;
- controle operacional.

A estética combina elementos de produto digital moderno com referências editoriais de moda e branding.

---

### 1.2 Direção Visual

Nome interno:

**TEAR Editorial**

Características:

- minimalismo editorial;
- alto contraste;
- espaços generosos;
- hierarquia tipográfica forte;
- poucos elementos visuais concorrendo;
- foco em conteúdo e operação.

---

### 1.3 Personalidade da Interface

A interface deve parecer:

✅ premium  
✅ profissional  
✅ organizada  
✅ humana  
✅ estratégica  

Evitar:

❌ aparência genérica de dashboard corporativo  
❌ excesso de cores  
❌ componentes visualmente pesados  
❌ interfaces com estética de sistema financeiro tradicional  

---

### 1.4 Princípios Visuais

Toda tela deve seguir:

1. Clareza antes de decoração.
2. Conteúdo antes de elementos visuais.
3. Espaço em branco como elemento de design.
4. Tipografia como ferramenta de hierarquia.
5. Componentes consistentes em todo o sistema.

---

# 2. CORES

## 2.1 Paleta Principal

A identidade visual do TEAR utiliza uma paleta sofisticada, neutra e editorial.

### Cor Primária

Nome:

**TEAR Bordeaux**

Uso:

- ações principais;
- elementos de destaque;
- navegação ativa;
- estados importantes.

Valor:

```text
#BC0004
Tons Neutros

Fundo Principal

Uso:

* áreas gerais;
* páginas;
* containers.
#FAF8F6

Fundo Secundário

Uso:

* cards;
* blocos de informação;
* áreas internas.
#F3EEEA

Texto Principal

Uso:

* títulos;
* informações prioritárias.
#1A1A1A

exto Secundário

Uso:

* descrições;
* informações auxiliares;
* labels.
#666666

Bordas

Uso:

* divisores;
* inputs;
* cards.
#E5DDD6

2.2 Estados de Interface
Sucesso

Uso:

aprovação;
conclusão;
pagamentos realizados.
#2E7D32
Atenção

Uso:

pendências;
avisos;
ações necessárias.
#B7791F
Erro

Uso:

falhas;
validações inválidas;
bloqueios.
#C62828
3. TIPOGRAFIA
3.1 Princípio

A tipografia é elemento central da identidade TEAR.

Deve equilibrar:

sofisticação editorial;
legibilidade SaaS;
hierarquia clara.
3.2 Família Tipográfica
Títulos

Uso:

páginas;
seções;
destaques.

Estilo:

Serif editorial.

Exemplo:

EB Garamond
Interface

Uso:

botões;
menus;
tabelas;
formulários.

Estilo:

Sans-serif moderna.

Exemplo:

Inter
3.3 Hierarquia
H1

Uso:

Título principal da página.

Características:

grande;
elegante;
destaque visual.
H2

Uso:

Seções internas.

Body

Uso:

Textos gerais.

Prioridade:

leitura fácil;
espaçamento confortável.
Labels

Uso:

Campos;
filtros;
informações auxiliares.

Características:

pequenos;
objetivos;
alta legibilidade.
4. TOKENS VISUAIS
4.1 Espaçamento

O sistema utiliza espaçamento consistente.

Base:

8px

Escala:

8px
16px
24px
32px
48px
64px
4.2 Bordas

Padrão:

1px solid #E5DDD6
4.3 Raio de Componentes

Cards:

16px

Botões:

8px

Inputs:

8px
4.4 Sombras

A interface utiliza sombras discretas.

Princípio:

profundidade sutil;
nunca aparência pesada;
foco no conteúdo.

---

# 5. COMPONENTES

## 5.1 Princípio

Os componentes do TEAR devem ser:

- reutilizáveis;
- consistentes;
- simples;
- orientados a operação.

Nenhuma tela deve criar padrões visuais próprios.

---

# 5.2 Botões

## Botão Primário

Uso:

- ações principais;
- confirmações;
- criação de registros.

Características:

- fundo Bordeaux;
- texto claro;
- destaque visual.

Exemplos:

- Entrar;
- Salvar;
- Confirmar;
- Aprovar.

---

## Botão Secundário

Uso:

- ações auxiliares;
- cancelamentos;
- navegação alternativa.

Características:

- fundo neutro;
- borda discreta;
- menor destaque.

---

## Botão de Perigo

Uso:

- ações irreversíveis;
- exclusões;
- bloqueios.

Características:

- associado ao estado de erro;
- exige confirmação.

---

# 5.3 Inputs

Campos de entrada devem seguir:

Características:

- borda discreta;
- altura consistente;
- espaçamento confortável;
- labels sempre visíveis.

Estados:

- padrão;
- foco;
- preenchido;
- erro;
- desabilitado.

---

# 5.4 Cards

Uso:

- agrupamento de informações;
- indicadores;
- resumos.

Características:

- fundo neutro;
- bordas suaves;
- espaçamento interno generoso;
- hierarquia clara.

Evitar:

- excesso de cards;
- informações sem prioridade.

---

# 5.5 Tabelas

Uso:

- dados operacionais;
- listas;
- histórico.

Regras:

- cabeçalho claro;
- leitura horizontal simples;
- ações agrupadas;
- estados visíveis.

---

# 6. ESTADOS DE INTERFACE

Todas as telas devem possuir estados definidos.

## 6.1 Estado Normal

Representa:

- dados carregados;
- operação disponível.

---

## 6.2 Estado Carregando

Representa:

- processamento;
- busca;
- envio.

Regras:

- feedback visual obrigatório;
- impedir ações duplicadas.

---

## 6.3 Estado Vazio

Representa:

- ausência de dados.

Deve conter:

- explicação clara;
- próxima ação possível.

Exemplo:

"Você ainda não possui colaborações cadastradas."

---

## 6.4 Estado de Erro

Representa:

- falhas;
- validações;
- problemas de comunicação.

Deve conter:

- mensagem humana;
- orientação de correção;
- opção de tentar novamente quando aplicável.

Evitar:

- mensagens técnicas expostas ao usuário.

---

## 6.5 Estado de Sucesso

Representa:

- conclusão de ações.

Exemplos:

- cadastro realizado;
- pagamento aprovado;
- material enviado.

---

# 7. RESPONSIVIDADE

O TEAR deve seguir abordagem mobile-first.

## 7.1 Princípios

A interface deve funcionar em:

- celular;
- tablet;
- desktop.

---

## 7.2 Mobile

Priorizar:

- leitura;
- ações principais;
- navegação simples.

Evitar:

- excesso de informação simultânea;
- tabelas impossíveis de visualizar.

---

## 7.3 Desktop

Permitir:

- múltiplas informações;
- visão operacional;
- produtividade.

---

# 8. NAVEGAÇÃO

## 8.1 Estrutura

A navegação deve ser previsível.

Elementos:

- menu principal;
- contexto atual;
- ações disponíveis.

---

## 8.2 Hierarquia

O usuário sempre deve saber:

- onde está;
- o que pode fazer;
- qual o próximo passo.

---

# 9. REGRAS DE IMPLEMENTAÇÃO

## 9.1 Fidelidade ao Design

Toda nova tela deve respeitar:

- cores oficiais;
- tipografia;
- espaçamentos;
- componentes existentes.

---

## 9.2 Reutilização

Antes de criar um novo componente:

1. verificar componentes existentes;
2. reutilizar padrões;
3. criar novo apenas quando necessário.

---

## 9.3 Evolução Visual

Mudanças de design devem:

- preservar consistência;
- atualizar documentação;
- evitar padrões conflitantes.

---

# 10. REFERÊNCIA OFICIAL

Fontes visuais do TEAR:
docs/design/stitch-export/

Inclui:

- protótipos;
- screenshots;
- regras visuais;
- identidade editorial.

O DESIGN_SYSTEM.md é o contrato oficial para implementação frontend.