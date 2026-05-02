import React from 'react';
import { useI18n } from '../i18n';
import { useApp } from '../store';

export const GPSMonitor: React.FC = () => {
    const { t } = useI18n();
    const { gpsFilter, setGpsFilter } = useApp();

    const filters = [
        { key: 'your', label: t('gps.yourCargo'), icon: '🚚' },
        { key: 'border', label: t('gps.atBorder'), icon: '🏁' },
        { key: 'delivered', label: t('gps.delivered'), icon: '📍' },
        { key: 'all', label: t('gps.allCargo'), icon: '' },
    ];

    return (
        <div className="section-card anim-in anim-d2">
            <div className="section-header">
                <div className="section-title">{t('gps.title')}</div>
                <div className="map-realtime-tag" style={{ position: 'static' }}>
                    <span className="map-realtime-dot" />
                    {t('gps.realtime')}
                </div>
            </div>
            <div className="map-placeholder" style={{ background: '#e8eef4' }}>
                <svg viewBox="0 0 400 220" style={{ width: '100%', height: '100%' }}>
                    <rect width="400" height="220" fill="#e8eef4" />
                    <path d="M0,0 L200,0 L180,60 L160,100 L140,130 L120,160 L100,180 L0,220 Z" fill="#dce8d0" stroke="#c5d4b5" strokeWidth="0.5" />
                    <text x="60" y="40" fill="#5a7a3a" fontSize="10" fontWeight="600" fontFamily="Inter">Польща</text>
                    <path d="M200,0 L400,0 L400,220 L100,220 L120,160 L140,130 L160,100 L180,60 Z" fill="#fff9c4" stroke="#f0e68c" strokeWidth="0.5" />
                    <text x="300" y="40" fill="#8d6e3f" fontSize="10" fontWeight="600" fontFamily="Inter">Україна</text>
                    <path d="M200,0 L180,60 L160,100 L140,130 L120,160 L100,180 L100,220" fill="none" stroke="#9e9e9e" strokeWidth="2" strokeDasharray="6,3" />
                    <path d="M340,170 C300,160 260,140 220,120 C200,110 180,100 160,85 C140,70 120,55 80,45" fill="none" stroke="#2e7d32" strokeWidth="3" strokeLinecap="round" />
                    {(gpsFilter === 'your' || gpsFilter === 'all') && <circle cx="260" cy="135" r="5" fill="#ff9800" stroke="#fff" strokeWidth="2" />}
                    {(gpsFilter === 'border' || gpsFilter === 'all') && <circle cx="175" cy="90" r="6" fill="#f44336" stroke="#fff" strokeWidth="3" />}
                    {(gpsFilter === 'delivered' || gpsFilter === 'all') && <circle cx="80" cy="45" r="5" fill="#1565c0" stroke="#fff" strokeWidth="2" />}
                    {(gpsFilter === 'your' || gpsFilter === 'all') && <circle cx="340" cy="170" r="5" fill="#ff9800" stroke="#fff" strokeWidth="2" />}
                    <rect x="132" y="65" width="86" height="18" rx="4" fill="rgba(244,67,54,0.9)" />
                    <text x="175" y="77" fill="#fff" fontSize="8" fontWeight="600" textAnchor="middle" fontFamily="Inter">🏁 Ягодин (Черга)</text>
                    <text x="330" y="185" fill="#5f6368" fontSize="8" fontFamily="Inter">Тернопіль</text>
                    <text x="255" y="150" fill="#5f6368" fontSize="8" fontFamily="Inter">Львів</text>
                    <text x="168" y="105" fontSize="16">🚚</text>
                </svg>
            </div>
            <div className="map-controls">
                {filters.map(f => (
                    <button key={f.key} className={`map-control-chip${gpsFilter === f.key ? ' active' : ''}`} onClick={() => setGpsFilter(f.key)}>
                        {f.icon} {f.label}
                    </button>
                ))}
            </div>
        </div>
    );
};
