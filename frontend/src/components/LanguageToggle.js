import React from 'react';
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';
import '../styles/LanguageToggle.css';

function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="toggle-panel">
      <button className="theme-toggle-btn" onClick={toggleTheme} title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
        {isDark ? '☀️' : '🌙'}
      </button>
      <div className="language-toggle">
        <button
          className={`lang-btn ${language === 'en' ? 'active' : ''}`}
          onClick={() => language !== 'en' && toggleLanguage()}
        >
          ENG
        </button>
        <span className="lang-separator">/</span>
        <button
          className={`lang-btn ${language === 'ta' ? 'active' : ''}`}
          onClick={() => language !== 'ta' && toggleLanguage()}
        >
          TAM
        </button>
      </div>
    </div>
  );
}

export default LanguageToggle;
