import React from 'react';
import { useI18n } from '../i18n';
import { useApp } from '../store';

export const TopBar: React.FC = () => {
    const { lang, setLang } = useI18n();
    const { mode, setMode, unreadCount, showNotifPanel, setShowNotifPanel } = useApp();

    return (
        <header className="topbar">
            <div className="topbar-left">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                    <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M7 10l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span>COP-PILOT Ecosystem</span>
            </div>
            <div className="topbar-right">
                {/* DEV ONLY MODE SWITCHER */}
                <div className="mode-switch">
                    <button className={`mode-btn${mode === 'farmer' ? ' active' : ''}`} onClick={() => setMode('farmer')}>Farmer</button>
                    <button className={`mode-btn${mode === 'buyer' ? ' active' : ''}`} onClick={() => setMode('buyer')}>Buyer</button>
                </div>

                <div className="lang-switch">
                    <button className={`lang-btn${lang === 'ua' ? ' active' : ''}`} onClick={() => setLang('ua')}>UA</button>
                    <button className={`lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => setLang('en')}>EN</button>
                </div>
                <button className="topbar-bell" onClick={() => setShowNotifPanel(!showNotifPanel)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    {unreadCount > 0 && <span className="topbar-bell-badge">{unreadCount}</span>}
                </button>
                <div className="topbar-user">
                    {mode === 'buyer' ? (
                        <>
                            <div className="user-info">
                                <div className="user-name">John Miller</div>
                                <div className="user-company">Miller Grains Ltd.</div>
                            </div>
                            <div className="user-avatar">JM</div>
                        </>
                    ) : (
                        <>
                            <div className="user-info">
                                <div className="user-name">Іван Петренко</div>
                                <div className="user-company">Фермер</div>
                            </div>
                            <img src="https://i.pravatar.cc/150?u=ivan" alt="Avatar" className="user-avatar-img" />
                            <span className="user-dropdown-icon">▾</span>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};
