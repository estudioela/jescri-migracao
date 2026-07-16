/**
 * CAMADA: Repository — contrato de interface (esqueleto Sprint 0, sem implementação).
 *
 * Responsabilidade única: persistência. Único ponto (junto da ACL) que
 * fala com dados; define projeção explícita de campos (§3.5); acessa a
 * planilha SEMPRE por cabeçalho, nunca por índice, e SEMPRE via ACL.
 *
 * Pode depender de: ACL, Domínio.
 * NÃO pode: conter regra de negócio; formatar envelope.
 *
 * Débito da ADR-004 resolvida (2026-07-16): `Repositories.js` legado da
 * raiz removido — a migração para esta camada já estava completa em
 * `src/repository/*.js`, só faltava apagar o arquivo morto.
 */
