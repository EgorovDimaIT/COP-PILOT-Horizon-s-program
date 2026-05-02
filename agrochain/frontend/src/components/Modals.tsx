import React from 'react';
import { useI18n } from '../i18n';
import { useApp } from '../store';
import { ALL_LOTS } from './LotsSection';

export const LotModal: React.FC = () => {
    const { t, lang } = useI18n();
    const { selectedLot, setSelectedLot, favorites, toggleFavorite } = useApp();

    if (!selectedLot) return null;
    const lot = ALL_LOTS.find(l => l.id === selectedLot);
    if (!lot) return null;

    const isFav = favorites.has(lot.id);

    return (
        <div className="modal-overlay" onClick={() => setSelectedLot(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{t('modal.details')}: {lot.id}</h2>
                    <button className="modal-close" onClick={() => setSelectedLot(null)}>✕</button>
                </div>

                <div className="modal-body">
                    <div className="modal-img-row">
                        <img src={lot.img} alt={t(lot.nameKey)} className="modal-img" />
                        <div className="modal-main-info">
                            <h3>{t(lot.nameKey)}</h3>
                            <span className={`lot-status-badge ${lot.statusCls}`}>{t(lot.statusKey)}</span>
                            <div className="modal-price-big">{lot.price}<span className="modal-price-unit"> / {lang === 'ua' ? 'тонна' : 'ton'}</span></div>
                            <div className="modal-qty">{t('lots.available')}: {lot.quantity} {lot.unit}</div>
                        </div>
                    </div>

                    <div className="modal-grid">
                        {lot.protein && <div className="modal-kv"><span className="modal-k">{t('modal.protein')}</span><span className="modal-v">{lot.protein}</span></div>}
                        {lot.moisture && <div className="modal-kv"><span className="modal-k">{t('modal.moisture')}</span><span className="modal-v">{lot.moisture}</span></div>}
                        {lot.gluten && <div className="modal-kv"><span className="modal-k">{t('modal.gluten')}</span><span className="modal-v">{lot.gluten}</span></div>}
                        {lot.impurities && <div className="modal-kv"><span className="modal-k">{t('modal.impurities')}</span><span className="modal-v">{lot.impurities}</span></div>}
                        {lot.oilContent && <div className="modal-kv"><span className="modal-k">{t('modal.oilContent')}</span><span className="modal-v">{lot.oilContent}</span></div>}
                        <div className="modal-kv"><span className="modal-k">{t('modal.farmer')}</span><span className="modal-v">{lot.farmer}</span></div>
                        <div className="modal-kv"><span className="modal-k">{t('modal.region')}</span><span className="modal-v">{lang === 'ua' ? lot.locationUa : lot.locationEn}</span></div>
                        <div className="modal-kv"><span className="modal-k">{t('modal.cadastre')}</span><span className="modal-v mono">{lot.cadastre}</span></div>
                        <div className="modal-kv"><span className="modal-k">{t('modal.solana')}</span><span className="modal-v mono">{lot.solanaTx}</span></div>
                    </div>

                    <div className="modal-chain-title">{t('modal.hashChain')}</div>
                    <div className="modal-chain">
                        {Object.entries(lot.hashChain).map(([k, v]) => (
                            <div className="modal-chain-row" key={k}>
                                <span className="modal-chain-key">{k.toUpperCase()}</span>
                                <span className="modal-chain-val">{v}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="modal-actions">
                    <button className="modal-fav-btn" onClick={() => toggleFavorite(lot.id)}>
                        {isFav ? '★' : '☆'} {isFav ? t('modal.removeFavorite') : t('modal.addFavorite')}
                    </button>
                    <button className="modal-buy-btn">{t('modal.buyNow')}</button>
                </div>
            </div>
        </div>
    );
};

export const NotificationPanel: React.FC = () => {
    const { t } = useI18n();
    const { showNotifPanel, setShowNotifPanel, notifications, markNotifRead } = useApp();

    if (!showNotifPanel) return null;

    return (
        <div className="notif-overlay" onClick={() => setShowNotifPanel(false)}>
            <div className="notif-panel" onClick={(e) => e.stopPropagation()}>
                <div className="notif-header">
                    <h3>{t('notif.title')}</h3>
                    <button className="modal-close" onClick={() => setShowNotifPanel(false)}>✕</button>
                </div>
                <div className="notif-list">
                    {notifications.map(n => (
                        <div key={n.id} className={`notif-item${n.read ? ' read' : ''}`} onClick={() => markNotifRead(n.id)}>
                            <div className="notif-text">{t(n.text)}</div>
                            <div className="notif-time">{n.time}</div>
                            {!n.read && <span className="notif-unread-dot" />}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
