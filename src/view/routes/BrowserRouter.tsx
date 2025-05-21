import { Suspense, lazy } from 'react';
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from 'react-router-dom';
import { AcceptedLanguages, useLanguage } from '../../domain/locales/Language';
import { Loader } from '../components/Loader';
import ScrollToTop from '../components/ScrollToTop';
import { DefaultLayout } from '../layout/DefaultyLayout';
import { AboutBuyBitcoin } from '../screens/About/AboutBuyBitcoin';
import BuyBitcoin from '../screens/Checkout/Checkout';
import { CheckoutPix } from '../screens/Checkout/CheckoutPix';
import DataForm from '../screens/Checkout/DataForm/DataForm';
import { PaymentAlfredFailure } from '../screens/paymentStatus/pageFailure';
import { PaymentAlfredReview } from '../screens/paymentStatus/pageReview';
import { PaymentAlfredSuccess } from '../screens/paymentStatus/pageSucces';
import { Fees } from '../screens/Rate/RateBitcoin';
import { TermsOfUse } from '../screens/Terms/TermsUse';
import { ROUTES } from './Routes';

// Importação das páginas de login e registro
import LoginPage from '../screens/auth/LoginPage';
import RegisterPage from '../screens/auth/RegisterPage';

// Componentes de administração
import AdminDashboard from '../screens/admin/AdminDashboard';
import KYCDetail from '../screens/admin/AdminDetail';
import AdminLogin from '../screens/admin/AdminLogin';
import ProtectedRoute from '../screens/admin/ProtectedRoute';
// Páginas protegidas do usuário
import { UserProtectedRoute } from '../components/UserProtectedRoute';

const NotFound = lazy(() =>
  import('../screens/NotFound').then((module) => ({
    default: module.NotFound,
  })),
);

const SupportPage = lazy(() =>
  import('../screens/Support/support').then((module) => ({
    default: module.Support,
  })),
);

export function BrowserRouter() {
  const { currentLang } = useLanguage();

  return (
    <Router>
      <ScrollToTop />
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Rota raiz redireciona para o idioma padrão */}
          <Route
            path={ROUTES.home.call()}
            element={
              <Navigate to={`/${currentLang || AcceptedLanguages.pt}`} />
            }
          />
          {/* Agrupamento por idioma */}
          <Route path={ROUTES.lang.call()}>
            {/* Rotas públicas: login e registro */}

            {/* Layout padrão para demais páginas */}
            <Route element={<DefaultLayout />}>
              <Route path={ROUTES.auth.login.path} element={<LoginPage />} />
              <Route
                path={ROUTES.auth.register.path}
                element={<RegisterPage />}
              />
              <Route path={ROUTES.buyCheckout.path} element={<DataForm />} />
              <Route path={ROUTES.buyBitcoin.path} element={<BuyBitcoin />} />
              <Route path={ROUTES.fee.path} element={<Fees />} />
              <Route path={ROUTES.Support.path} element={<SupportPage />} />
              <Route
                path={ROUTES.aboutBitcoin.path}
                element={<AboutBuyBitcoin />}
              />
              <Route path={ROUTES.term.path} element={<TermsOfUse />} />
              {/* Rotas protegidas */}
              <Route element={<UserProtectedRoute />}>
                <Route
                  path={ROUTES.paymentAlfredStatus.success.path}
                  element={<PaymentAlfredSuccess />}
                />
                <Route
                  path={ROUTES.paymentAlfredStatus.failure.path}
                  element={<PaymentAlfredFailure />}
                />
                <Route
                  path={ROUTES.paymentAlfredStatus.review.path}
                  element={<PaymentAlfredReview />}
                />

                <Route
                  path={ROUTES.checkoutPix.path}
                  element={<CheckoutPix />}
                />
              </Route>
            </Route>
          </Route>
          {/* Rotas de administração */}
          <Route path={ROUTES.admin.login.path} element={<AdminLogin />} />
          <Route
            path={ROUTES.admin.dashboard.path}
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.admin.kycDetail.path}
            element={
              <ProtectedRoute>
                <KYCDetail />
              </ProtectedRoute>
            }
          />
          {/* Rota para 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
