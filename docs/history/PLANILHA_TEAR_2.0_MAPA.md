# PLANILHA TEAR 2.0 — MAPA ESTRUTURAL

> Contrato de dados extraído fisicamente de `TEAR_V2_OFICIAL.xlsx` (Contrato Soberano).
> Nomes de abas e colunas reproduzidos com **grafia exata** (case, espaços, acentos, `/`).
> Documento descritivo — **sem** implementação, modelos, repositórios ou controladores.

## Abas (11)

| # | Aba | Linhas | Natureza |
|---|-----|--------|----------|
| 1 | `CADASTROS` | 17 | Entrada (Google Forms) |
| 2 | `NVScriptsProperties` | 7 | Infra de add-on |
| 3 | `BASE DE DADOS` | 961 | **Fonte da verdade** |
| 4 | `FLUXO LOGÍSTICO` | 971 | Operacional |
| 5 | `ATIVAÇÕES` | 1961 | Operacional |
| 6 | `BRIEFING` | 987 | Operacional |
| 7 | `PAGAMENTOS` | 959 | Operacional |
| 8 | `HISTÓRICO DE CONTEÚDOS` | 39 | Histórico |
| 9 | `HISTÓRICO LOGÍSTICO` | 12 | Histórico |
| 10 | `HISTÓRICO DE PAGAMENTOS` | 27 | Histórico |
| 11 | `DO NOT DELETE - AutoCrat Job Se` | 3 | Infra de add-on (AutoCrat) |

> Contagens de linhas incluem o cabeçalho.

---

## 1. `CADASTROS`

Colunas (linha 1):

1. `Carimbo de data/hora`
2. `como prefere ser chamada (pode ser apelido + sobrenome, por exemplo)`
3. `seu melhor e-mail (será usado para assinar o contrato)`
4. `chave PIX`
5. `razão social`
6. `CNPJ`
7. `CEP`
8. `número (prédio, casa, condomínio...)`
9. `complemento (se houver: bloco, torre, apto...)`
10. `@dropdown`

## 2. `NVScriptsProperties`

1. `autocratn`
2. `autocratp`

## 3. `BASE DE DADOS`

1. `STATUS`
2. `INFLU_KEY`
3. `CUPOM`
4. `INFLUENCIADORA_RAZAO_SOCIAL`
5. `EMAIL`
6. `CHAVE_PIX`
7. `INFLUENCIADORA_CNPJ`
8. `CEP`
9. `RUA`
10. `NUMERO`
11. `COMPLEMENTO`
12. `BAIRRO`
13. `CIDADE`
14. `UF`
15. `INFLUENCIADORA_ENDERECO`
16. `VALOR_TOTAL`
17. `REELS_TEXTO`
18. `CARROSSEL_TEXTO`
19. `STORIES_TEXTO`
20. `VALOR_TOTAL_EXTENSO`
21. `LOOKS_QTD`
22. `LOOKS_QTD_TEXTO`
23. `CANAIS_USO_IMAGEM`
24. `PRAZO_USO_IMAGEM`
25. `CIDADE_ASSINATURA`
26. `DATA_ASSINATURA`
27. `MES_REFERENCIA`
28. `INFLU_SHEET_URL`
29. `PASTA_DRIVE_LINK`
30. `SIM/NÃO`

## 4. `FLUXO LOGÍSTICO`

1. `INFLU KEY`
2. `ENDERECO`
3. `STATUS REVISÃO`
4. `MES REFERENCIA`
5. `RASTREIO`
6. `DATA DE ENVIO`
7. `STATUS LOGISTICA`

## 5. `ATIVAÇÕES`

1. `INFLU_KEY`
2. `MES_REFERENCIA`
3. `FORMATO`
4. `DATA_APROVACAO`
5. `DATA_ATIVACAO`
6. `STATUS_CONTEUDO`
7. `LINK_ARQUIVO`
8. `ID`
9. `ANO_REFERENCIA`

## 6. `BRIEFING`

1. `INFLUENCIADORA`
2. `RESUMO DO MÊS`
3. `LOOK REEL`
4. `LOOK CARROSSEL`
5. `LOOK STORIES 1`
6. `LOOK STORIES 2`
7. `DATA REEL`
8. `DATA CARROSSEL`
9. `DATA STORIES 1`
10. `DATA STORIES 2`
11. `SOBRE REEL`
12. `SOBRE CARROSSEL`
13. `SOBRE STORIES 1`
14. `SOBRE STORIES 2`
15. `APROVACAO REEL`
16. `APROVACAO CARROSSEL`
17. `APROVACAO STORIES 1`
18. `APROVACAO STORIES 2`

## 7. `PAGAMENTOS`

1. `INFLU_KEY`
2. `MES_REFERENCIA`
3. `VALOR_TOTAL`
4. `CHAVE_PIX`
5. `STATUS_PAGAMENTO`
6. `DATA_PAGAMENTO`
7. `MENSAGEM_PIX`
8. `ANO_REFERENCIA`

## 8. `HISTÓRICO DE CONTEÚDOS`

1. `INFLU_KEY`
2. `MES_REFERENCIA`
3. `FORMATO`
4. `DATA_APROVACAO`
5. `DATA_ATIVACAO`
6. `STATUS_CONTEUDO`
7. `DATA_ARQUIVAMENTO`
8. `ID`
9. `ANO_REFERENCIA`

## 9. `HISTÓRICO LOGÍSTICO`

1. `INFLU_KEY`
2. `ENDERECO`
3. `STATUS REVISÃO`
4. `MES_REFERENCIA`
5. `RASTREIO`
6. `DATA_DE_ENVIO`
7. `STATUS_LOGISTICA`
8. `DATA_ARQUIVAMENTO`

## 10. `HISTÓRICO DE PAGAMENTOS`

1. `INFLU_KEY`
2. `MES_REFERENCIA`
3. `VALOR_TOTAL`
4. `CHAVE_PIX`
5. `STATUS_PAGAMENTO`
6. `DATA_PAGAMENTO`
7. `MENSAGEM_PIX`
8. `DATA_ARQUIVAMENTO`
9. `ANO_REFERENCIA`

## 11. `DO NOT DELETE - AutoCrat Job Se`

Aba de configuração do add-on **AutoCrat** (não é domínio de negócio):

1. `Job ID`
2. `Job Name`
3. `Template ID`
4. `Data Sheet ID`
5. `Header Row`
6. `First Data Row`
7. `File Name`
8. `File Type`
9. `Share As`
10. `Folders`
11. `Dynamic Folder Reference`
12. `Conditionals`
13. `Mode`
14. `Append Breaks`
15. `Tags`
16. `Run On Time Trigger`
17. `Time Trigger Frequency`
18. `Run On Form Trigger`
19. `Send Email And Share`
20. `Email To`
21. `Email CC`
22. `Email BCC`
23. `Email Reply To`
24. `Email No Reply`
25. `Email Subject`
26. `Email Body`
27. `Prevent Resharing`
28. `Time Trigger Timestamp`
29. `Form Trigger Timestamp`

---

## Observações (não normativas)

- **Chave de junção:** `INFLU_KEY` conecta `BASE DE DADOS` às abas operacionais e históricas. Em `FLUXO LOGÍSTICO` aparece como `INFLU KEY` (com espaço) e em `BRIEFING` como `INFLUENCIADORA` — grafias divergentes para o mesmo conceito.
- **Mês de competência:** `MES_REFERENCIA` (com variação `MES REFERENCIA` em `FLUXO LOGÍSTICO`). `ATIVAÇÕES`, `PAGAMENTOS` e históricos ainda trazem `ANO_REFERENCIA` separado.
- **Abas de infra (ignorar no domínio):** `NVScriptsProperties` e `DO NOT DELETE - AutoCrat Job Se`.
- **Sem CICLOS e sem PLANO_COLABORACAO:** confirmam-se ausentes — coerente com o Contrato Soberano.
