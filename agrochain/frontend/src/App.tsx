import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { BuyerDashboard } from './pages/BuyerDashboard';
import { LotModal, NotificationPanel } from './components/Modals';
import { I18nProvider, useI18n } from './i18n';
import { AppProvider, useApp } from './store';
import { AuthPage } from './pages/AuthPage';

import { FarmerDashboard } from './pages/FarmerDashboard';

const PageContent: React.FC = () => {
  const { mode, page, farmerPage } = useApp();
  const { t } = useI18n();

  if (mode === 'farmer') {
    switch (farmerPage) {
      case 'panel': return <FarmerDashboard />;
      default:
        const titleKey = `fn.${farmerPage}`;
        return (
          <div style={{ padding: '2rem' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '1rem' }}>{t(titleKey)}</h1>
            <div className="section-card" style={{ padding: '3rem', textAlign: 'center', color: '#9aa0a6' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
              <p style={{ fontSize: '1.1rem' }}>{t('page.comingSoon')}</p>
            </div>
          </div>
        );
    }
  }

  // Buyer matching
  switch (page) {
    case 'dashboard': return <BuyerDashboard />;
    default:
      const titleKey = `page.${page}`;
      return (
        <div style={{ padding: '2rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '1rem' }}>{t(titleKey)}</h1>
          <div className="section-card" style={{ padding: '3rem', textAlign: 'center', color: '#9aa0a6' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
            <p style={{ fontSize: '1.1rem' }}>{t('page.comingSoon')}</p>
          </div>
        </div>
      );
  }
};

const AppInner: React.FC = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-wrap">
        <TopBar />
        <main className="main-content">
          <PageContent />
        </main>
      </div>
      <LotModal />
      <NotificationPanel />
    </div>
  );
};

const App: React.FC = () => {
  // Check if user is authenticated (token in localStorage)
  const [isAuth, setIsAuth] = useState(() => {
    return !!localStorage.getItem('auth_token');
  });
  const [initialRole, setInitialRole] = useState<'farmer' | 'buyer'>(() => {
    return (localStorage.getItem('user_role') as 'farmer' | 'buyer') || 'farmer';
  });

  const handleAuth = (role: 'farmer' | 'buyer') => {
    setInitialRole(role);
    setIsAuth(true);
  };

  if (!isAuth) {
    return (
      <I18nProvider>
        <AuthPage onAuth={handleAuth} />
      </I18nProvider>
    );
  }

  return (
    <I18nProvider>
      <AppProvider initialMode={initialRole}>
        <AppInner />
      </AppProvider>
    </I18nProvider>
  );
};

export default App;
