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

// A V2 é um projeto Apps Script separado (tear/), com allowlist própria — logo,
// uma segunda cópia do mesmo CSS. Vale a mesma trava: design-system/ é a fonte.
describe('tear/Styles.html — espelho do design-system', () => {
  // Consolidação: styles_core.html + styles_theme.html fundidos em Styles.html.
  test('Styles.html contém variables.css e utility-classes.css na íntegra', () => {
    const espelho = ler('tear', 'Styles.html');

    expect(espelho).toContain(ler('design-system', 'core', 'variables.css'));
    expect(espelho).toContain(ler('design-system', 'core', 'utility-classes.css'));
  });

  test('Styles.html contém o tema na íntegra', () => {
    expect(ler('tear', 'Styles.html')).toContain(ler('design-system', 'themes', 'portal.css'));
  });

  test('Styles.html é HTML válido para o HtmlService (todo <style> fechado)', () => {
    const conteudo = ler('tear', 'Styles.html');
    const abre = conteudo.match(/<style>/g) || [];
    const fecha = conteudo.match(/<\/style>/g) || [];

    // A fusão traz dois blocos <style> (núcleo e tema); ambos precisam fechar.
    expect(abre.length).toBe(2);
    expect(fecha.length).toBe(abre.length);
    expect(conteudo.indexOf('<style>')).toBeLessThan(conteudo.indexOf('</style>'));
  });

  test('Styles.html traz o núcleo antes do tema (cascata núcleo → tema)', () => {
    // A ordem que antes vivia nos includes do Index agora é a ordem das seções
    // dentro do arquivo fundido — a mesma garantia de cascata.
    const styles = ler('tear', 'Styles.html');

    const posNucleo = styles.indexOf(ler('design-system', 'core', 'variables.css'));
    const posTema = styles.indexOf(ler('design-system', 'themes', 'portal.css'));

    expect(posNucleo).toBeGreaterThan(-1);
    expect(posTema).toBeGreaterThan(posNucleo);
  });

  // A "ponte de compatibilidade" do tema (--bg, --primary, --text…) existe só
  // para o mae/Index.html da V1, que ainda não migrou para os nomes --ela-*.
  // Se a V2 depender dela, remover a ponte quebra a V2 em silêncio: a variável
  // some, o CSS não falha, a cor só sai errada.
  test('a V2 usa os tokens canônicos --ela-*, nunca os aliases de ponte', () => {
    const componentes = ler('tear', 'Templates.html');
    const aliasesDePonte = [
      '--bg', '--bg-container', '--bg-container-low', '--bg-container-high',
      '--surface-lowest', '--text', '--text-muted', '--text-faint', '--hairline',
      '--primary', '--primary-strong', '--on-primary', '--error',
      '--font-display', '--font-label', '--font-body'
    ];

    const usados = aliasesDePonte.filter((alias) =>
      new RegExp(`var\\(\\s*${alias}\\s*[,)]`).test(componentes)
    );

    expect(usados).toEqual([]);
  });

  // O protótipo do Stitch carrega Tailwind e Google Fonts por CDN e usa onclick
  // inline. Nada disso pode atravessar para o que o Apps Script serve.
  test('nada do protótipo vaza para os arquivos servidos', () => {
    for (const arquivo of ['Index.html', 'Templates.html']) {
      const conteudo = ler('tear', arquivo);

      expect(conteudo).not.toMatch(/cdn\.tailwindcss\.com/);
      expect(conteudo).not.toMatch(/\son[a-z]+\s*=\s*["']/);
    }
  });
});
