import React from 'react';
import { useI18n } from '../i18n';

export const FarmerDashboard: React.FC = () => {
    const { t, lang } = useI18n();

    return (
        <div className="farmer-dashboard anim-in">
            <div className="fd-header">
                <div className="fd-title-col">
                    <div className="fd-title-row">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                        <h1>{t('fl.lotTitle')} UA-2026-WHEAT-001</h1>
                        <span className="status-badge status-border">{t('status.border')}</span>
                    </div>
                    <p className="fd-subtitle">{t('lot.wheat')}</p>
                </div>
                <div className="fd-actions">
                    <button className="fd-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg> {t('fl.shareLot')}</button>
                    <button className="fd-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> {t('fl.downloadReport')}</button>
                    <button className="fd-btn primary"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg> {t('fl.editLot')}</button>
                </div>
            </div>

            <div className="fd-stepper section-card anim-in anim-d1">
                <div className="fd-step active">
                    <div className="fd-step-icon">✓</div>
                    <div className="fd-step-texts">
                        <div className="fd-step-title">1. {t('fl.step1')}</div>
                        <div className="fd-step-sub">15.05.2026</div>
                    </div>
                </div>
                <div className="fd-step-line active" />
                <div className="fd-step active">
                    <div className="fd-step-icon">✓</div>
                    <div className="fd-step-texts">
                        <div className="fd-step-title">2. {t('fl.step2')}</div>
                        <div className="fd-step-sub">{t('fl.step2sub')}</div>
                    </div>
                </div>
                <div className="fd-step-line active" />
                <div className="fd-step active">
                    <div className="fd-step-icon">✓</div>
                    <div className="fd-step-texts">
                        <div className="fd-step-title">3. {t('fl.step3')}</div>
                        <div className="fd-step-sub">{t('fl.step3sub')}</div>
                    </div>
                </div>
                <div className="fd-step-line active" />
                <div className="fd-step pending">
                    <div className="fd-step-icon">4</div>
                    <div className="fd-step-texts">
                        <div className="fd-step-title">4. {t('fl.step4')}</div>
                        <div className="fd-step-sub">{t('fl.step4sub')}</div>
                    </div>
                </div>
                <div className="fd-step-line" />
                <div className="fd-step pending">
                    <div className="fd-step-icon">5</div>
                    <div className="fd-step-texts">
                        <div className="fd-step-title">5. {t('fl.step5')}</div>
                        <div className="fd-step-sub">{t('fl.step5sub')}</div>
                    </div>
                </div>
            </div>

            <div className="body-grid">
                <div className="left-col">
                    {/* LOT INFO */}
                    <div className="section-card fd-lot-info anim-in anim-d2">
                        <h3 className="fd-card-title">{t('fl.lotInfo')}</h3>
                        <div className="fd-lot-info-body">
                            <img src="/wheat.png" alt="Wheat" />
                            <div className="fd-lot-info-grid">
                                <div className="fd-info-cell"><span className="lbl">{t('fl.culture')}</span><span className="val">{t('lot.wheat')}</span></div>
                                <div className="fd-info-cell"><span className="lbl">{t('fl.lotId')}</span><span className="val">UA-2026-WHEAT-001</span></div>
                                <div className="fd-info-cell"><span className="lbl">{t('fl.sort')}</span><span className="val">Подолянка</span></div>
                                <div className="fd-info-cell"><span className="lbl">{t('fl.createdDate')}</span><span className="val">15.05.2026</span></div>
                                <div className="fd-info-cell"><span className="lbl">{t('fl.class')}</span><span className="val">2 клас</span></div>
                                <div className="fd-info-cell"><span className="lbl">{t('fl.farmerLabel')}</span><span className="val">ФОП Петренко І.М.</span></div>
                                <div className="fd-info-cell"><span className="lbl">{t('fl.volume')}</span><span className="val">500 т</span></div>
                                <div className="fd-info-cell"><span className="lbl">{t('fl.fieldCadastre')}</span><span className="val">6825083600:04:001:1234</span></div>
                                <div className="fd-info-cell"><span className="lbl">{t('fl.pricePerTon')}</span><span className="val">215 USDC</span></div>
                                <div className="fd-info-cell"><span className="lbl">{t('fl.regionLabel')}</span><span className="val">{lang === 'ua' ? 'Черкаська обл.' : 'Cherkasy region'}</span></div>
                                <div className="fd-info-cell"><span className="lbl">{t('fl.totalSum')}</span><span className="val font-bold">107,500 USDC</span></div>
                                <div className="fd-info-cell"><span className="lbl">{t('fl.statusLabel')}</span><span className="val"><span className="status-badge status-border">{t('status.border')}</span></span></div>
                            </div>
                        </div>
                    </div>

                    {/* DOCUMENTS */}
                    <div className="section-card fd-docs anim-in anim-d3">
                        <h3 className="fd-card-title">{t('fl.docs')}</h3>
                        <div className="fd-docs-grid">
                            <div className="fd-doc-card">
                                <div className="doc-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg></div>
                                <div className="doc-title">{t('fl.cadastreDoc')}</div>
                                <div className="doc-badge green">{t('fl.confirmed')}</div>
                                <div className="doc-desc">{t('fl.cadastreDesc')}</div>
                                <div className="doc-id">6825083600:04:001:1234</div>
                                <button className="doc-btn">{t('fl.viewBtn')}</button>
                            </div>
                            <div className="fd-doc-card">
                                <div className="doc-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1565c0" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg></div>
                                <div className="doc-title">{t('fl.labDoc')}</div>
                                <div className="doc-badge green">{t('fl.confirmed')}</div>
                                <div className="doc-desc">{t('fl.labDesc')}</div>
                                <div className="doc-id">Сертифікат: UKAS-8765</div>
                                <button className="doc-btn">{t('fl.viewBtn')}</button>
                            </div>
                            <div className="fd-doc-card">
                                <div className="doc-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg></div>
                                <div className="doc-title">{t('fl.efoodDoc')}</div>
                                <div className="doc-badge green">{t('fl.issued')}</div>
                                <div className="doc-desc">{t('fl.efoodDesc')}</div>
                                <div className="doc-id">№ UA-FF-2026-123456</div>
                                <button className="doc-btn">{t('fl.viewBtn')}</button>
                            </div>
                            <div className="fd-doc-card">
                                <div className="doc-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e65100" strokeWidth="2"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg></div>
                                <div className="doc-title">{t('fl.echerhaDoc')}</div>
                                <div className="doc-badge orange">{t('status.queue')}</div>
                                <div className="doc-desc">Статус: {t('status.border')}</div>
                                <div className="doc-id">Черга: 12 авто</div>
                                <button className="doc-btn">{t('fl.moreBtn')}</button>
                            </div>
                        </div>
                    </div>

                    <div className="section-card fd-history anim-in anim-d4">
                        <h3 className="fd-card-title">{t('fl.eventHistory')}</h3>
                        <div className="timeline">
                            <div className="timeline-item">
                                <div className="timeline-dot green" />
                                <div className="timeline-content">
                                    <div className="timeline-header">
                                        <span className="timeline-title">Лот створено та підписано КЕП</span>
                                        <span className="timeline-date">15.05.2026 10:15</span>
                                    </div>
                                    <div className="timeline-body">Петренко І.М.</div>
                                </div>
                            </div>
                            <div className="timeline-item">
                                <div className="timeline-dot green" />
                                <div className="timeline-content">
                                    <div className="timeline-header">
                                        <span className="timeline-title">Лабораторний сертифікат завантажено</span>
                                        <span className="timeline-date">16.05.2026 09:30</span>
                                    </div>
                                    <div className="timeline-body">UKAS перевірено через API</div>
                                </div>
                            </div>
                            <div className="timeline-item">
                                <div className="timeline-dot green" />
                                <div className="timeline-content">
                                    <div className="timeline-header">
                                        <span className="timeline-title">eFood сертифікат отримано</span>
                                        <span className="timeline-date">17.05.2026 11:45</span>
                                    </div>
                                    <div className="timeline-body">Фітосанітарний контроль пройдено</div>
                                </div>
                            </div>
                            <div className="timeline-item">
                                <div className="timeline-dot green" />
                                <div className="timeline-content">
                                    <div className="timeline-header">
                                        <span className="timeline-title">Вантаж відправлено</span>
                                        <span className="timeline-date">18.05.2026 08:20</span>
                                    </div>
                                    <div className="timeline-body">GPS моніторинг активний</div>
                                </div>
                            </div>
                            <div className="timeline-item">
                                <div className="timeline-dot orange pulse" />
                                <div className="timeline-content">
                                    <div className="timeline-header">
                                        <span className="timeline-title font-bold">Прибув на кордон (Ягодин)</span>
                                        <span className="timeline-date">19.05.2026 12:10</span>
                                    </div>
                                    <div className="timeline-body">Додано в чергу: 12 авто</div>
                                    <div className="timeline-info">Очікує перетину кордону<br />Оплата буде здійснена автоматично</div>
                                </div>
                            </div>
                        </div>
                        <button className="fd-show-more">{t('fl.showMoreEvents')} ▾</button>
                    </div>
                </div>

                <div className="right-col">
                    {/* GPS MONITORING */}
                    <div className="section-card fd-gps anim-in anim-d2">
                        <div className="fd-card-header">
                            <h3 className="fd-card-title">{t('fl.gpsTitle')}</h3>
                            <div className="map-realtime-tag" style={{ position: 'static' }}><span className="map-realtime-dot" />{t('gps.realtime')}</div>
                        </div>
                        <div className="map-placeholder map-large">
                            <svg viewBox="0 0 400 220" style={{ width: '100%', height: '100%' }}>
                                <rect width="400" height="220" fill="#e8eef4" />
                                <path d="M0,0 L200,0 L180,60 L160,100 L140,130 L120,160 L100,180 L0,220 Z" fill="#dce8d0" stroke="#c5d4b5" strokeWidth="0.5" />
                                <text x="60" y="40" fill="#5a7a3a" fontSize="10" fontWeight="600" fontFamily="Inter">Польща</text>
                                <path d="M200,0 L400,0 L400,220 L100,220 L120,160 L140,130 L160,100 L180,60 Z" fill="#fff9c4" stroke="#f0e68c" strokeWidth="0.5" />
                                <text x="300" y="40" fill="#8d6e3f" fontSize="10" fontWeight="600" fontFamily="Inter">Україна</text>
                                <path d="M200,0 L180,60 L160,100 L140,130 L120,160 L100,180 L100,220" fill="none" stroke="#9e9e9e" strokeWidth="2" strokeDasharray="6,3" />
                                <path d="M340,170 C300,160 260,140 220,120 C200,110 180,100 160,85 C140,70 120,55 80,45" fill="none" stroke="#2e7d32" strokeWidth="3" strokeLinecap="round" />
                                <circle cx="175" cy="90" r="6" fill="#f44336" stroke="#fff" strokeWidth="3" />
                                <rect x="132" y="65" width="86" height="18" rx="4" fill="rgba(244,67,54,0.9)" />
                                <text x="175" y="77" fill="#fff" fontSize="8" fontWeight="600" textAnchor="middle" fontFamily="Inter">🏁 Ягодин (Черга)</text>
                                <text x="330" y="185" fill="#5f6368" fontSize="8" fontFamily="Inter">Тернопіль</text>
                                <text x="255" y="150" fill="#5f6368" fontSize="8" fontFamily="Inter">Львів</text>
                                <text x="168" y="105" fontSize="16">🚚</text>
                            </svg>
                        </div>
                        <div className="fd-gps-info">
                            <div>
                                <div className="lbl">{t('fl.currentLocation')}</div>
                                <div className="val">{t('fl.locationValue')}</div>
                                <div className="sub">{t('fl.lastUpdate')}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div className="lbl">{t('fl.queueStatus')}</div>
                                <div className="val">{t('fl.queueValue')}</div>
                                <div className="sub">{t('fl.estimated')}</div>
                            </div>
                        </div>
                    </div>

                    <div className="section-card fd-payment anim-in anim-d3">
                        <div className="fd-card-header">
                            <h3 className="fd-card-title">{t('fl.buyerPayment')}</h3>
                            <span className="view-all-link">{t('fl.dealDetails')}</span>
                        </div>
                        <div className="fd-payment-grid">
                            <div><span className="lbl">{t('fl.buyer')}</span><div className="val flex-center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg> Miller Grains Ltd.</div></div>
                            <div><span className="lbl">{t('fl.contract')}</span><div className="val">CON-2026-045</div></div>
                            <div><span className="lbl">{t('fl.escrowAmount')}</span><div className="val-big">107,500 USDC</div><div className="status-badge green-text" style={{ marginTop: 4 }}>✓ {t('fl.locked')}</div></div>
                        </div>
                        <div className="fd-sc-info">
                            <div>
                                <div className="lbl">{t('fl.smartContract')}</div>
                                <div className="val">TradeEscrow.sol</div>
                                <a href="#" className="sc-link">{t('fl.viewOnSolscan')} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" /></svg></a>
                            </div>
                            <div>
                                <div className="lbl">{t('fl.paymentCondition')}</div>
                                <div className="val">{t('fl.paymentConditionVal')}</div>
                                <div className="sub">{t('fl.autoVia')}</div>
                            </div>
                        </div>
                    </div>

                    <div className="section-card fd-analytics anim-in anim-d4">
                        <div className="fd-card-header">
                            <h3 className="fd-card-title">{t('fl.revenue')}</h3>
                            <span className="view-all-link">{t('fl.allTime')}</span>
                        </div>
                        <div className="fd-analytics-grid">
                            <div><div className="lbl">{t('fl.totalRevenue')}</div><div className="val-xl">$24,850 USDC</div></div>
                            <div><div className="lbl">{t('fl.lotsSold')}</div><div className="val-xl">12</div></div>
                            <div><div className="lbl">{t('fl.inProcess')}</div><div className="val-xl">3</div></div>
                            <div><div className="lbl">{t('fl.avgPrice')}</div><div className="val-xl">$213 USDC</div></div>
                        </div>
                        <div className="fd-chart">
                            <div className="lbl">{t('fl.revenueByMonth')}</div>
                            <div className="chart-bars">
                                <div className="bar-col"><div className="bar" style={{ height: '30%' }}></div><span>Груд</span></div>
                                <div className="bar-col"><div className="bar" style={{ height: '40%' }}></div><span>Січ</span></div>
                                <div className="bar-col"><div className="bar" style={{ height: '50%' }}></div><span>Лют</span></div>
                                <div className="bar-col"><div className="bar" style={{ height: '60%' }}></div><span>Бер</span></div>
                                <div className="bar-col"><div className="bar" style={{ height: '75%' }}></div><span>Кві</span></div>
                                <div className="bar-col"><div className="bar" style={{ height: '100%' }}></div><span>Тра</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
