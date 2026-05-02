import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { GrainLot } from '../services/api';
import { lotApi } from '../services/api';
import { getStatusBadge } from '../components/LotCard';
import { ArrowLeft, CheckCircle, ExternalLink, Leaf, Shield } from 'lucide-react';

export const LotDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [lot, setLot] = useState<GrainLot | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchDetailedLot = async () => {
            try {
                const data = await lotApi.getLotDetails(id);
                setLot(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetailedLot();
    }, [id]);

    if (loading) return <div className="empty-state animate-fade-in">Loading lot details...</div>;
    if (!lot) return <div className="empty-state animate-fade-in">Lot not found.</div>;

    return (
        <div className="animate-fade-in stagger-1">
            <button
                onClick={() => navigate(-1)}
                className="btn"
                style={{ marginBottom: '2rem', background: 'transparent', border: 'none', padding: 0 }}
            >
                <ArrowLeft size={18} /> Back to Dashboard
            </button>

            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">{lot.lot_id}</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Registered on {new Date(lot.created_at).toLocaleString()}
                    </p>
                </div>
                <div>
                    {getStatusBadge(lot.status)}
                </div>
            </div>

            <div className="details-grid">
                {/* Left Column: Properties */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div className="glass-panel animate-fade-in stagger-2">
                        <div className="detail-section" style={{ marginBottom: 0 }}>
                            <h3><Shield size={20} className="info-icon" /> Core Information</h3>
                            <div className="kv-grid">
                                <div className="kv-pair">
                                    <label>Farmer RNOKPP</label>
                                    <span>{lot.farmer_id}</span>
                                </div>
                                <div className="kv-pair">
                                    <label>Price</label>
                                    <span style={{ color: 'var(--accent-color)', fontWeight: 700 }}>
                                        {lot.price_usdc} USDC
                                    </span>
                                </div>
                                <div className="kv-pair">
                                    <label>Cadastre Number</label>
                                    <span>{lot.cadastre_number}</span>
                                </div>
                                <div className="kv-pair">
                                    <label>Truck Plate</label>
                                    <span>{lot.truck_plate}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel animate-fade-in stagger-3">
                        <div className="detail-section" style={{ marginBottom: 0 }}>
                            <h3><Leaf size={20} className="info-icon" /> Quality & Phytosanitary</h3>
                            <div className="kv-grid">
                                <div className="kv-pair">
                                    <label>UKAS Verification</label>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: lot.ukas_verified ? 'var(--status-ready)' : 'var(--status-draft)' }}>
                                        {lot.ukas_verified ? <CheckCircle size={16} /> : null}
                                        {lot.ukas_verified ? 'Verified Active' : 'Pending'}
                                    </span>
                                </div>
                                <div className="kv-pair">
                                    <label>Phyto Certificate</label>
                                    <span>{lot.phyto_cert_number || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel animate-fade-in stagger-3">
                        <div className="detail-section" style={{ marginBottom: 0 }}>
                            <h3>🔗 Blockchain Sync (Solana)</h3>
                            <div className="kv-pair" style={{ gridColumn: '1 / -1' }}>
                                <label>Registry Transaction</label>
                                {lot.solana_tx ? (
                                    <a
                                        href={`https://explorer.solana.com/tx/${lot.solana_tx}?cluster=devnet`}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ color: 'var(--accent-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                    >
                                        <span className="hash-value">{lot.solana_tx}</span>
                                        <ExternalLink size={14} />
                                    </a>
                                ) : (
                                    <span>Pending Synchronization</span>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column: Hash Chain Timeline */}
                <div className="glass-panel animate-fade-in stagger-2">
                    <div className="detail-section" style={{ marginBottom: 0 }}>
                        <h3><CheckCircle size={20} className="info-icon" /> Audit Trail (Hash Chain)</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Cryptographic hashes anchoring truth to the blockchain.
                        </p>

                        <div className="chain-timeline">
                            <div className="chain-node active">
                                <div className="node-dot"></div>
                                <div className="node-content">
                                    <div className="node-title">Electronic Signature (KEP)</div>
                                    <div className="node-desc">Farmer ownership signing</div>
                                    {lot.hash_chain.kep && <div className="node-hash">{lot.hash_chain.kep}</div>}
                                </div>
                            </div>

                            <div className="chain-node active">
                                <div className="node-dot"></div>
                                <div className="node-content">
                                    <div className="node-title">Cadastre Verification</div>
                                    <div className="node-desc">Land registry polygon bounding</div>
                                    {lot.hash_chain.cadastre && <div className="node-hash">{lot.hash_chain.cadastre}</div>}
                                </div>
                            </div>

                            <div className={`chain-node ${lot.hash_chain.ukas ? 'active' : ''}`}>
                                <div className="node-dot"></div>
                                <div className="node-content">
                                    <div className="node-title">UKAS Lab Checking</div>
                                    <div className="node-desc">Accredited ISO Quality Check</div>
                                    {lot.hash_chain.ukas ? (
                                        <div className="node-hash">{lot.hash_chain.ukas}</div>
                                    ) : (
                                        <div className="node-desc" style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>Awaiting verification</div>
                                    )}
                                </div>
                            </div>

                            <div className={`chain-node ${lot.hash_chain.phyto ? 'active' : ''}`}>
                                <div className="node-dot"></div>
                                <div className="node-content">
                                    <div className="node-title">Phytosanitary Protocol</div>
                                    <div className="node-desc">DPSS / TRACES NT sync</div>
                                    {lot.hash_chain.phyto ? (
                                        <div className="node-hash">{lot.hash_chain.phyto}</div>
                                    ) : (
                                        <div className="node-desc" style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>Awaiting clearance</div>
                                    )}
                                </div>
                            </div>

                            <div className={`chain-node ${lot.hash_chain.echerha ? 'active' : ''}`}>
                                <div className="node-dot"></div>
                                <div className="node-content">
                                    <div className="node-title">Border Crossing (eCherha)</div>
                                    <div className="node-desc">Oracle confirmation, escort release</div>
                                    {lot.hash_chain.echerha ? (
                                        <div className="node-hash">{lot.hash_chain.echerha}</div>
                                    ) : (
                                        <div className="node-desc" style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>Pending Transit</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
