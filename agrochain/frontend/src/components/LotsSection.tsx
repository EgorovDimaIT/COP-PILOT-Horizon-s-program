import React, { useState } from 'react';
import { useI18n } from '../i18n';
import { useApp } from '../store';

export interface LotData {
    id: string;
    nameKey: string;
    img: string;
    premium: boolean;
    protein?: string;
    moisture?: string;
    gluten?: string;
    impurities?: string;
    oilContent?: string;
    locationUa: string;
    locationEn: string;
    statusKey: string;
    statusCls: string;
    statusDetailKey: string;
    statusDetail2Key?: string;
    price: string;
    quantity: number;
    unit: string;
    region: string;
    crop: string;
    cadastre: string;
    farmer: string;
    solanaTx: string;
    hashChain: Record<string, string>;
}

export const ALL_LOTS: LotData[] = [
    {
        id: 'UA-2026-WHEAT-001', nameKey: 'lot.wheat', img: '/wheat.png', premium: true,
        protein: '13.2%', moisture: '12.1%', gluten: '28.5%',
        locationUa: 'Черкаська обл., Україна', locationEn: 'Cherkasy region, Ukraine',
        statusKey: 'status.border', statusCls: 'status-border',
        statusDetailKey: 'status.queue', statusDetail2Key: '12',
        price: '$215', quantity: 500, unit: 'т', region: 'cherkasy', crop: 'wheat',
        cadastre: '6310138500:10:012:0045', farmer: 'Іванченко О.П.',
        solanaTx: '4mK8pRqN9wXyZ1vC2bN3mQ4w...', hashChain: { kep: 'a1b2c3...', cadastre: 'f5g6h7...', ukas: 'k9l0m1...', phyto: 'o3p4q5...' },
    },
    {
        id: 'UA-2026-CORN-045', nameKey: 'lot.corn', img: '/corn.png', premium: true,
        moisture: '13.8%', impurities: '2.1%',
        locationUa: 'Полтавська обл., Україна', locationEn: 'Poltava region, Ukraine',
        statusKey: 'status.transit', statusCls: 'status-transit',
        statusDetailKey: 'status.gps', statusDetail2Key: 'status.fromField',
        price: '$185', quantity: 800, unit: 'т', region: 'poltava', crop: 'corn',
        cadastre: '5310245600:03:007:0012', farmer: 'Петренко М.В.',
        solanaTx: '7xR2tAbCdEfGhIjKlMnOpQr...', hashChain: { kep: 'q1w2e3...', cadastre: 't5y6u7...', ukas: 'o9p0a1...' },
    },
    {
        id: 'UA-2026-SUN-023', nameKey: 'lot.sunflower', img: '/sunflower.png', premium: false,
        oilContent: '49.2%', moisture: '8.5%',
        locationUa: 'Дніпропетровська обл., Україна', locationEn: 'Dnipro region, Ukraine',
        statusKey: 'status.ready', statusCls: 'status-ready',
        statusDetailKey: 'status.docsReady',
        price: '$420', quantity: 300, unit: 'т', region: 'dnipro', crop: 'sunflower',
        cadastre: '1210567800:08:003:0089', farmer: 'Коваленко С.І.',
        solanaTx: '9zXyW1vU2tS3rQ4pO5nM6lK7...', hashChain: { kep: 'm1n2o3...', cadastre: 'p4q5r6...', ukas: 's7t8u9...' },
    },
];

export const LotsSection: React.FC = () => {
    const { t, lang } = useI18n();
    const { favorites, toggleFavorite, setSelectedLot, searchQuery, setSearchQuery, sortBy, setSortBy } = useApp();
    const [showSort, setShowSort] = useState(false);
    const [cropFilter, setCropFilter] = useState('');
    const [regionFilter, setRegionFilter] = useState('');
    const [showCropDrop, setShowCropDrop] = useState(false);
    const [showRegionDrop, setShowRegionDrop] = useState(false);

    let filtered = ALL_LOTS.filter(l => {
        const q = searchQuery.toLowerCase();
        if (q && !l.id.toLowerCase().includes(q) && !t(l.nameKey).toLowerCase().includes(q) && !(lang === 'ua' ? l.locationUa : l.locationEn).toLowerCase().includes(q)) return false;
        if (cropFilter && l.crop !== cropFilter) return false;
        if (regionFilter && l.region !== regionFilter) return false;
        return true;
    });

    if (sortBy === 'price_asc') filtered = [...filtered].sort((a, b) => parseFloat(a.price.replace('$', '')) - parseFloat(b.price.replace('$', '')));
    if (sortBy === 'price_desc') filtered = [...filtered].sort((a, b) => parseFloat(b.price.replace('$', '')) - parseFloat(a.price.replace('$', '')));
    if (sortBy === 'qty') filtered = [...filtered].sort((a, b) => b.quantity - a.quantity);

    const crops = [
        { key: '', ua: 'Всі', en: 'All' },
        { key: 'wheat', ua: 'Пшениця', en: 'Wheat' },
        { key: 'corn', ua: 'Кукурудза', en: 'Corn' },
        { key: 'sunflower', ua: 'Соняшник', en: 'Sunflower' },
    ];
    const regions = [
        { key: '', ua: 'Всі', en: 'All' },
        { key: 'cherkasy', ua: 'Черкаська', en: 'Cherkasy' },
        { key: 'poltava', ua: 'Полтавська', en: 'Poltava' },
        { key: 'dnipro', ua: 'Дніпропетровська', en: 'Dnipro' },
    ];
    const sorts = [
        { key: 'newest', ua: 'Нові', en: 'Newest' },
        { key: 'price_asc', ua: 'Ціна ↑', en: 'Price ↑' },
        { key: 'price_desc', ua: 'Ціна ↓', en: 'Price ↓' },
        { key: 'qty', ua: 'Кількість', en: 'Quantity' },
    ];

    return (
        <div className="section-card anim-in anim-d2">
            <div className="section-header">
                <div>
                    <div className="section-title">{t('lots.title')}</div>
                    <div className="section-subtitle">{t('lots.subtitle')}</div>
                </div>
                <button className="filter-btn" onClick={() => { setCropFilter(''); setRegionFilter(''); setSearchQuery(''); }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="20" y2="12" /><line x1="12" y1="18" x2="20" y2="18" /></svg>
                    {t('lots.filters')}
                </button>
            </div>

            <div className="search-bar">
                <div className="search-input">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input placeholder={t('lots.search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>

                {/* Crop dropdown */}
                <div style={{ position: 'relative' }}>
                    <button className={`filter-chip${cropFilter ? ' active-chip' : ''}`} onClick={() => { setShowCropDrop(!showCropDrop); setShowRegionDrop(false); setShowSort(false); }}>
                        {t('lots.culture')} {cropFilter ? `(${crops.find(c => c.key === cropFilter)?.[lang] || ''})` : '▾'}
                    </button>
                    {showCropDrop && (
                        <div className="dropdown-menu">
                            {crops.map(c => (
                                <button key={c.key} className={`dropdown-item${cropFilter === c.key ? ' selected' : ''}`} onClick={() => { setCropFilter(c.key); setShowCropDrop(false); }}>
                                    {c[lang]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Region dropdown */}
                <div style={{ position: 'relative' }}>
                    <button className={`filter-chip${regionFilter ? ' active-chip' : ''}`} onClick={() => { setShowRegionDrop(!showRegionDrop); setShowCropDrop(false); setShowSort(false); }}>
                        {t('lots.region')} {regionFilter ? `(${regions.find(r => r.key === regionFilter)?.[lang] || ''})` : '▾'}
                    </button>
                    {showRegionDrop && (
                        <div className="dropdown-menu">
                            {regions.map(r => (
                                <button key={r.key} className={`dropdown-item${regionFilter === r.key ? ' selected' : ''}`} onClick={() => { setRegionFilter(r.key); setShowRegionDrop(false); }}>
                                    {r[lang]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sort dropdown */}
                <div style={{ position: 'relative' }}>
                    <button className="filter-chip" onClick={() => { setShowSort(!showSort); setShowCropDrop(false); setShowRegionDrop(false); }}>
                        {t('lots.sort')} ▾
                    </button>
                    {showSort && (
                        <div className="dropdown-menu">
                            {sorts.map(s => (
                                <button key={s.key} className={`dropdown-item${sortBy === s.key ? ' selected' : ''}`} onClick={() => { setSortBy(s.key); setShowSort(false); }}>
                                    {s[lang]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="lot-list">
                {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#9aa0a6' }}>
                        {lang === 'ua' ? 'Лоти не знайдені. Спробуйте змінити фільтри.' : 'No lots found. Try changing filters.'}
                    </div>
                )}
                {filtered.map((lot) => (
                    <div className="lot-card" key={lot.id} onClick={() => setSelectedLot(lot.id)}>
                        <div className="lot-img-wrap">
                            <img src={lot.img} alt={t(lot.nameKey)} />
                            {lot.premium && <span className="lot-premium-tag">ПРЕМІУМ</span>}
                        </div>
                        <div className="lot-body">
                            <div className="lot-title-row">
                                <div>
                                    <div className="lot-name">{t(lot.nameKey)}</div>
                                    <div className="lot-id-text">Lot: {lot.id}</div>
                                </div>
                                <button className="lot-star" onClick={(e) => { e.stopPropagation(); toggleFavorite(lot.id); }}>
                                    {favorites.has(lot.id) ? '★' : '☆'}
                                </button>
                            </div>
                            <div className="lot-meta">
                                {lot.protein && `${t('modal.protein')}: ${lot.protein}`}
                                {lot.moisture && ` · ${t('modal.moisture')}: ${lot.moisture}`}
                                {lot.gluten && ` · ${t('modal.gluten')}: ${lot.gluten}`}
                                {lot.impurities && ` · ${t('modal.impurities')}: ${lot.impurities}`}
                                {lot.oilContent && ` · ${t('modal.oilContent')}: ${lot.oilContent}`}
                            </div>
                            <div className="lot-location">📍 {lang === 'ua' ? lot.locationUa : lot.locationEn}</div>
                            <div className="lot-badges">
                                <span className="badge badge-ukas">UKAS VERIFIED</span>
                                <span className="badge badge-efood">eFood EXPORT READY</span>
                            </div>
                        </div>
                        <div className="lot-right">
                            <span className={`lot-status-badge ${lot.statusCls}`}>{t(lot.statusKey)}</span>
                            <div className="lot-status-detail">
                                {t(lot.statusDetailKey)}
                                {lot.statusDetail2Key && <div>{lot.statusDetail2Key.startsWith('status.') ? t(lot.statusDetail2Key) : `${t('status.queue')}: ${lot.statusDetail2Key} ${t('status.auto')}`}</div>}
                            </div>
                            <div className="lot-price">{lot.price}</div>
                            <div className="lot-price-sub">{t('lots.pricePerTon')}</div>
                            <div className="lot-price-sub">{t('lots.available')}: {lot.quantity} {lot.unit}</div>
                            <button className="lot-view-btn" onClick={(e) => { e.stopPropagation(); setSelectedLot(lot.id); }}>
                                {t('lots.view')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filtered.length > 0 && (
                <button className="show-more-btn">{t('lots.showMore')} ▾</button>
            )}
        </div>
    );
};
