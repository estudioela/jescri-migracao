import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { useAuth } from './lib/auth';
import styles from './App.module.css';

function App() {
  const { user, isLoading, logout } = useAuth();

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

  return <Dashboard user={user} onLogout={() => void logout()} />;
}

export default App;
