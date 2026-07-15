/**
 * CAMADA: Controller — contrato de interface (esqueleto Sprint 0, sem implementação).
 *
 * Responsabilidade única: adaptar o contrato externo. Recebe a chamada do
 * Entrypoint, invoca o Service e devolve SEMPRE o envelope padrão
 * `{success,data}` / `{success,error}` (PROJECT_GOVERNANCE §3.3, via `envelopeOk`/`envelopeFail`).
 *
 * Pode depender de: Service, shared/Envelope.
 * NÃO pode: tocar SpreadsheetApp; conter regra de negócio; conhecer coluna física.
 *
 * Nenhum controller concreto existe neste Sprint (sem feature de negócio).
 */
