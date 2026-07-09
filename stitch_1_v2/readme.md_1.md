# Estúdio Elã - Design System Package

Este pacote contém a infraestrutura de Design Tokens do Estúdio Elã, extraída diretamente da implementação oficial em produção.

## Arquitetura do Pacote

O sistema segue uma hierarquia rigorosa para garantir consistência e escalabilidade:

1.  **Primitivos (`tokens.json`)**: Definição bruta de valores (cores, famílias tipográficas, escalas de espaçamento).
2.  **Semânticos (`tokens.json`)**: Aliases que atribuem significado aos primitivos (ex: `color.text.default` aponta para `primitive.color.dark`).
3.  **Variáveis CSS (`variables.css`)**: Implementação dos tokens em nível de runtime via CSS Variables.
4.  **Utilities (`utilities.css`)**: Classes utilitárias de propósito único que consomem exclusivamente as variáveis.

## Como Utilizar

### Ambiente Google Apps Script (HTML Service)

Para utilizar no Google Apps Script, insira o conteúdo de `variables.css` e `utilities.css` dentro de uma tag `<style>` no seu arquivo HTML principal.

```html
<style>
  /* Inserir conteúdo de variables.css */
  /* Inserir conteúdo de utilities.css */
</style>
```

### Frameworks Modernos (React, Vue, Next.js)

Os tokens definidos em `tokens.json` seguem o padrão W3C, permitindo a integração com ferramentas como **Style Dictionary** para gerar definições de tipos para TypeScript, variáveis SCSS ou objetos JavaScript.

## Fontes e Tipografia

As fontes não são carregadas automaticamente por este pacote. A aplicação hospedeira deve garantir o carregamento das seguintes famílias (ou seus fallbacks):

-   **Sans**: `acumin-pro`
-   **Serif Editorial**: `ivypresto-display`

**Nota**: Por diretriz de marca, o texto institucional permanece em minúsculas. Não utilize `text-transform: uppercase`.

## Valores Inferidos

Os seguintes valores foram inferidos tecnicamente para garantir a integridade do sistema, dado que não estavam explicitamente quantificados como tokens no CSS original:

| Token | Justificativa Técnica |
| :--- | :--- |
| `font-size-xs` a `font-size-3xl` | Escala tipográfica baseada em observação visual para permitir hierarquia clara. |
| `spacing-xs` a `spacing-2xl` | Escala de espaçamento (8pt grid adaptada) para garantir ritmo vertical e respiro. |
| `motion.duration.base` | Valor de 0.6s inferido para suavizar animações de entrada por scroll observadas. |
| `motion.easing.out` | Curva de aceleração para garantir o feeling "premium" e orgânico da marca. |
| `safe-area-top/bottom` | Necessário para suporte a dispositivos móveis modernos (notches). |

## Manutenção e Evolução

Para atualizar o sistema:
1. Altere o valor no `tokens.json`.
2. Reflita a mudança em `variables.css`.
3. As utilities atualizarão automaticamente por herança de variável.

**Nunca** utilize valores literais (hardcoded) nos arquivos de estilo da aplicação; utilize sempre as variáveis CSS fornecidas.