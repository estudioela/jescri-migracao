import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  aprovarMaterial,
  listMateriais,
  materialStatusTone,
  reprovarMaterial,
  uploadMaterial,
  type Material,
} from '../lib/materiais';
import { listBriefings, type Briefing } from '../lib/briefings';
import { useAuth } from '../lib/auth';
import Badge from '../components/Badge';
import SelectField from '../components/SelectField';
import TextareaField from '../components/TextareaField';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import styles from './MateriaisPage.module.css';

const TIPO_LABELS: Record<Briefing['tipo'], string> = {
  FEED: 'Feed',
  REELS: 'Reels',
  STORIES: 'Stories',
  TIKTOK: 'TikTok',
  UGC: 'UGC',
};

export default function MateriaisPage() {
  const { participacaoId } = useParams<{ participacaoId: string }>();
  const { user } = useAuth();
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [isLoadingBriefings, setIsLoadingBriefings] = useState(true);
  const [briefingId, setBriefingId] = useState<number | ''>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [reprovandoId, setReprovandoId] = useState<number | null>(null);
  const [motivo, setMotivo] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const isAdmin = user?.role === 'ADMIN';

  function carregarMateriais() {
    if (!participacaoId) return;
    listMateriais(participacaoId)
      .then(setMateriais)
      .catch(() => setLoadError('Não foi possível carregar os materiais.'))
      .finally(() => setIsLoading(false));
  }

  useEffect(carregarMateriais, [participacaoId]);

  useEffect(() => {
    if (!participacaoId) return;
    setIsLoadingBriefings(true);
    listBriefings(participacaoId)
      .then((lista) => {
        setBriefings(lista);
        if (lista.length > 0) setBriefingId(lista[0].id);
      })
      .catch(() => setBriefings([]))
      .finally(() => setIsLoadingBriefings(false));
  }, [participacaoId]);

  async function handleUpload(event: FormEvent) {
    event.preventDefault();
    if (!participacaoId) return;
    if (!briefingId) {
      setUploadError('Selecione um briefing.');
      return;
    }
    const arquivo = fileInputRef.current?.files?.[0];
    if (!arquivo) {
      setUploadError('Selecione um arquivo para enviar.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    try {
      await uploadMaterial(participacaoId, briefingId, arquivo);
      if (fileInputRef.current) fileInputRef.current.value = '';
      carregarMateriais();
    } catch {
      setUploadError('Não foi possível enviar o material. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleAprovar(material: Material) {
    setActionError(null);
    try {
      const atualizado = await aprovarMaterial(material.id);
      setMateriais((current) => current.map((item) => (item.id === atualizado.id ? atualizado : item)));
    } catch {
      setActionError('Não foi possível aprovar este material.');
    }
  }

  async function handleReprovar(material: Material) {
    if (!motivo.trim()) {
      setActionError('Informe o motivo da reprovação.');
      return;
    }
    setActionError(null);
    try {
      const atualizado = await reprovarMaterial(material.id, motivo);
      setMateriais((current) => current.map((item) => (item.id === atualizado.id ? atualizado : item)));
      setReprovandoId(null);
      setMotivo('');
    } catch {
      setActionError('Não foi possível reprovar este material.');
    }
  }

  if (loadError) {
    return <p className={styles.error}>{loadError}</p>;
  }

  if (isLoading) {
    return <p className={styles.loading}>Carregando…</p>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.title}>Materiais</h2>
      </header>

      {materiais.length === 0 && (
        <EmptyState
          title="Nenhum material enviado"
          message="Envie o primeiro material desta participação usando o formulário abaixo."
        />
      )}

      {materiais.length > 0 && (
        <ul className={styles.list}>
          {materiais.map((material) => (
            <li key={material.id} className={styles.item}>
              <div className={styles.itemHeader}>
                <div>
                  <p className={styles.itemNome}>{material.nome_arquivo}</p>
                  <p className={styles.itemTipo}>{material.tipo}</p>
                </div>
                <Badge label={material.status} tone={materialStatusTone(material.status)} />
              </div>

              {material.drive_file_url && (
                <a href={material.drive_file_url} target="_blank" rel="noreferrer" className={styles.link}>
                  ver arquivo
                </a>
              )}

              {material.status === 'REPROVADO' && material.motivo_reprovacao && (
                <p className={styles.motivo}>Motivo: {material.motivo_reprovacao}</p>
              )}

              {isAdmin && material.status === 'PENDENTE' && (
                <div className={styles.itemActions}>
                  <Button onClick={() => handleAprovar(material)}>aprovar</Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setReprovandoId(material.id);
                      setMotivo('');
                      setActionError(null);
                    }}
                  >
                    reprovar
                  </Button>
                </div>
              )}

              {isAdmin && reprovandoId === material.id && (
                <div className={styles.reprovarForm}>
                  <TextareaField
                    label="Motivo da reprovação"
                    value={motivo}
                    onChange={(event) => setMotivo(event.target.value)}
                    rows={2}
                  />
                  <div className={styles.itemActions}>
                    <Button onClick={() => handleReprovar(material)}>confirmar reprovação</Button>
                    <Button variant="secondary" onClick={() => setReprovandoId(null)}>
                      cancelar
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {actionError && (
        <p className={styles.formError} role="alert">
          {actionError}
        </p>
      )}

      <section className={styles.group}>
        <h3 className={styles.groupTitle}>Enviar material</h3>
        {!isLoadingBriefings && briefings.length === 0 ? (
          <EmptyState
            title="Nenhum briefing publicado"
            message="Publique um briefing antes de registrar material."
          />
        ) : (
          <form className={styles.uploadForm} onSubmit={handleUpload} noValidate>
            <SelectField
              label="Briefing"
              value={briefingId}
              onChange={(event) => setBriefingId(Number(event.target.value))}
            >
              {briefings.map((briefing) => (
                <option key={briefing.id} value={briefing.id}>
                  {TIPO_LABELS[briefing.tipo]}
                </option>
              ))}
            </SelectField>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="arquivo">
                Arquivo
              </label>
              <input id="arquivo" type="file" ref={fileInputRef} className={styles.fileInput} />
            </div>

            {uploadError && (
              <p className={styles.formError} role="alert">
                {uploadError}
              </p>
            )}

            <Button type="submit" isLoading={isUploading} loadingText="enviando…" className={styles.submit}>
              enviar material
            </Button>
          </form>
        )}
      </section>

      <Link to="/campanhas" className={styles.backLink}>
        ← voltar para campanhas
      </Link>
    </div>
  );
}
