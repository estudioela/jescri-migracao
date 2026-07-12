# Adaptador: Google Apps Script (HTML Service)

Como um produto hospedado no Apps Script consome a biblioteca. **Nada neste documento pertence ao núcleo** — é especificidade da plataforma.

## A restrição que muda tudo

Um projeto Apps Script contém apenas `.gs`/`.js` (código de servidor), `.html` e o manifesto. **Ele não serve arquivos estáticos.** Não existe rota para um `.css`, e um `<link rel="stylesheet" href="variables.css">` aponta para o nada.

Logo, "CSS externo" no Apps Script significa **modularização na origem**, não no runtime. O CSS acaba inline no HTML servido; o que muda é a organização do repositório.

## Montagem

Crie um arquivo HTML por camada, cada um contendo um `<style>`:

- `styles_core.html` → conteúdo de `core/variables.css` + `core/utility-classes.css`
- `styles_theme.html` → conteúdo do tema do produto

No HTML principal, inclua nesta ordem:

```html
<?!= HtmlService.createHtmlOutputFromFile('styles_core').getContent(); ?>
<?!= HtmlService.createHtmlOutputFromFile('styles_theme').getContent(); ?>
```

**A ordem é obrigatória.** O tema sobrescreve o núcleo por cascata; invertida, as divergências do produto são perdidas silenciosamente. E as variáveis precisam existir antes de qualquer regra que as consuma.

## Allowlist de deploy

Se o projeto usa `.claspignore` como allowlist (`**/**` seguido de exceções nominais), **todo arquivo novo precisa ser adicionado**. Um arquivo que não sobe não é import quebrado: no Apps Script todos os arquivos compartilham um escopo global único, então o que falta é uma função ou um estilo que simplesmente não existe, no meio de um fluxo já em execução.

```
!styles_core.html
!styles_theme.html
```

## Fontes

O Apps Script **aceita** `<link>` para folhas de estilo externas — o Portal já carrega Google Fonts assim, dentro do iframe, e funciona.

O que não funciona é o Adobe Fonts: kits do Typekit são restritos por domínio. O kit da marca está autorizado para `estudioela.com` e falha em silêncio sob `script.google.com`, caindo no fallback. É por isso que o núcleo declara famílias servíveis em qualquer domínio, e não as originais.

## Segurança do HTML gerado

Duas regras que valem para qualquer produto Elã no Apps Script, e que nenhuma folha de estilo pode relaxar:

**Nenhum handler de evento inline.** Nada de `onclick="fn('valor')"`. Dados que vêm de células de planilha são editáveis por terceiros, e interpolá-los em atributo de evento é injeção — o parser HTML decodifica entidades no atributo antes de o JS parsear a string, então escapar não protege. Use `data-attributes` e um listener delegado.

**Sessão em `sessionStorage`, nunca `localStorage`.** Tokens de sessão do Apps Script são bearer puros, sem binding de IP ou User-Agent. Persistir além da aba transforma token esquecido em sequestro de sessão.
