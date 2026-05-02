import React from 'react';
import { useI18n } from '../i18n';

const deals = [
    { lot: 'UA-2026-WHEAT-001', qty: '500 т', statusKey: 'status.border', dotCls: 'dot-border', escrow: '$107,500' },
    { lot: 'UA-2026-CORN-045', qty: '800 т', statusKey: 'status.transit', dotCls: 'dot-transit', escrow: '$148,000' },
    { lot: 'UA-2026-SUN-023', qty: '300 т', statusKey: 'deals.confirmed', dotCls: 'dot-confirmed', escrow: '$126,000' },
];

export const ActiveDeals: React.FC = () => {
    const { t } = useI18n();
    return (
        <div className="section-card anim-in anim-d3">
            <div className="section-header">
                <div className="section-title">{t('deals.title')}</div>
                <span className="view-all-link">{t('deals.viewAll')}</span>
            </div>
            <table className="deals-table">
                <thead>
                    <tr>
                        <th>{t('deals.lot')}</th>
                        <th>{t('deals.qty')}</th>
                        <th>{t('deals.status')}</th>
                        <th style={{ textAlign: 'right' }}>{t('deals.escrow')}</th>
                    </tr>
                </thead>
                <tbody>
                    {deals.map(d => (
                        <tr key={d.lot}>
                            <td style={{ fontWeight: 600, fontSize: '0.8rem' }}>{d.lot}</td>
                            <td>{d.qty}</td>
                            <td><span className="deal-status"><span className={`deal-status-dot ${d.dotCls}`} />{t(d.statusKey)}</span></td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{d.escrow}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="deals-total">
                <span>{t('deals.totalEscrow')}</span>
                <span className="deals-total-value">$381,500 USDC</span>
            </div>
        </div>
    );
};
