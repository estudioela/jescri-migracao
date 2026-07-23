import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { getMeParticipacao, type MeParticipacao } from '../../lib/me';
import { listBriefings, type Briefing, type TipoConteudo } from '../../lib/briefings';
import { getPagamento, pagamentoStatusTone, type Pagamento } from '../../lib/pagamentos';
import {
  listMateriais,
  materialStatusTone,
  uploadMaterial,
  type Material,
} from '../../lib/materiais';
import Badge from '../../components/Badge';
import styles from './PortalParticipacaoPage.module.css';

const TIPOS: TipoConteudo[] = ['FEED', 'REELS', 'STORIES', 'TIKTOK', 'UGC'];
const ROTULO: Record<TipoConteudo, string> = {
  FEED: 'Feed',
  REELS: 'Reels',
  STORIES: 'Stories',
  TIKTOK: 'TikTok',
  UGC: 'UGC',
};

function prazoRelativo(prazo: string): string {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataPrazo = new Date(`${prazo}T00:00:00`);
  const dias = Math.round((dataPrazo.getTime() - hoje.getTime()) / 86400000);

  if (dias < 0) return `atrasado há ${Math.abs(dias)} dia${Math.abs(dias) === 1 ? '' : 's'}`;
  if (dias === 0) return 'hoje';
  return `faltam ${dias} dia${dias === 1 ? '' : 's'}`;
}

export default function PortalParticipacaoPage() {
  const { participacaoId } = useParams<{ participacaoId: string }>();
  const navigate = useNavigate();
  const [participacao, setParticipacao] = useState<MeParticipacao | null>(null);
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [pagamento, setPagamento] = useState<Pagamento | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [enviandoBriefingId, setEnviandoBriefingId] = useState<number | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!participacaoId) return;

    getMeParticipacao(participacaoId)
      .then((data) => {
        setParticipacao(data);
        return Promise.all([
          listBriefings(participacaoId),
          getPagamento(participacaoId),
          listMateriais(participacaoId),
        ]);
      })
      .then(([briefingsData, pagamentoData, materiaisData]) => {
        setBriefings(briefingsData);
        setPagamento(pagamentoData);
        setMateriais(materiaisData);
      })
      .catch((err) => {
        if (isAxiosError(err) && (err.response?.status === 403 || err.response?.status === 404)) {
          navigate('/', { replace: true });
          return;
        }
        setError('Não foi possível carregar esta participação.');
      })
      .finally(() => setIsLoading(false));
  }, [participacaoId, navigate]);

  async function handleUpload(briefingId: number, files: FileList | null) {
    if (!files || files.length === 0 || !participacaoId) return;

    setEnviandoBriefingId(briefingId);
    setUploadErrors((atual) => ({ ...atual, [briefingId]: '' }));

    try {
      const novos: Material[] = [];
      for (const arquivo of Array.from(files)) {
        novos.push(await uploadMaterial(participacaoId, briefingId, arquivo));
      }
      setMateriais((atual) => [...novos, ...atual]);
    } catch {
      setUploadErrors((atual) => ({
        ...atual,
        [briefingId]: 'Não foi possível enviar o material. Tente novamente.',
      }));
    } finally {
      setEnviandoBriefingId(null);
    }
  }

  if (isLoading) {
    return <p className={styles.loading}>Carregando…</p>;
  }

  if (error || !participacao) {
    return <p role="alert">{error ?? 'Participação indisponível.'}</p>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.title}>{participacao.campanha.nome}</h2>
        <p className={styles.subtitle}>{participacao.campanha.marca.nome}</p>
        <p className={styles.periodo}>
          {participacao.campanha.data_inicio}
          {participacao.campanha.data_fim ? ` – ${participacao.campanha.data_fim}` : ''}
        </p>
        <div className={styles.resumo}>
          {TIPOS.map((tipo) => {
            const qtd = participacao.entregaveis_contratados[tipo];
            return (
              <span key={tipo} className={qtd > 0 ? styles.resumoItem : styles.resumoItemVazio}>
                {ROTULO[tipo]} {qtd}
              </span>
            );
          })}
        </div>
      </header>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Briefing e materiais</h3>
        {TIPOS.filter((tipo) => participacao.entregaveis_contratados[tipo] > 0).map((tipo) => {
          const briefing = briefings.find((b) => b.tipo === tipo);

          if (!briefing) {
            return (
              <div key={tipo} className={styles.briefingBlocoVazio}>
                briefing de {ROTULO[tipo]} ainda não publicado
              </div>
            );
          }

          const materiaisDoBriefing = materiais.filter((m) => m.briefing_id === briefing.id);
          const contratado = participacao.entregaveis_contratados[tipo];
          const podeEnviar = materiaisDoBriefing.length < contratado;
          const enviandoAgora = enviandoBriefingId === briefing.id;

          return (
            <div key={tipo} className={styles.briefingBloco}>
              <h4 className={styles.briefingTipo}>{ROTULO[tipo]}</h4>
              <p className={styles.briefingOrientacoes}>{briefing.orientacoes}</p>
              <p className={styles.briefingPrazo}>
                entrega até {briefing.prazo} — {prazoRelativo(briefing.prazo)}
              </p>
              {briefing.entregaveis_esperados && <p>{briefing.entregaveis_esperados}</p>}
              <p className={styles.briefingProgresso}>
                {materiaisDoBriefing.length} de {contratado} enviados
              </p>

              {materiaisDoBriefing.length > 0 && (
                <ul className={styles.materiaisLista}>
                  {materiaisDoBriefing.map((material) => (
                    <li key={material.id} className={styles.materialItem}>
                      {material.drive_file_url ? (
                        <a
                          href={material.drive_file_url}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.materialLink}
                        >
                          {material.nome_arquivo}
                        </a>
                      ) : (
                        <span>{material.nome_arquivo}</span>
                      )}
                      <Badge label={material.status} tone={materialStatusTone(material.status)} />
                      {material.status === 'REPROVADO' && material.motivo_reprovacao && (
                        <p className={styles.motivoReprovacao}>{material.motivo_reprovacao}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {podeEnviar && (
                <div className={styles.uploadBloco}>
                  <label className={styles.uploadLabel}>
                    enviar material
                    <input
                      type="file"
                      multiple
                      disabled={enviandoAgora}
                      onChange={(event) => {
                        void handleUpload(briefing.id, event.target.files);
                        event.target.value = '';
                      }}
                    />
                  </label>
                  {enviandoAgora && <p className={styles.emBreve}>enviando…</p>}
                  {uploadErrors[briefing.id] && (
                    <p role="alert" className={styles.motivoReprovacao}>
                      {uploadErrors[briefing.id]}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Pagamento</h3>
        {pagamento ? (
          <div className={styles.pagamentoBloco}>
            <Badge label={pagamento.status} tone={pagamentoStatusTone(pagamento.status)} />
            <p className={styles.pagamentoValor}>R$ {pagamento.valor.toFixed(2)}</p>
            {pagamento.comprovante_url && (
              <a
                href={pagamento.comprovante_url}
                target="_blank"
                rel="noreferrer"
                className={styles.comprovanteLink}
              >
                ver comprovante de pagamento
              </a>
            )}
          </div>
        ) : (
          <p className={styles.emBreve}>Nenhum pagamento registrado ainda para esta campanha.</p>
        )}
      </section>
    </div>
  );
}
