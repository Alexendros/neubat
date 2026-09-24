import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { AuthProvider } from '@/lib/auth';
import { LandingPage } from '@/pages/LandingPage';
import { ConfigurePage } from '@/pages/ConfigurePage';
import { AccountPage } from '@/pages/AccountPage';
import { DownloadPage } from '@/pages/DownloadPage';
import { AdminPage } from '@/pages/AdminPage';
import { HomePage } from '@/pages/HomePage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/configurar" element={<ConfigurePage />} />
            <Route path="/cuenta" element={<AccountPage />} />
            <Route path="/descargar" element={<DownloadPage />} />
            <Route path="/admin" element={<AdminPage />} />
            {/* Compatibilidad: formulario clásico */}
            <Route path="/instalar" element={<HomePage />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
