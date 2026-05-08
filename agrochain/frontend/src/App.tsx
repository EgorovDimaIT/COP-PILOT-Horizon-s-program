import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { BuyerDashboard } from './pages/BuyerDashboard';
import { LotModal, NotificationPanel } from './components/Modals';
import { I18nProvider, useI18n } from './i18n';
import { AppProvider, useApp } from './store';
import { AuthPage } from './pages/AuthPage';
import { LandingPage } from './pages/LandingPage';
import { FarmerDashboard } from './pages/FarmerDashboard';

type AppScreen = 'landing' | 'auth' | 'app';

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
  const hasToken = !!localStorage.getItem('auth_token');

  const [screen, setScreen] = useState<AppScreen>(hasToken ? 'app' : 'landing');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [initialRole, setInitialRole] = useState<'farmer' | 'buyer'>(
    (localStorage.getItem('user_role') as 'farmer' | 'buyer') || 'farmer'
  );

  const goToLogin = () => { setAuthMode('login'); setScreen('auth'); };
  const goToRegister = () => { setAuthMode('register'); setScreen('auth'); };

  const handleAuth = (role: 'farmer' | 'buyer') => {
    setInitialRole(role);
    setScreen('app');
  };

  if (screen === 'landing') {
    return (
      <I18nProvider>
        <LandingPage onLogin={goToLogin} onRegister={goToRegister} />
      </I18nProvider>
    );
  }

  if (screen === 'auth') {
    return (
      <I18nProvider>
        <AuthPage
          onAuth={handleAuth}
          initialMode={authMode}
          onBack={() => setScreen('landing')}
        />
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
