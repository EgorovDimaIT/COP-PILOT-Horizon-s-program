import React from 'react';
import { useI18n } from '../i18n';

export const StatsRow: React.FC = () => {
    const { t } = useI18n();
    const stats = [
        { num: '248', label: t('stat.available'), change: t('stat.available.change'), icon: '🌾', cls: 'green' },
        { num: '53', label: t('stat.transit'), change: t('stat.transit.change'), icon: '🚚', cls: 'orange' },
        { num: '18', label: t('stat.border'), change: t('stat.border.change'), icon: '🏁', cls: 'purple' },
        { num: '37', label: t('stat.completed'), change: t('stat.completed.change'), icon: '✅', cls: 'teal' },
        { num: '1,250,000', label: t('stat.escrow'), change: t('stat.escrow.change'), icon: '💰', cls: 'blue' },
    ];
    return (
        <div className="stats-row anim-in anim-d1">
            {stats.map((s, i) => (
                <div key={i} className="stat-card">
                    <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
                    <div className="stat-info">
                        <div className="stat-num">{s.num}</div>
                        <div className="stat-label">{s.label}</div>
                        <div className="stat-change">{s.change}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};
