import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ParceirasListPage from './pages/ParceirasListPage';
import ParceiraFormPage from './pages/ParceiraFormPage';
import ParceiraProfilePage from './pages/ParceiraProfilePage';
import AppShell from './components/AppShell';
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

  if (!user) {
    return <Login />;
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/parceiras" element={<ParceirasListPage />} />
        <Route path="/parceiras/nova" element={<ParceiraFormPage mode="create" />} />
        <Route path="/parceiras/:id" element={<ParceiraProfilePage />} />
        <Route path="/parceiras/:id/editar" element={<ParceiraFormPage mode="edit" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
