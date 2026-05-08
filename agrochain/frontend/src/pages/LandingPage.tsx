import React, { useState } from 'react';

interface LandingPageProps {
    onLogin: () => void;
    onRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
    const [lang, setLang] = useState<'ua' | 'en'>('ua');

    const t = (ua: string, en: string) => lang === 'ua' ? ua : en;

    return (
        <div className="landing">
            {/* HEADER */}
            <header className="landing-header">
                <div className="landing-header-inner">
                    <div className="landing-logo">
                        <span className="landing-logo-icon">🌾</span>
                        <div>
                            <div className="landing-logo-title">AgroChain</div>
                            <div className="landing-logo-sub">UKRAINE</div>
                        </div>
                    </div>

                    <nav className="landing-nav">
                        <a href="#features" className="landing-nav-link">{t('Можливості', 'Features')}</a>
                        <a href="#partners" className="landing-nav-link">{t('Партнери', 'Partners')}</a>
                        <a href="#how" className="landing-nav-link">{t('Як це працює', 'How It Works')}</a>
                    </nav>

                    <div className="landing-header-actions">
                        <div className="landing-lang-toggle">
                            <button className={`landing-lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>🌐 EN</button>
                            <span className="landing-lang-sep">|</span>
                            <button className={`landing-lang-btn ${lang === 'ua' ? 'active' : ''}`} onClick={() => setLang('ua')}>УК</button>
                        </div>
                        <button className="landing-btn-outline" onClick={onLogin}>{t('Увійти', 'Sign In')}</button>
                        <button className="landing-btn-primary" onClick={onRegister}>{t('Реєстрація', 'Register')}</button>
                    </div>
                </div>
            </header>

            {/* HERO */}
            <section className="landing-hero">
                <div className="landing-hero-bg">
                    <div className="hero-grain-overlay" />
                </div>
                <div className="landing-hero-content">
                    <div className="landing-hero-text">
                        <h1 className="landing-hero-h1">
                            <span>Smart traceability.</span><br />
                            <span className="hero-green">{t('Безпечна торгівля.', 'Secure trade.')}</span><br />
                            <span>{t('Сильніша Україна.', 'Stronger Ukraine.')}</span>
                        </h1>
                        <p className="landing-hero-desc">
                            {t(
                                'Цифрова платформа для прозорого експорту зерна від фермера до європейського ринку на базі блокчейну, гібридних платежів і інтеграції з державними сервісами України.',
                                'Digital platform for transparent grain export from farmer to European market based on blockchain, hybrid payments and integration with Ukrainian government services.'
                            )}
                        </p>
                        <ul className="landing-hero-features">
                            <li>
                                <span className="hero-feat-icon">🛡️</span>
                                <div>
                                    <strong>{t('Блокчейн-прослідковуваність', 'Blockchain traceability')}</strong>
                                    <span>{t('від ферми до кордону ЄС', 'from farm to EU border')}</span>
                                </div>
                            </li>
                            <li>
                                <span className="hero-feat-icon">💳</span>
                                <div>
                                    <strong>{t('Гібридні платежі', 'Hybrid payments')}</strong>
                                    <span>(USDC + EUR/USD)</span>
                                </div>
                            </li>
                            <li>
                                <span className="hero-feat-icon">☁️</span>
                                <div>
                                    <strong>{t('Інтеграція з держсервісами', 'Integration with gov services')}</strong>
                                    <span>{t('України', 'of Ukraine')}</span>
                                </div>
                            </li>
                        </ul>
                        <div className="landing-hero-cta">
                            <button className="landing-cta-primary" onClick={onRegister}>{t('Розпочати безкоштовно', 'Get Started Free')}</button>
                            <button className="landing-cta-outline" onClick={onLogin}>{t('Вже маєте акаунт? Увійти', 'Have account? Sign In')}</button>
                        </div>
                    </div>

                    <div className="landing-hero-card">
                        <div className="grain-lot-card">
                            <div className="grain-lot-header">
                                <span className="grain-lot-badge">Grain Lot #AG-240873</span>
                            </div>
                            <div className="grain-lot-steps">
                                {[
                                    { icon: '✅', label: 'Farm Origin', sub: 'GPS Verified' },
                                    { icon: '✅', label: 'Lab Test', sub: 'Passed' },
                                    { icon: '✅', label: 'Phytosanitary', sub: 'Approved' },
                                    { icon: '✅', label: 'Border Crossing', sub: 'Completed' },
                                    { icon: '✅', label: 'EU Customs', sub: 'Arrived' },
                                ].map((s, i) => (
                                    <div key={i} className="grain-step">
                                        <span className="grain-step-icon">{s.icon}</span>
                                        <div>
                                            <div className="grain-step-label">{s.label}</div>
                                            <div className="grain-step-sub">{s.sub}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="grain-lot-status">
                                <span className="grain-status-dot" />
                                <strong>BORDER_CROSSED</strong>
                                <span>Payment Released</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* INTEGRATION PARTNERS */}
            <section id="partners" className="landing-section landing-partners-section">
                <h2 className="landing-section-title">{t('Інтеграція з провідними партнерами', 'Integration with leading partners')}</h2>
                <div className="landing-partners-grid">
                    <div className="landing-partner-card partner-main">
                        <div className="partner-tag">{t('Інтегровано з', 'Integrated with')}</div>
                        <div className="partner-logo-big partner-cop">cop-pilot.eu</div>
                        <div className="partner-eu-logo">🇪🇺 European Commission</div>
                        <a href="https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/home" target="_blank" rel="noreferrer" className="partner-link">
                            ec.europa.eu ↗
                        </a>
                    </div>
                    <div className="landing-partner-card">
                        <div className="partner-logo-svg">🤝</div>
                        <div className="partner-name">Global Alliance<br />for Trade Facilitation</div>
                        <p className="partner-desc">{t('Публічно-приватне партнерство для відкритих ринків та стійких ланцюгів поставок.', 'Public-private partnership for open markets and resilient supply chains.')}</p>
                        <a href="https://www.tradefacilitation.org" target="_blank" rel="noreferrer" className="partner-link">www.tradefacilitation.org ↗</a>
                    </div>
                    <div className="landing-partner-card">
                        <div className="partner-logo-svg">🌍</div>
                        <div className="partner-name">Global Business Partners</div>
                        <p className="partner-desc">{t('Ми співпрацюємо з понад 50 транснаціональними компаніями.', 'We partner with around 50 multinational companies, chambers of commerce and MSMEs.')}</p>
                        <a href="#" className="partner-link">Learn more ↗</a>
                    </div>
                </div>
            </section>

            {/* DONORS */}
            <section className="landing-section landing-donors-section">
                <h2 className="landing-section-title">{t('Наші партнери та донори', 'Our partners and donors')}</h2>
                <div className="landing-donors-grid">
                    {[
                        { name: 'GIZ', full: 'Deutsche Gesellschaft für Internationale Zusammenarbeit', color: '#009cde' },
                        { name: 'CIPE', full: 'Center for International Private Enterprise', color: '#003087' },
                        { name: 'ICC', full: 'International Chamber of Commerce', color: '#1a3c6e' },
                        { name: 'WEF', full: 'World Economic Forum', color: '#1b4f72' },
                        { name: 'Canada', full: 'Government of Canada', color: '#cc0000' },
                        { name: 'BMZ', full: 'German Federal Ministry', color: '#000' },
                        { name: 'EU', full: 'Co-funded by the European Union', color: '#003399' },
                        { name: 'Sweden', full: 'Sverige', color: '#006AA7' },
                    ].map((d, i) => (
                        <div key={i} className="donor-card">
                            <div className="donor-name" style={{ color: d.color }}>{d.name}</div>
                            <div className="donor-full">{d.full}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* GOV INTEGRATION */}
            <section className="landing-gov-section">
                <div className="landing-gov-inner">
                    <span className="gov-trident">🔱</span>
                    <div className="gov-title">{t('ДЕРЖАВНА СЛУЖБА УКРАЇНИ З ПИТАНЬ БЕЗПЕЧНОСТІ ХАРЧОВИХ ПРОДУКТІВ ТА ЗАХИСТУ СПОЖИВАЧІВ', 'STATE SERVICE OF UKRAINE ON FOOD SAFETY AND CONSUMER PROTECTION')}</div>
                    <div className="gov-services">
                        <div className="gov-service"><span>🛡️</span> eFood</div>
                        <div className="gov-service"><span>📋</span> eCherha (Є черга)</div>
                        <div className="gov-service"><span>🗺️</span> Держгеокадастр</div>
                    </div>
                </div>
            </section>

            {/* FARM TO FORK */}
            <section className="landing-ftf-section">
                <div className="landing-ftf-bg" />
                <div className="landing-ftf-content">
                    <div className="ftf-eu-tag">{t('Згідно з програмою ЄС', 'According to EU program')}</div>
                    <h2 className="ftf-title">FROM FARM TO FORK</h2>
                    <div className="ftf-hashtag"># AgroChain Ukraine 🌾 🇺🇦</div>
                    <div className="ftf-features">
                        <div className="ftf-feat"><span>⛓️</span><strong>Blockchain<br />Traceability</strong></div>
                        <div className="ftf-feat"><span>💳</span><strong>Hybrid Escrow<br />Payments</strong></div>
                        <div className="ftf-feat"><span>🛡️</span><strong>Secure &<br />Compliant</strong></div>
                        <div className="ftf-feat"><span>🌍</span><strong>EU Market<br />Access</strong></div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="landing-footer">
                <div className="landing-footer-inner">
                    <div className="landing-footer-logo">
                        <span>🌾</span> AgroChain Ukraine
                    </div>
                    <div className="landing-footer-links">
                        <button className="landing-btn-outline small" onClick={onLogin}>{t('Увійти', 'Sign In')}</button>
                        <button className="landing-btn-primary small" onClick={onRegister}>{t('Реєстрація', 'Register')}</button>
                    </div>
                    <div className="landing-footer-copy">© 2026 AgroChain Ukraine · COP-PILOT Horizon Europe</div>
                </div>
            </footer>
        </div>
    );
};
