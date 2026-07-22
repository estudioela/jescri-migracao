# Contratos de camada (ex-`_contract.js`)

> Conteúdo migrado na íntegra dos 6 arquivos `src/<camada>/_contract.js`
> (ADR-014, etapa 2). Os contratos valem integralmente; mudou apenas o
> endereço — de comentário publicado em produção para documentação.

## Camada: domain


CAMADA: Domínio — contrato de interface (esqueleto Sprint 0, sem implementação).

Responsabilidade única: regra pura na linguagem ubíqua (ADR-003).
Entidades, Value Objects e enums fechados fail-fast (ADR-001).

Pode depender de: nada externo — código puro.
NÃO pode: conhecer HTTP, HtmlService, SpreadsheetApp ou coluna física.

IMPORTANTE: nenhuma entidade de negócio (ex.: Parceira) é criada no
Sprint 0. O domínio nasce vazio; será preenchido no primeiro Vertical
Slice (M1), fora do escopo deste sprint.

## Camada: acl


CAMADA: ACL — contrato de interface (esqueleto Sprint 0, sem implementação).

Responsabilidade única: ACL única do sistema (invariante Freeze §4).
Único ponto que conhece a coluna física da planilha; faz coerção
cru→canônico com fail-fast (enum desconhecido = erro barulhento).
PII nunca vaza para log/evento/Snapshot.

Pode depender de: SpreadsheetApp (leitura/escrita física).
NÃO pode: conter regra de negócio; ser duplicada (ACL é única).

Débito da ADR-004 resolvida (2026-07-16): `ACL.js` legado da raiz
removido — a migração para esta camada já estava completa em
`src/acl/*.js`, só faltava apagar o arquivo morto.

## Camada: repository


CAMADA: Repository — contrato de interface (esqueleto Sprint 0, sem implementação).

Responsabilidade única: persistência. Único ponto (junto da ACL) que
fala com dados; define projeção explícita de campos (§3.5); acessa a
planilha SEMPRE por cabeçalho, nunca por índice, e SEMPRE via ACL.

Pode depender de: ACL, Domínio.
NÃO pode: conter regra de negócio; formatar envelope.

Débito da ADR-004 resolvida (2026-07-16): `Repositories.js` legado da
raiz removido — a migração para esta camada já estava completa em
`src/repository/*.js`, só faltava apagar o arquivo morto.

## Camada: service


CAMADA: Service — contrato de interface (esqueleto Sprint 0, sem implementação).

Responsabilidade única: orquestrar casos de uso. Coordena Domínio,
Repository e Adaptadores; aplica falha degradável onde a dependência
externa não é essencial (roadmap §1, Freeze §4).

Pode depender de: Domínio, Repository, Adaptadores.
NÃO pode: falar HTTP/HTML; formatar envelope (isso é do Controller);
conhecer coluna física (isso é da ACL).

Nenhum service concreto existe neste Sprint (sem feature de negócio).

## Camada: controller


CAMADA: Controller — contrato de interface (esqueleto Sprint 0, sem implementação).

Responsabilidade única: adaptar o contrato externo. Recebe a chamada do
Entrypoint, invoca o Service e devolve SEMPRE o envelope padrão
`{success,data}` / `{success,error}` (PROJECT_GOVERNANCE §3.3, via `envelopeOk`/`envelopeFail`).

Pode depender de: Service, shared/Envelope.
NÃO pode: tocar SpreadsheetApp; conter regra de negócio; conhecer coluna física.

Nenhum controller concreto existe neste Sprint (sem feature de negócio).

## Camada: adapters


CAMADA: Adaptadores — contrato de interface (esqueleto Sprint 0, sem implementação).

Responsabilidade única: isolar dependências externas com adaptador único
por dependência e FALHA DEGRADÁVEL (invariante Freeze §4): se a
dependência cai, a operação principal segue.

Adaptadores previstos (não implementados aqui): CEP, Rastreio,
Storage(Drive), Documentos.

Pode depender de: UrlFetchApp, DriveApp (conforme o adaptador).
NÃO pode: conter regra de negócio; ser mais de um por dependência.
