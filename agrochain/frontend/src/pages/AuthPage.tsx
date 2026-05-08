import React, { useState } from 'react';
import { useI18n } from '../i18n';

type AuthMode = 'login' | 'register';

interface RegisterForm {
  role: 'farmer' | 'buyer';
  name: string;
  company: string;
  email: string;
  phone: string;
  rnokpp: string;   // ІПН (для farmers)
  edrpou: string;   // ЄДРПОУ (для companies)
  region: string;
  password: string;
  passwordConfirm: string;
  agreeTerms: boolean;
}

interface LoginForm {
  email: string;
  password: string;
  remember: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL || window.location.origin;

export const AuthPage: React.FC<{
  onAuth: (role: 'farmer' | 'buyer') => void;
  initialMode?: 'login' | 'register';
  onBack?: () => void;
}> = ({ onAuth, initialMode = 'login', onBack }) => {
  const { lang, setLang } = useI18n() as any;
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [loginForm, setLoginForm] = useState<LoginForm>({ email: '', password: '', remember: false });
  const [regForm, setRegForm] = useState<RegisterForm>({
    role: 'farmer', name: '', company: '', email: '', phone: '',
    rnokpp: '', edrpou: '', region: '', password: '', passwordConfirm: '', agreeTerms: false,
  });

  const UKRAINE_REGIONS = [
    'Вінницька', 'Волинська', 'Дніпропетровська', 'Донецька', 'Житомирська',
    'Закарпатська', 'Запорізька', 'Івано-Франківська', 'Київська', 'Кіровоградська',
    'Луганська', 'Львівська', 'Миколаївська', 'Одеська', 'Полтавська',
    'Рівненська', 'Сумська', 'Тернопільська', 'Харківська', 'Херсонська',
    'Хмельницька', 'Черкаська', 'Чернівецька', 'Чернігівська', 'м. Київ',
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginForm.email, password: loginForm.password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Невірний email або пароль');
      }
      const data = await res.json();
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('user_role', data.role);
      onAuth(data.role);
    } catch (err: any) {
      setError(err.message || 'Помилка входу');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (regForm.password !== regForm.passwordConfirm) {
      setError('Паролі не співпадають'); return;
    }
    if (!regForm.agreeTerms) {
      setError('Необхідно прийняти умови використання'); return;
    }
    if (regForm.role === 'farmer' && regForm.rnokpp.length !== 10) {
      setError('РНОКПП має містити 10 цифр'); return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Помилка реєстрації');
      }
      setSuccess('Реєстрація успішна! Перевірте пошту для підтвердження.');
      setTimeout(() => setMode('login'), 2500);
    } catch (err: any) {
      setError(err.message || 'Помилка реєстрації');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-shape auth-bg-shape-1" />
        <div className="auth-bg-shape auth-bg-shape-2" />
        <div className="auth-bg-shape auth-bg-shape-3" />
      </div>

      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">🌾</div>
          <div>
            <div className="auth-brand-title">AgroChain Ukraine</div>
            <div className="auth-brand-sub">Blockchain Grain Platform</div>
          </div>
        </div>

        <div className="auth-hero">
          <h2 className="auth-hero-title">Прозорий та безпечний<br />експорт зерна з України</h2>
          <p className="auth-hero-desc">
            Blockchain-верифікація · GPS-моніторинг · Автоматичний ескроу
          </p>
          <div className="auth-stats">
            <div className="auth-stat"><span className="auth-stat-num">1,240+</span><span className="auth-stat-lbl">Зернових лотів</span></div>
            <div className="auth-stat"><span className="auth-stat-num">€42M</span><span className="auth-stat-lbl">Оброблено платежів</span></div>
            <div className="auth-stat"><span className="auth-stat-num">98%</span><span className="auth-stat-lbl">Успішних угод</span></div>
          </div>
          <div className="auth-badges">
            <div className="auth-badge">✓ COP-PILOT Horizon Europe</div>
            <div className="auth-badge">✓ Solana Blockchain</div>
            <div className="auth-badge">✓ UKAS Certified</div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          {/* Back + Language switcher */}
          <div className="auth-top-row">
            {onBack && (
              <button className="auth-back-btn" onClick={onBack}>← {lang === 'ua' ? 'Назад' : 'Back'}</button>
            )}
            <div className="auth-lang">
              <button className={`lang-btn ${lang === 'ua' ? 'active' : ''}`} onClick={() => setLang?.('ua')}>UA</button>
              <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang?.('en')}>EN</button>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            >
              Вхід
            </button>
            <button
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
            >
              Реєстрація
            </button>
          </div>

          {error && <div className="auth-alert auth-alert-error">⚠️ {error}</div>}
          {success && <div className="auth-alert auth-alert-success">✓ {success}</div>}

          {/* ===== LOGIN FORM ===== */}
          {mode === 'login' && (
            <form className="auth-form" onSubmit={handleLogin} autoComplete="on">
              <div className="auth-field">
                <label className="auth-label">Email або телефон</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">📧</span>
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="farmer@example.com"
                    value={loginForm.email}
                    onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Пароль</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">🔒</span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                    required
                    autoComplete="current-password"
                  />
                  <button type="button" className="auth-eye" onClick={() => setShowPass(p => !p)}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="auth-row-between">
                <label className="auth-check">
                  <input type="checkbox" checked={loginForm.remember}
                    onChange={e => setLoginForm(p => ({ ...p, remember: e.target.checked }))} />
                  Запам'ятати мене
                </label>
                <button type="button" className="auth-link">Забули пароль?</button>
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? <span className="auth-spinner" /> : null}
                {loading ? 'Вхід...' : '→ Увійти'}
              </button>

              {/* Quick demo login */}
              <div className="auth-demo-row">
                <span className="auth-demo-label">Демо-доступ:</span>
                <button type="button" className="auth-demo-btn"
                  onClick={() => { setLoginForm({ email: 'farmer@demo.agrochain.ua', password: 'demo1234', remember: false }); }}>
                  🌾 Фермер
                </button>
                <button type="button" className="auth-demo-btn"
                  onClick={() => { setLoginForm({ email: 'buyer@demo.agrochain.ua', password: 'demo1234', remember: false }); }}>
                  🏢 Покупець
                </button>
              </div>
            </form>
          )}

          {/* ===== REGISTER FORM ===== */}
          {mode === 'register' && (
            <form className="auth-form" onSubmit={handleRegister} autoComplete="on">
              {/* Role selection */}
              <div className="auth-field">
                <label className="auth-label">Тип аккаунту</label>
                <div className="auth-role-select">
                  <button
                    type="button"
                    className={`auth-role-btn ${regForm.role === 'farmer' ? 'active' : ''}`}
                    onClick={() => setRegForm(p => ({ ...p, role: 'farmer' }))}
                  >
                    <span className="auth-role-icon">🌾</span>
                    <span className="auth-role-title">Фермер</span>
                    <span className="auth-role-desc">Продаю зерно</span>
                  </button>
                  <button
                    type="button"
                    className={`auth-role-btn ${regForm.role === 'buyer' ? 'active' : ''}`}
                    onClick={() => setRegForm(p => ({ ...p, role: 'buyer' }))}
                  >
                    <span className="auth-role-icon">🏢</span>
                    <span className="auth-role-title">Покупець</span>
                    <span className="auth-role-desc">Купую зерно ЄС</span>
                  </button>
                </div>
              </div>

              <div className="auth-grid-2">
                <div className="auth-field">
                  <label className="auth-label">ПІБ *</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon">👤</span>
                    <input type="text" className="auth-input" placeholder="Петренко Іван Михайлович"
                      value={regForm.name} onChange={e => setRegForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                </div>
                <div className="auth-field">
                  <label className="auth-label">Компанія</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon">🏭</span>
                    <input type="text" className="auth-input" placeholder="ФОП або ТОВ"
                      value={regForm.company} onChange={e => setRegForm(p => ({ ...p, company: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="auth-grid-2">
                <div className="auth-field">
                  <label className="auth-label">Email *</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon">📧</span>
                    <input type="email" className="auth-input" placeholder="email@example.com"
                      value={regForm.email} onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))} required autoComplete="email" />
                  </div>
                </div>
                <div className="auth-field">
                  <label className="auth-label">Телефон *</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon">📱</span>
                    <input type="tel" className="auth-input" placeholder="+380501234567"
                      value={regForm.phone} onChange={e => setRegForm(p => ({ ...p, phone: e.target.value }))} required />
                  </div>
                </div>
              </div>

              {regForm.role === 'farmer' ? (
                <div className="auth-grid-2">
                  <div className="auth-field">
                    <label className="auth-label">РНОКПП (ІПН) *</label>
                    <div className="auth-input-wrap">
                      <span className="auth-input-icon">🆔</span>
                      <input type="text" className="auth-input" placeholder="10 цифр" maxLength={10}
                        value={regForm.rnokpp} onChange={e => setRegForm(p => ({ ...p, rnokpp: e.target.value.replace(/\D/g, '') }))} required />
                    </div>
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">Область *</label>
                    <div className="auth-input-wrap">
                      <span className="auth-input-icon">📍</span>
                      <select className="auth-input auth-select"
                        value={regForm.region} onChange={e => setRegForm(p => ({ ...p, region: e.target.value }))} required>
                        <option value="">Оберіть область</option>
                        {UKRAINE_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="auth-grid-2">
                  <div className="auth-field">
                    <label className="auth-label">ЄДРПОУ</label>
                    <div className="auth-input-wrap">
                      <span className="auth-input-icon">🏛️</span>
                      <input type="text" className="auth-input" placeholder="8 цифр" maxLength={8}
                        value={regForm.edrpou} onChange={e => setRegForm(p => ({ ...p, edrpou: e.target.value.replace(/\D/g, '') }))} />
                    </div>
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">Країна</label>
                    <div className="auth-input-wrap">
                      <span className="auth-input-icon">🌍</span>
                      <select className="auth-input auth-select"
                        value={regForm.region} onChange={e => setRegForm(p => ({ ...p, region: e.target.value }))}>
                        <option value="">Оберіть країну</option>
                        <option value="DE">Німеччина</option>
                        <option value="PL">Польща</option>
                        <option value="IT">Італія</option>
                        <option value="FR">Франція</option>
                        <option value="NL">Нідерланди</option>
                        <option value="ES">Іспанія</option>
                        <option value="UA">Україна</option>
                        <option value="OTHER">Інша</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="auth-grid-2">
                <div className="auth-field">
                  <label className="auth-label">Пароль *</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon">🔒</span>
                    <input type={showPass ? 'text' : 'password'} className="auth-input" placeholder="Мін. 8 символів"
                      value={regForm.password} onChange={e => setRegForm(p => ({ ...p, password: e.target.value }))} required minLength={8} autoComplete="new-password" />
                    <button type="button" className="auth-eye" onClick={() => setShowPass(p => !p)}>{showPass ? '🙈' : '👁️'}</button>
                  </div>
                </div>
                <div className="auth-field">
                  <label className="auth-label">Підтвердити пароль *</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon">🔒</span>
                    <input type={showPass ? 'text' : 'password'} className="auth-input" placeholder="Повторіть пароль"
                      value={regForm.passwordConfirm} onChange={e => setRegForm(p => ({ ...p, passwordConfirm: e.target.value }))} required autoComplete="new-password" />
                  </div>
                </div>
              </div>

              {/* Password strength */}
              {regForm.password && (
                <div className="auth-pwd-strength">
                  <div className="pwd-bar">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`pwd-seg ${regForm.password.length > i * 3 + 4 ? (
                        regForm.password.length >= 12 ? 'strong' :
                          regForm.password.length >= 8 ? 'medium' : 'weak'
                      ) : ''
                        }`} />
                    ))}
                  </div>
                  <span className="pwd-label">{
                    regForm.password.length < 8 ? '🔴 Слабкий' :
                      regForm.password.length < 12 ? '🟡 Середній' : '🟢 Надійний'
                  }</span>
                </div>
              )}

              <label className="auth-check auth-check-terms">
                <input type="checkbox" checked={regForm.agreeTerms}
                  onChange={e => setRegForm(p => ({ ...p, agreeTerms: e.target.checked }))} />
                <span>Я погоджуюсь з <a href="/terms" className="auth-link-inline" target="_blank">Умовами використання</a> та <a href="/privacy" className="auth-link-inline" target="_blank">Політикою конфіденційності</a></span>
              </label>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? <span className="auth-spinner" /> : null}
                {loading ? 'Реєстрація...' : `✓ Зареєструватись як ${regForm.role === 'farmer' ? 'Фермер' : 'Покупець'}`}
              </button>
            </form>
          )}

          <div className="auth-footer">
            <div className="auth-security">
              <span>🔐 SSL захищено</span>
              <span>·</span>
              <span>🏦 PSD2 сумісно</span>
              <span>·</span>
              <span>🌐 GDPR</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
