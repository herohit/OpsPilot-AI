import { useEffect } from 'react'
import './App.css'
import AppRoutes from './routes/AppRoutes'
import { getCurrentUser, refreshAccessToken } from './api/AuthApi'
import { useAuthStore } from './store/authStore'

let sessionRestorePromise;

function App() {
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (!sessionRestorePromise) {
      sessionRestorePromise = (async () => {
        const { setAccessToken, login, logout, finishLoading } = useAuthStore.getState();

        try {
          const accessToken = await refreshAccessToken();
          setAccessToken(accessToken);
          const user = await getCurrentUser();
          login(user, accessToken);
        } catch {
          logout();
        } finally {
          finishLoading();
        }
      })();
    }
  }, []);

  if (isLoading) {
    return <div role="status" className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div>
      <AppRoutes />
    </div>
  )
}

export default App
