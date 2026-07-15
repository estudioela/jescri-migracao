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
 * Débito registrado (ADR-004): `Repositories.js` na raiz do repo já existe
 * (ParceiroRepository) e será migrado para esta camada em M1 — não movido
 * no Sprint 0 para não antecipar o slice nem alterar arquitetura.
 */
