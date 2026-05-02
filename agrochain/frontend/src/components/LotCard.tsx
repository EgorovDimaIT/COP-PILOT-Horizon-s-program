import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Truck, MapPin, DollarSign, Leaf } from 'lucide-react';
import type { GrainLot } from '../services/api';

export const getStatusBadge = (status: string) => {
    switch (status) {
        case 'DRAFT': return <span className="badge badge-draft">Draft</span>;
        case 'CADASTRE_VERIFIED': return <span className="badge badge-cadastre">Verified</span>;
        case 'UKAS_VERIFIED': return <span className="badge badge-ready">UKAS Checked</span>;
        case 'EXPORT_READY': return <span className="badge badge-ready">Ready To Export</span>;
        case 'IN_TRANSIT': return <span className="badge badge-transit">In Transit</span>;
        case 'BORDER_CROSSED': return <span className="badge badge-crossed">Border Crossed</span>;
        case 'PAYMENT_RELEASED': return <span className="badge badge-paid">Payment Released</span>;
        default: return <span className="badge badge-draft">{status}</span>;
    }
};

export const LotCard: React.FC<{ lot: GrainLot }> = ({ lot }) => {
    const navigate = useNavigate();

    return (
        <div className="glass-panel lot-card" onClick={() => navigate(`/lot/${lot.lot_id}`)}>
            <div className="lot-header">
                <div>
                    <div className="lot-id">{lot.lot_id}</div>
                    <span className="lot-date">Created {new Date(lot.created_at).toLocaleDateString()}</span>
                </div>
                {getStatusBadge(lot.status)}
            </div>

            <ul className="info-list">
                <li className="info-item">
                    <DollarSign size={18} className="info-icon" />
                    <span className="info-value">{lot.price_usdc} USDC</span>
                </li>
                <li className="info-item">
                    <MapPin size={18} className="info-icon" />
                    <span className="info-value">{lot.cadastre_number}</span>
                </li>
                {lot.truck_plate && (
                    <li className="info-item">
                        <Truck size={18} className="info-icon" />
                        <span className="info-value">{lot.truck_plate}</span>
                    </li>
                )}
                <li className="info-item">
                    <ShieldCheck size={18} className="info-icon" style={{ color: lot.ukas_verified ? '#10b981' : '#ef4444' }} />
                    <span className="info-value">UKAS: {lot.ukas_verified ? 'Verified' : 'Pending'}</span>
                </li>
                {lot.phyto_cert_number && (
                    <li className="info-item">
                        <Leaf size={18} className="info-icon" />
                        <span className="info-value">Phyto: {lot.phyto_cert_number}</span>
                    </li>
                )}
            </ul>

            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button className="btn w-full justify-center" style={{ width: '100%' }}>
                    View Details
                </button>
            </div>
        </div>
    );
};
