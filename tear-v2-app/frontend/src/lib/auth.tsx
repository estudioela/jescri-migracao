import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { apiClient, UNAUTHORIZED_EVENT } from './apiClient';

export type Role = 'ADMIN' | 'GESTOR_MARCA' | 'INFLUENCIADORA';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: Role | null;
};

type MeResponse = {
  data: AuthUser;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function ensureCsrfCookie() {
  const root = (apiClient.defaults.baseURL ?? '').replace(/\/api\/?$/, '');
  await apiClient.get(`${root}/sanctum/csrf-cookie`);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<MeResponse>('/me')
      .then((response) => {
        const { data } = response.data;
        setUser(data);
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      setUser(null);
    }
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  async function login(email: string, password: string) {
    await ensureCsrfCookie();
    await apiClient.post('/login', { email, password });
    const response = await apiClient.get<MeResponse>('/me');
    const { data } = response.data;
    setUser(data);
  }

  async function logout() {
    await apiClient.post('/logout');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
