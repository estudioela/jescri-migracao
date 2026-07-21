import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { campanhaStatusTone, getCampanha, type Campanha } from '../../lib/campanhas';
import { participacaoStatusTone } from '../../lib/participacoes';
import { listBriefings, type Briefing } from '../../lib/briefings';
import {
  listMateriais,
  materialStatusTone,
  uploadMaterial,
  type Material,
  type MaterialTipo,
} from '../../lib/materiais';
import { getPagamento, pagamentoStatusTone, type Pagamento } from '../../lib/pagamentos';
import Badge from '../../components/Badge';
import SelectField from '../../components/SelectField';
import Button from '../../components/Button';
import styles from '../CampanhaDetailPage.module.css';

const TIPOS_MATERIAL: MaterialTipo[] = ['REELS', 'STORIES', 'FOTOS', 'OUTROS'];

export default function PortalCampanhaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [briefings, setBriefings] = useState<Briefing[] | null>(null);
  const [briefingsError, setBriefingsError] = useState<string | null>(null);

  const [materiais, setMateriais] = useState<Material[] | null>(null);
  const [materiaisError, setMateriaisError] = useState<string | null>(null);
  const [tipoMaterial, setTipoMaterial] = useState<MaterialTipo>('REELS');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [pagamento, setPagamento] = useState<Pagamento | null | undefined>(undefined);
  const [pagamentoError, setPagamentoError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getCampanha(id)
      .then(setCampanha)
      .catch(() => setError('Não foi possível carregar esta campanha.'));
  }, [id]);

  const participacaoId = campanha?.participacoes[0]?.id;

  useEffect(() => {
    if (!participacaoId) return;
    listBriefings(participacaoId)
      .then(setBriefings)
      .catch(() => setBriefingsError('Não foi possível carregar o briefing desta participação.'));
  }, [participacaoId]);

  function carregarMateriais() {
    if (!participacaoId) return;
    listMateriais(participacaoId)
      .then(setMateriais)
      .catch(() => setMateriaisError('Não foi possível carregar os materiais enviados.'));
  }

  useEffect(carregarMateriais, [participacaoId]);

  useEffect(() => {
    if (!participacaoId) return;
    getPagamento(participacaoId)
      .then(setPagamento)
      .catch(() => setPagamentoError('Não foi possível carregar o pagamento desta participação.'));
  }, [participacaoId]);

  async function handleUpload(event: FormEvent) {
    event.preventDefault();
    if (!participacaoId) return;
    const arquivo = fileInputRef.current?.files?.[0];
    if (!arquivo) {
      setUploadError('Selecione um arquivo para enviar.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    try {
      await uploadMaterial(participacaoId, tipoMaterial, arquivo);
      if (fileInputRef.current) fileInputRef.current.value = '';
      carregarMateriais();
    } catch {
      setUploadError('Não foi possível enviar o material. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  }

  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  if (!campanha) {
    return <p className={styles.loading}>Carregando…</p>;
  }

  const minhaParticipacao = campanha.participacoes[0] ?? null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>{campanha.nome}</h2>
          <p className={styles.subtitle}>{campanha.marca.nome}</p>
          <div className={styles.statusRow}>
            <Badge label={campanha.status} tone={campanhaStatusTone(campanha.status)} />
          </div>
        </div>
      </header>

      <section className={styles.group}>
        <h3 className={styles.groupTitle}>Período</h3>
        <p className={styles.periodo}>
          {campanha.data_inicio}
          {campanha.data_fim ? ` – ${campanha.data_fim}` : ' (sem data de fim definida)'}
        </p>
        {campanha.descricao && <p className={styles.descricao}>{campanha.descricao}</p>}
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupTitle}>Sua participação</h3>

        {minhaParticipacao === null ? (
          <p className={styles.descricao}>Nenhuma participação encontrada para esta campanha.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Valor</th>
                <th>Reels</th>
                <th>Carrossel</th>
                <th>Stories</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  {minhaParticipacao.valor_contratado === null
                    ? '—'
                    : `R$ ${minhaParticipacao.valor_contratado.toFixed(2)}`}
                </td>
                <td>{minhaParticipacao.reels_qtd}</td>
                <td>{minhaParticipacao.carrossel_qtd}</td>
                <td>{minhaParticipacao.stories_qtd}</td>
                <td>
                  <Badge
                    label={minhaParticipacao.status}
                    tone={participacaoStatusTone(minhaParticipacao.status)}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </section>

      {minhaParticipacao !== null && (
        <section className={styles.group}>
          <h3 className={styles.groupTitle}>Briefing</h3>

          {briefingsError && <p className={styles.error}>{briefingsError}</p>}

          {briefings === null && !briefingsError && (
            <p className={styles.loading}>Carregando…</p>
          )}

          {briefings?.length === 0 && (
            <p className={styles.descricao}>Nenhum briefing publicado ainda para esta participação.</p>
          )}

          {briefings !== null && briefings.length > 0 && (
            <div className={styles.briefingList}>
              {briefings.map((briefing) => (
                <article key={briefing.id} className={styles.briefingCard}>
                  <div className={styles.briefingHeader}>
                    <Badge label={briefing.tipo} tone="neutral" />
                    <span className={styles.briefingPrazo}>prazo: {briefing.prazo}</span>
                  </div>
                  <p className={styles.descricao}>{briefing.orientacoes}</p>
                  {briefing.referencias && briefing.referencias.length > 0 && (
                    <ul className={styles.briefingReferencias}>
                      {briefing.referencias.map((referencia, index) => (
                        <li key={index}>{referencia}</li>
                      ))}
                    </ul>
                  )}
                  {briefing.entregaveis_esperados && (
                    <p className={styles.descricao}>
                      <strong>Entregáveis esperados:</strong> {briefing.entregaveis_esperados}
                    </p>
                  )}
                  {briefing.observacoes && (
                    <p className={styles.descricao}>
                      <strong>Observações:</strong> {briefing.observacoes}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {minhaParticipacao !== null && (
        <section className={styles.group}>
          <h3 className={styles.groupTitle}>Materiais</h3>

          {materiaisError && <p className={styles.error}>{materiaisError}</p>}

          {materiais === null && !materiaisError && (
            <p className={styles.loading}>Carregando…</p>
          )}

          {materiais?.length === 0 && (
            <p className={styles.descricao}>Nenhum material enviado ainda para esta participação.</p>
          )}

          {materiais !== null && materiais.length > 0 && (
            <div className={styles.briefingList}>
              {materiais.map((material) => (
                <article key={material.id} className={styles.briefingCard}>
                  <div className={styles.briefingHeader}>
                    <div>
                      <Badge label={material.tipo} tone="neutral" />
                      <span className={styles.materialNome}>{material.nome_arquivo}</span>
                    </div>
                    <Badge
                      label={material.status}
                      tone={materialStatusTone(material.status)}
                    />
                  </div>
                  {material.drive_file_url && (
                    <a
                      href={material.drive_file_url}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.actionLink}
                    >
                      ver arquivo
                    </a>
                  )}
                  {material.status === 'REPROVADO' && material.motivo_reprovacao && (
                    <p className={styles.descricao}>
                      <strong>Motivo:</strong> {material.motivo_reprovacao}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}

          {minhaParticipacao.status === 'ATIVA' && (
            <form className={styles.vincularForm} onSubmit={handleUpload} noValidate>
              <SelectField
                label="Tipo"
                value={tipoMaterial}
                onChange={(event) => setTipoMaterial(event.target.value as MaterialTipo)}
              >
                {TIPOS_MATERIAL.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </SelectField>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="material-arquivo">
                  Arquivo
                </label>
                <input
                  id="material-arquivo"
                  type="file"
                  ref={fileInputRef}
                  className={styles.fileInput}
                />
              </div>

              {uploadError && (
                <p className={styles.formError} role="alert">
                  {uploadError}
                </p>
              )}

              <Button
                type="submit"
                isLoading={isUploading}
                loadingText="enviando…"
                className={styles.submit}
              >
                enviar material
              </Button>
            </form>
          )}
        </section>
      )}

      {minhaParticipacao !== null && (
        <section className={styles.group}>
          <h3 className={styles.groupTitle}>Pagamento</h3>

          {pagamentoError && <p className={styles.error}>{pagamentoError}</p>}

          {pagamento === undefined && !pagamentoError && (
            <p className={styles.loading}>Carregando…</p>
          )}

          {pagamento === null && (
            <p className={styles.descricao}>
              Nenhum pagamento registrado ainda para esta participação.
            </p>
          )}

          {pagamento && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Valor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{`R$ ${pagamento.valor.toFixed(2)}`}</td>
                  <td>
                    <Badge label={pagamento.status} tone={pagamentoStatusTone(pagamento.status)} />
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </section>
      )}

      <Link to="/campanhas" className={styles.backLink}>
        ← voltar para a lista
      </Link>
    </div>
  );
}
