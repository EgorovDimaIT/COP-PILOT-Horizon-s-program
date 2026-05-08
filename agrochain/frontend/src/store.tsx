import React, { createContext, useContext, useState, useCallback } from 'react';

export type Page = 'dashboard' | 'search' | 'deals' | 'monitoring' | 'payments' | 'contracts' | 'favorites' | 'notifications' | 'analytics' | 'certificates' | 'settings';
export type FarmerPage = 'panel' | 'myLots' | 'createLot' | 'myFields' | 'documents' | 'labCerts' | 'efood' | 'logistics' | 'echerha' | 'payments' | 'analytics' | 'notifications' | 'settings';
export type Mode = 'buyer' | 'farmer';

interface AppState {
    mode: Mode;
    setMode: (m: Mode) => void;
    page: Page;
    setPage: (p: Page) => void;
    farmerPage: FarmerPage;
    setFarmerPage: (p: FarmerPage) => void;
    favorites: Set<string>;
    toggleFavorite: (id: string) => void;
    notifications: { id: string; text: string; time: string; read: boolean }[];
    markNotifRead: (id: string) => void;
    unreadCount: number;
    showNotifPanel: boolean;
    setShowNotifPanel: (v: boolean) => void;
    selectedLot: string | null;
    setSelectedLot: (id: string | null) => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    activeFilters: Record<string, string>;
    setFilter: (k: string, v: string) => void;
    clearFilters: () => void;
    sortBy: string;
    setSortBy: (s: string) => void;
    gpsFilter: string;
    setGpsFilter: (f: string) => void;
    showDocModal: string | null;
    setShowDocModal: (id: string | null) => void;
    showShareModal: boolean;
    setShowShareModal: (v: boolean) => void;
}

const defaultNotifs = [
    { id: 'n1', text: 'notif.lot_arrived', time: '5 хв тому', read: false },
    { id: 'n2', text: 'notif.payment_escrowed', time: '1 год тому', read: false },
    { id: 'n3', text: 'notif.ukas_verified', time: '3 год тому', read: true },
    { id: 'n4', text: 'notif.border_crossed', time: 'Вчора', read: true },
];

const AppContext = createContext<AppState>({} as AppState);

export const AppProvider: React.FC<{ children: React.ReactNode; initialMode?: Mode }> = ({ children, initialMode = 'farmer' }) => {
    const [mode, setMode] = useState<Mode>(initialMode);
    const [page, setPage] = useState<Page>('dashboard');
    const [farmerPage, setFarmerPage] = useState<FarmerPage>('panel');

    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [notifications, setNotifications] = useState(defaultNotifs);
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    const [selectedLot, setSelectedLot] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
    const [sortBy, setSortBy] = useState('newest');
    const [gpsFilter, setGpsFilter] = useState('your');
    const [showDocModal, setShowDocModal] = useState<string | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);

    const toggleFavorite = useCallback((id: string) => {
        setFavorites(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    }, []);
    const markNotifRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);
    const setFilter = useCallback((k: string, v: string) => setActiveFilters(p => ({ ...p, [k]: v })), []);
    const clearFilters = useCallback(() => setActiveFilters({}), []);
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <AppContext.Provider value={{
            mode, setMode, page, setPage, farmerPage, setFarmerPage,
            favorites, toggleFavorite, notifications, markNotifRead, unreadCount,
            showNotifPanel, setShowNotifPanel, selectedLot, setSelectedLot,
            searchQuery, setSearchQuery, activeFilters, setFilter, clearFilters,
            sortBy, setSortBy, gpsFilter, setGpsFilter,
            showDocModal, setShowDocModal, showShareModal, setShowShareModal,
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
