/**
 * Trava de deploy: todo arquivo deployável de mae/ tem que estar na allowlist
 * de mae/.claspignore — e vice-versa.
 *
 * Por que este teste existe (CLAUDE.md §6, incidente 2026-07-05; §12.4.4):
 * `mae/.claspignore` ignora tudo (`**\/**`) e reabilita arquivo por arquivo
 * (`!Código.js`). Um arquivo novo em mae/ que ninguém adicione à lista:
 *
 *   - passa no Jest (os testes leem do disco, não do projeto Apps Script);
 *   - passa no `clasp push` sem erro nenhum (só não sobe);
 *   - explode em PRODUÇÃO, como ReferenceError, na primeira chamada.
 *
 * No Apps Script todos os arquivos compartilham um único escopo global, então
 * um módulo que não subiu não é "um import quebrado": é uma função que
 * simplesmente não existe, no meio de um fluxo que já está rodando. É o modo
 * de falha mais caro da modularização da V2 — daí a trava ser automática.
 *
 * A recíproca também é testada: uma entrada `!X` apontando para um arquivo que
 * não existe mais é lixo que mascara a intenção da allowlist.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');

// Extensões que o clasp de fato envia para o projeto Apps Script. Um .md ou um
// .txt dentro de mae/ (ex.: mae/legacy/) não é deployável e não pertence à lista.
const EXTENSOES_DEPLOYAVEIS = ['.js', '.gs', '.html', '.json'];

// Dotfiles em mae/ configuram o clasp, não são enviados por ele: .clasp.json
// (scriptId/rootDir) e o próprio .claspignore. appsscript.json não é dotfile —
// é o manifest, e esse sobe.
const ehConfigDoClasp = (p) => path.basename(p).startsWith('.');

// macOS entrega nomes de arquivo em NFD ("Código" = "Codigo" + acento
// combinante); o git e o .claspignore podem carregar NFC. Comparar sem
// normalizar faz "Código.js" !== "Código.js".
const normalizar = (s) => s.normalize('NFC');

// Cada raiz é um projeto clasp independente, com scriptId próprio.
const RAIZES_CLASP = ['mae', 'tear'];

function entradasDaAllowlist(raiz) {
  const linhas = fs.readFileSync(path.join(RAIZ, raiz, '.claspignore'), 'utf8')
    .split('\n')
    .map((l) => l.trim());
  return linhas.filter((l) => l.startsWith('!')).map((l) => normalizar(l.slice(1).trim()));
}

function arquivosDeployaveisRastreados(raiz) {
  const saida = execFileSync('git', ['ls-files', '-z', raiz], { cwd: RAIZ, encoding: 'utf8' });
  return saida
    .split('\0')
    .filter(Boolean)
    .map((p) => normalizar(p))
    .filter((p) => EXTENSOES_DEPLOYAVEIS.includes(path.extname(p)))
    .filter((p) => !ehConfigDoClasp(p))
    .map((p) => p.replace(new RegExp(`^${raiz}/`), '')); // .claspignore é relativo à raiz (rootDir: "")
}

describe.each(RAIZES_CLASP)('%s/.claspignore — allowlist de deploy', (raiz) => {
  test('a base "ignora tudo" existe (sem ela, a allowlist não significa nada)', () => {
    const linhas = fs.readFileSync(path.join(RAIZ, raiz, '.claspignore'), 'utf8')
      .split('\n')
      .map((l) => l.trim());
    expect(linhas).toContain('**/**');
  });

  test('todo arquivo deployável rastreado está na allowlist', () => {
    const naAllowlist = new Set(entradasDaAllowlist(raiz));
    const ausentes = arquivosDeployaveisRastreados(raiz).filter((f) => !naAllowlist.has(f));

    expect(ausentes).toEqual([]);
  });

  test('toda entrada da allowlist aponta para um arquivo que existe', () => {
    const orfas = entradasDaAllowlist(raiz).filter(
      (entrada) => !fs.existsSync(path.join(RAIZ, raiz, entrada))
    );

    expect(orfas).toEqual([]);
  });
});

// Sem esta trava, um segundo projeto clasp apontando para o MESMO scriptId de
// produção transformaria `clasp push` de dentro dele numa sobrescrita silenciosa
// do script ao vivo. Já aconteceu neste repositório em 2026-07-05
// (CLAUDE.md seção 6, "projeto clasp duplicado na raiz").
describe('projetos clasp — isolamento de scriptId', () => {
  test('cada raiz aponta para um scriptId distinto', () => {
    const ids = RAIZES_CLASP.map((raiz) => {
      const conf = JSON.parse(fs.readFileSync(path.join(RAIZ, raiz, '.clasp.json'), 'utf8'));
      return conf.scriptId;
    });

    expect(new Set(ids).size).toBe(RAIZES_CLASP.length);
  });
});
