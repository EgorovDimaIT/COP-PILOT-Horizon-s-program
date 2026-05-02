import React from 'react';
import { StatsRow } from '../components/StatsRow';
import { LotsSection } from '../components/LotsSection';
import { GPSMonitor } from '../components/GPSMonitor';
import { ActiveDeals } from '../components/ActiveDeals';
import { HowItWorks, SupportCard } from '../components/HowItWorks';
import { useI18n } from '../i18n';

export const BuyerDashboard: React.FC = () => {
    const { t } = useI18n();
    return (
        <>
            <div className="welcome anim-in">
                <h1>{t('welcome.title')}</h1>
                <p>{t('welcome.sub')}</p>
            </div>
            <StatsRow />
            <div className="body-grid">
                <LotsSection />
                <div className="right-col">
                    <GPSMonitor />
                    <ActiveDeals />
                </div>
            </div>
            <div className="bottom-grid">
                <HowItWorks />
                <SupportCard />
            </div>
        </>
    );
};
