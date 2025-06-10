import { AuthProvider } from '@/view/context/AuthContext';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { BrowserRouter } from '../routes/BrowserRouter';

export function App() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
      <AuthProvider>
        <BrowserRouter />
      </AuthProvider>
    </>
  );
}
