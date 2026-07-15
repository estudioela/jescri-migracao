/**
 * CAMADA: Adaptadores — contrato de interface (esqueleto Sprint 0, sem implementação).
 *
 * Responsabilidade única: isolar dependências externas com adaptador único
 * por dependência e FALHA DEGRADÁVEL (invariante Freeze §4): se a
 * dependência cai, a operação principal segue.
 *
 * Adaptadores previstos (não implementados aqui): CEP, Rastreio,
 * Storage(Drive), Documentos.
 *
 * Pode depender de: UrlFetchApp, DriveApp (conforme o adaptador).
 * NÃO pode: conter regra de negócio; ser mais de um por dependência.
 */
