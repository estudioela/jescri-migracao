/**
 * CAMADA: ACL — contrato de interface (esqueleto Sprint 0, sem implementação).
 *
 * Responsabilidade única: ACL única do sistema (invariante Freeze §4).
 * Único ponto que conhece a coluna física da planilha; faz coerção
 * cru→canônico com fail-fast (enum desconhecido = erro barulhento).
 * PII nunca vaza para log/evento/Snapshot.
 *
 * Pode depender de: SpreadsheetApp (leitura/escrita física).
 * NÃO pode: conter regra de negócio; ser duplicada (ACL é única).
 *
 * Débito da ADR-004 resolvida (2026-07-16): `ACL.js` legado da raiz
 * removido — a migração para esta camada já estava completa em
 * `src/acl/*.js`, só faltava apagar o arquivo morto.
 */
