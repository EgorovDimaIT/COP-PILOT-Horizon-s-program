import React, { useEffect, useState } from 'react';
import type { GrainLot } from '../services/api';
import { lotApi } from '../services/api';
import { LotCard } from '../components/LotCard';
import { Plus, Search, Filter } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const [lots, setLots] = useState<GrainLot[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLots = async () => {
            try {
                const data = await lotApi.getLots();
                setLots(data.lots);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLots();
    }, []);

    return (
        <div className="animate-fade-in stagger-1">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Grain Lots</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Manage and track agricultural exports transparently.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn">
                        <Filter size={18} /> Filter
                    </button>
                    <button className="btn btn-primary">
                        <Plus size={18} /> New Lot
                    </button>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Search size={20} color="var(--text-secondary)" />
                    <input
                        type="text"
                        placeholder="Search by ID, Status, or Cadastre Number..."
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            width: '100%',
                            outline: 'none',
                            fontSize: '1rem'
                        }}
                    />
                </div>
            </div>

            {loading ? (
                <div className="empty-state">Loading lots...</div>
            ) : lots.length > 0 ? (
                <div className="lot-grid">
                    {lots.map((lot) => (
                        <LotCard key={lot.lot_id} lot={lot} />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">🌾</div>
                    <h2>No grain lots found</h2>
                    <p style={{ marginTop: '0.5rem' }}>Register a new lot to start tracking your supply chain.</p>
                </div>
            )}
        </div>
    );
};
