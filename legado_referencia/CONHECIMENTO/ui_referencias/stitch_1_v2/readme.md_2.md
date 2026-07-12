# Estúdio Elã - Design System Package

Este pacote contém a infraestrutura de Design Tokens do Estúdio Elã. A única fonte de verdade absoluta e institucional é o vermelho `#a1231f`. Todos os demais valores e tokens são derivações técnicas ou observadas para viabilizar a implementação da identidade visual.

## Arquitetura do Pacote

O sistema segue uma hierarquia rigorosa:

1.  **Primitivos (`tokens.json`)**: Definição de valores base.
2.  **Semânticos (`tokens.json`)**: Aliases que atribuem significado (ex: `surface.inverse` aponta para `primitive.color.accent`).
3.  **Variáveis CSS (`variables.css`)**: Implementação em tempo de execução.
4.  **Utilities (`utilities.css`)**: Classes utilitárias que consomem exclusivamente as variáveis.

## Notas Técnicas Importantes

### Media Queries e Variáveis CSS
**Atenção:** Variáveis CSS (`var(--breakpoint-*)`) **não funcionam** dentro de regras `@media`. Por este motivo, as media queries no arquivo `utilities.css` utilizam o valor literal `768px`. Esta é a **única exceção permitida** à regra de não utilizar valores literais no código.

## Fontes e Tipografia

-   **Sans**: `acumin-pro`.
-   **Serif Editorial**: `ivypresto-display`. Refletida semanticamente como `italic` por diretriz visual.
-   **Nota**: O texto institucional permanece em minúsculas. Não utilize `text-transform: uppercase`.

## Valores Inferidos

Abaixo estão listados os valores que foram inferidos tecnicamente para garantir a integridade do sistema, uma vez que não estavam explicitamente quantificados na fonte original:

| Token | Justificativa Técnica |
| :--- | :--- |
| `color.dark` (#3a3838) | Observado em produção como cor principal de texto, mas não nominalmente definido como token original. |
| `color.black` (#000000) | Observado em elementos de alto contraste. |
| `font-weight-semi` (600) | Peso observado em headings e elementos de destaque. |
| `font-size-xs` a `3xl` | Escala tipográfica inferida para hierarquia. |
| `spacing-xs` a `2xl` | Escala de 8pt adaptada para ritmo vertical. |
| `radius-*` e `shadow-*` | Modelados para suportar elevações e arredondamentos comuns em UI moderna. |
| `line-height` e `letter-spacing` | Ajustes de legibilidade baseados no comportamento das fontes Acumin e IvyPresto. |
| `motion.duration.base` (0.6s) | Valor para suavizar entradas observadas. |
| `motion.easing.out` | Curva de aceleração para feeling "premium". |
| `safe-area-top/bottom` | Suporte a dispositivos móveis modernos. |

## Manutenção

1. Altere o valor no `tokens.json`.
2. Reflita a mudança em `variables.css`.
3. As utilities atualizarão automaticamente, exceto media queries que exigem alteração manual do literal.

**Nunca** utilize valores literais (hardcoded) nos arquivos de estilo da aplicação; utilize sempre as variáveis CSS fornecidas.