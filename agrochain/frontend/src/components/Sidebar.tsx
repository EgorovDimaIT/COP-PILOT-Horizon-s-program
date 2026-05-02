import React from 'react';
import { useI18n } from '../i18n';
import { useApp } from '../store';
import type { Page, FarmerPage } from '../store';

const buyerItems: { icon: string; label: string; page: Page; badge?: boolean }[] = [
    { icon: '📊', label: 'nav.dashboard', page: 'dashboard' },
    { icon: '🔍', label: 'nav.search', page: 'search' },
    { icon: '🤝', label: 'nav.deals', page: 'deals' },
    { icon: '🚛', label: 'nav.monitoring', page: 'monitoring' },
    { icon: '💳', label: 'nav.payments', page: 'payments' },
    { icon: '📄', label: 'nav.contracts', page: 'contracts' },
];

const buyerItems2: { icon: string; label: string; page: Page; badge?: boolean }[] = [
    { icon: '⭐', label: 'nav.favorites', page: 'favorites' },
    { icon: '🔔', label: 'nav.notifications', page: 'notifications', badge: true },
    { icon: '📈', label: 'nav.analytics', page: 'analytics' },
    { icon: '📋', label: 'nav.certificates', page: 'certificates' },
];

const farmerItems: { icon: string; label: string; page: FarmerPage; badge?: boolean }[] = [
    { icon: '⊞', label: 'fn.panel', page: 'panel' },
    { icon: '⬡', label: 'fn.myLots', page: 'myLots' },
    { icon: '➕', label: 'fn.createLot', page: 'createLot' },
    { icon: '🗺️', label: 'fn.myFields', page: 'myFields' },
    { icon: '📄', label: 'fn.documents', page: 'documents' },
    { icon: '🔬', label: 'fn.labCerts', page: 'labCerts' },
    { icon: '🌱', label: 'fn.efood', page: 'efood' },
    { icon: '🚛', label: 'fn.logistics', page: 'logistics' },
    { icon: '🏁', label: 'fn.echerha', page: 'echerha' },
    { icon: '💳', label: 'fn.payments', page: 'payments' },
    { icon: '📈', label: 'fn.analytics', page: 'analytics' },
    { icon: '🔔', label: 'fn.notifications', page: 'notifications', badge: true },
];

export const Sidebar: React.FC = () => {
    const { t } = useI18n();
    const { mode, page, setPage, farmerPage, setFarmerPage, unreadCount } = useApp();

    return (
        <aside className={`sidebar ${mode === 'farmer' ? 'sidebar-farmer' : ''}`}>
            <div className="sidebar-brand">
                <div className="sidebar-brand-icon">🌾</div>
                <div className="sidebar-brand-text">
                    <span className="sidebar-brand-title">AGROCHAIN</span>
                    <span className="sidebar-brand-sub">UKRAINE</span>
                </div>
            </div>
            <nav className="sidebar-nav">
                {mode === 'buyer' && (
                    <>
                        {buyerItems.map(item => (
                            <button key={item.page} className={`nav-item${page === item.page ? ' active' : ''}`} onClick={() => setPage(item.page)}>
                                <span className="nav-icon">{item.icon}</span>{t(item.label)}{item.badge && unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
                            </button>
                        ))}
                        <div className="nav-divider" />
                        {buyerItems2.map(item => (
                            <button key={item.page} className={`nav-item${page === item.page ? ' active' : ''}`} onClick={() => setPage(item.page)}>
                                <span className="nav-icon">{item.icon}</span>{t(item.label)}{item.badge && unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
                            </button>
                        ))}
                        <div className="nav-divider" />
                        <button className={`nav-item${page === 'settings' ? ' active' : ''}`} onClick={() => setPage('settings')}>
                            <span className="nav-icon">⚙️</span>{t('nav.settings')}
                        </button>
                    </>
                )}
                {mode === 'farmer' && (
                    <>
                        {farmerItems.map(item => (
                            <button key={item.page} className={`nav-item${farmerPage === item.page ? ' active' : ''}`} onClick={() => setFarmerPage(item.page)}>
                                <span className="nav-icon">{item.icon}</span>{t(item.label)}{item.badge && unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
                            </button>
                        ))}
                        <div className="nav-divider" />
                        <button className={`nav-item${farmerPage === 'settings' ? ' active' : ''}`} onClick={() => setFarmerPage('settings')}>
                            <span className="nav-icon">⚙️</span>{t('fn.settings')}
                        </button>
                    </>
                )}
            </nav>
            {mode === 'buyer' ? (
                <div className="sidebar-footer">
                    <div className="sif-badge"><span>✅</span><span>{t('sidebar.connectedVia')}<br /><strong>COP-PILOT SIF</strong></span></div>
                    <div className="sif-label">{t('sidebar.sif')}</div>
                    <div className="sif-status"><span className="sif-dot" />{t('sidebar.status')}</div>
                </div>
            ) : (
                <div className="sidebar-footer farmer-footer">
                    <div className="kep-badge">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>
                        {t('fn.kepConnected')}
                    </div>
                    <div className="kep-owner">{t('fn.kepOwner')}</div>
                    <div className="kep-valid">{t('fn.kepValid')}</div>
                    <button className="kep-verify-btn">{t('fn.verifyKep')}</button>
                </div>
            )}
        </aside>
    );
};
