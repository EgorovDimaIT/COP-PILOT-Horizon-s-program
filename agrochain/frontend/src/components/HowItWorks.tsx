import React from 'react';
import { useI18n } from '../i18n';

export const HowItWorks: React.FC = () => {
    const { t } = useI18n();
    const steps = [
        { icon: '📝', label: t('how.step1'), desc: t('how.step1.desc') },
        { icon: '✅', label: t('how.step2'), desc: t('how.step2.desc') },
        { icon: '🚚', label: t('how.step3'), desc: t('how.step3.desc') },
        { icon: '💰', label: t('how.step4'), desc: t('how.step4.desc') },
        { icon: '🎉', label: t('how.step5'), desc: t('how.step5.desc') },
    ];
    return (
        <div className="how-section anim-in anim-d4">
            <div className="how-title">{t('how.title')}</div>
            <div className="how-steps">
                {steps.map((s, i) => (
                    <div className="how-step" key={i}>
                        <div className="how-icon">{s.icon}</div>
                        <div className="how-num">{i + 1}.</div>
                        <div className="how-label">{s.label}</div>
                        <div className="how-desc">{s.desc}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const SupportCard: React.FC = () => {
    const { t } = useI18n();
    return (
        <div className="support-card anim-in anim-d4">
            <div className="support-header">
                <div className="support-title">{t('support.title')} 🎧</div>
                <span className="support-badge-24">24/7</span>
            </div>
            <div className="support-text">{t('support.question')}<br />{t('support.text')}</div>
            <button className="support-btn" onClick={() => window.open('mailto:support@agrochain.ua')}>💬 {t('support.btn')}</button>
        </div>
    );
};
