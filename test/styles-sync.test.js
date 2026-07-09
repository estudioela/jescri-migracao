/**
 * Trava de fonte única: o CSS servido pelo Apps Script tem que ser
 * byte-a-byte o mesmo que o do Design System.
 *
 * Por que este teste existe (CLAUDE.md §11, "não criar nova fonte de verdade"):
 * o Apps Script não serve arquivos estáticos — não existe rota para um .css.
 * O único jeito de consumir a biblioteca é espelhar o conteúdo dentro de um
 * arquivo .html com <style>, incluído via HtmlService.
 *
 * Isso cria duas cópias do mesmo CSS. Sem esta trava, alguém edita
 * design-system/core/variables.css, o Portal continua servindo a versão
 * antiga, e ninguém percebe até um bug de cor em produção.
 *
 * A direção é: design-system/ é a fonte, mae/styles_*.html é o espelho.
 * Ao alterar a fonte, regenere o espelho.
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');

const ler = (...p) => fs.readFileSync(path.join(RAIZ, ...p), 'utf8');

describe('mae/styles_*.html — espelho do design-system', () => {
  test('styles_core.html contém variables.css e utility-classes.css na íntegra', () => {
    const espelho = ler('mae', 'styles_core.html');

    expect(espelho).toContain(ler('design-system', 'core', 'variables.css'));
    expect(espelho).toContain(ler('design-system', 'core', 'utility-classes.css'));
  });

  test('styles_theme.html contém o tema do Portal na íntegra', () => {
    const espelho = ler('mae', 'styles_theme.html');

    expect(espelho).toContain(ler('design-system', 'themes', 'portal.css'));
  });

  test('os espelhos são HTML válidos para o HtmlService (um <style> fechado)', () => {
    for (const arquivo of ['styles_core.html', 'styles_theme.html']) {
      const conteudo = ler('mae', arquivo);

      expect(conteudo.match(/<style>/g)).toHaveLength(1);
      expect(conteudo.match(/<\/style>/g)).toHaveLength(1);
      expect(conteudo.indexOf('<style>')).toBeLessThan(conteudo.indexOf('</style>'));
    }
  });

  test('Index.html inclui núcleo antes do tema, e não redeclara as variáveis', () => {
    const index = ler('mae', 'Index.html');

    const posNucleo = index.indexOf("include('styles_core')");
    const posTema = index.indexOf("include('styles_theme')");

    expect(posNucleo).toBeGreaterThan(-1);
    expect(posTema).toBeGreaterThan(posNucleo);

    // O bloco :root literal saiu do Index.html; as variáveis vêm dos includes.
    // Se voltar, a cascata passa a depender de qual vem por último.
    expect(index).not.toMatch(/--bg\s*:\s*#fdf8f8/);
    expect(index).not.toMatch(/--primary\s*:\s*#8f0002/);
  });
});
