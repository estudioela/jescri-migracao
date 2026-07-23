import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ParceirasListPage from './pages/ParceirasListPage';
import ParceiraFormPage from './pages/ParceiraFormPage';
import ParceiraProfilePage from './pages/ParceiraProfilePage';
import PublicCadastroPage from './pages/PublicCadastroPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import MarcasListPage from './pages/MarcasListPage';
import MarcaFormPage from './pages/MarcaFormPage';
import CampanhasListPage from './pages/CampanhasListPage';
import CampanhaFormPage from './pages/CampanhaFormPage';
import CampanhaDetailPage from './pages/CampanhaDetailPage';
import BriefingFormPage from './pages/BriefingFormPage';
import MateriaisPage from './pages/MateriaisPage';
import PagamentoPage from './pages/PagamentoPage';
import EnvioPage from './pages/EnvioPage';
import LogisticaPage from './pages/LogisticaPage';
import AppShell from './components/AppShell';
import PortalShell from './components/PortalShell';
import PortalDashboardPage from './pages/portal/PortalDashboardPage';
import PortalPerfilPage from './pages/portal/PortalPerfilPage';
import PortalCampanhasListPage from './pages/portal/PortalCampanhasListPage';
import PortalParticipacaoPage from './pages/portal/PortalParticipacaoPage';
import PortalHistoricoPage from './pages/portal/PortalHistoricoPage';
import PlaceholderPage from './components/PlaceholderPage';
import { useAuth } from './lib/auth';
import styles from './App.module.css';

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className={styles.loadingScreen}>
        <p>Carregando…</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/cadastro" element={<PublicCadastroPage />} />
      <Route path="/definir-senha" element={<ResetPasswordPage />} />
      {!user && (
        <>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
      {user && user.role === 'INFLUENCIADORA' && (
        <Route element={<PortalShell />}>
          <Route path="/" element={<PortalDashboardPage />} />
          <Route path="/campanhas" element={<PortalCampanhasListPage />} />
          <Route path="/historico" element={<PortalHistoricoPage />} />
          <Route path="/perfil" element={<PortalPerfilPage />} />
          <Route path="/participacoes/:participacaoId" element={<PortalParticipacaoPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      )}
      {user && user.role !== 'INFLUENCIADORA' && (
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/parceiras" element={<ParceirasListPage />} />
          <Route path="/parceiras/nova" element={<ParceiraFormPage mode="create" />} />
          <Route path="/parceiras/:id" element={<ParceiraProfilePage />} />
          <Route path="/parceiras/:id/editar" element={<ParceiraFormPage mode="edit" />} />
          <Route path="/marcas" element={<MarcasListPage />} />
          <Route path="/marcas/nova" element={<MarcaFormPage mode="create" />} />
          <Route path="/marcas/:id/editar" element={<MarcaFormPage mode="edit" />} />
          <Route path="/campanhas" element={<CampanhasListPage />} />
          <Route path="/campanhas/nova" element={<CampanhaFormPage mode="create" />} />
          <Route path="/campanhas/:id" element={<CampanhaDetailPage />} />
          <Route path="/campanhas/:id/editar" element={<CampanhaFormPage mode="edit" />} />
          <Route path="/participacoes/:participacaoId/briefing" element={<BriefingFormPage />} />
          <Route path="/participacoes/:participacaoId/materiais" element={<MateriaisPage />} />
          <Route path="/participacoes/:participacaoId/pagamento" element={<PagamentoPage />} />
          <Route path="/participacoes/:participacaoId/envio" element={<EnvioPage />} />
          <Route path="/colaboracoes" element={<Navigate to="/campanhas" replace />} />
          <Route path="/briefings" element={<Navigate to="/campanhas" replace />} />
          <Route path="/materiais" element={<Navigate to="/campanhas" replace />} />
          <Route path="/aprovacoes" element={<Navigate to="/campanhas" replace />} />
          <Route path="/pagamentos" element={<Navigate to="/campanhas" replace />} />
          <Route path="/logistica" element={<LogisticaPage />} />
          <Route path="/documentos" element={<PlaceholderPage title="Documentos" />} />
          <Route path="/historico" element={<PlaceholderPage title="Histórico" />} />
          <Route path="/perfil" element={<PlaceholderPage title="Perfil" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      )}
    </Routes>
  );
}

export default App;
