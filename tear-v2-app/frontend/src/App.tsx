import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ParceirasListPage from './pages/ParceirasListPage';
import ParceiraFormPage from './pages/ParceiraFormPage';
import ParceiraProfilePage from './pages/ParceiraProfilePage';
import PublicCadastroPage from './pages/PublicCadastroPage';
import MarcasListPage from './pages/MarcasListPage';
import MarcaFormPage from './pages/MarcaFormPage';
import CampanhasListPage from './pages/CampanhasListPage';
import CampanhaFormPage from './pages/CampanhaFormPage';
import CampanhaDetailPage from './pages/CampanhaDetailPage';
import BriefingFormPage from './pages/BriefingFormPage';
import MateriaisPage from './pages/MateriaisPage';
import PagamentoPage from './pages/PagamentoPage';
import AppShell from './components/AppShell';
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
      {user ? (
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
          <Route path="/colaboracoes" element={<PlaceholderPage title="Colaborações" />} />
          <Route path="/briefings" element={<PlaceholderPage title="Briefings" />} />
          <Route path="/materiais" element={<PlaceholderPage title="Materiais" />} />
          <Route path="/aprovacoes" element={<PlaceholderPage title="Aprovações" />} />
          <Route path="/logistica" element={<PlaceholderPage title="Logística" />} />
          <Route path="/pagamentos" element={<PlaceholderPage title="Pagamentos" />} />
          <Route path="/documentos" element={<PlaceholderPage title="Documentos" />} />
          <Route path="/historico" element={<PlaceholderPage title="Histórico" />} />
          <Route path="/perfil" element={<PlaceholderPage title="Perfil" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      ) : (
        <Route path="*" element={<Login />} />
      )}
    </Routes>
  );
}

export default App;
