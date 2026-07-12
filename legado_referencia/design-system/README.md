# Design System do Estúdio Elã

Biblioteca de design reutilizável por qualquer produto do ecossistema. O Portal da Influenciadora é a **primeira aplicação consumidora**, não a dona do sistema.

## Camadas

```
core/       a marca. Independente de produto, de plataforma e de framework.
themes/     um arquivo por produto. Sobrescreve o núcleo enquanto houver dívida.
adapters/   como consumir a biblioteca em cada plataforma.
```

O núcleo nunca importa um tema. Um tema nunca é referenciado por outro. Nenhum arquivo de `core/` menciona Portal, Apps Script, Google Sheets ou qualquer produto — se mencionar, está no lugar errado.

## Como um produto novo consome

Carregue `core/variables.css`, depois `core/utility-classes.css`, depois o tema do produto, se houver. Aplique `--ela-case-brand` em `html, body`. Prefixe classes com `.ela-`. Nunca escreva valor literal: se falta um token, crie o token.

Um produto novo **não precisa de tema**. Tema existe para carregar dívida, não para customizar.

## O que é verdade e o que é inferência

Só três coisas foram verificadas no material da marca:

| Fato | Onde |
|---|---|
| Vermelho institucional `#a1231f` | `<meta name="theme-color">` e stroke dos ícones em `estudioela.com` |
| A serifada é usada **sempre em itálico** | classe `.ivy-italic` no HTML institucional |
| Todo texto é **minúsculo** | site institucional e `text-transform: lowercase` no Portal |

**Todo o resto é inferido**, e está marcado como tal em `core/tokens.json`:

- **Neutros** (`--ela-neutral-*`) — nenhuma cor de texto ou superfície foi especificada pela marca. Os valores atuais são neutros quentes emprestados da implementação do Portal, que os derivou de outra semente. Ao convergir o vermelho, eles devem ser rederivados de `#a1231f`.
- **`--ela-brand-500` / `--ela-brand-700`** — clareamento e escurecimento de `#a1231f`, calculados, não fornecidos.
- **`--ela-color-danger`** — vermelho de erro deliberadamente distinto do vermelho de marca, para que "erro" não se confunda com "ação".
- **Escala tipográfica, espaçamento, raio, movimento** — nenhum foi especificado. A escala do núcleo é uma proposta limpa; a do Portal, o legado real.

### Tipografia: substitutos, não as fontes da marca

A marca usa um kit do Adobe Typekit restrito ao domínio `estudioela.com`. Ele **não carrega** em nenhum outro produto — falha em silêncio, no fallback. O núcleo declara famílias servíveis em qualquer domínio: `EB Garamond` (display, itálico), `Archivo Narrow` (label), `Inter` (body).

São **substitutos**. Não são as fontes da marca. Resolver isso exige adotar famílias servíveis como oficiais, ou auto-hospedar as originais — decisão de marca, não de engenharia.

## Dívida conhecida

**O Portal não usa o vermelho da marca.** Ele usa `#8f0002`. `themes/portal.css` mantém essa divergência explícita para que a adoção da biblioteca tenha diff visual zero — nada muda para as influenciadoras até que a convergência seja aprovada.

O mesmo tema carrega a escala tipográfica e de espaçamento legadas do Portal: cinco tamanhos de fonte separados por menos de 1,6px, e catorze valores de espaço sem escala, dos quais `5px` e `22px` aparecem uma vez cada.

Quando a convergência for decidida, apagar o bloco "Divergências" do tema é o passo inteiro.

## O que a biblioteca não tem, e por quê

**Sombra.** A marca é plana. Não há uma única `box-shadow` no Portal, e o site institucional separa seções por cor de fundo. Não introduza uma sem decisão de design.

**Classes de componente** (`.btn-primary`, `.card`). Isto é a matéria-prima. Componentizar exige extrair a regra real de cada componente de cada produto — trabalho separado, um fluxo por PR.

**Token de breakpoint utilizável em CSS.** Custom properties não funcionam dentro de `@media`: `@media (min-width: var(--x))` é inválido, silenciosamente. O `768px` é escrito à mão. O token existe em `tokens.json` para consumo por ferramentas.

## Manutenção

`core/tokens.json` é a fonte. Ao alterar um valor: atualize o JSON, reflita em `core/variables.css`, e os utilitários acompanham por herança de variável.

Um item marcado como inferido descreve **como o valor foi inventado**. Nunca afirma que ele foi observado.
