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
 * Débito registrado (ADR-004): `ACL.js` na raiz do repo já existe e será
 * migrado para esta camada em M1 — não movido no Sprint 0.
 */
