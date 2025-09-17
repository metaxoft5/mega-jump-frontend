import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      padding: '10px',
      border: '1px solid #e0e0e0'
    }}>
      <div style={{ marginBottom: '5px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
        {t('common.language')}
      </div>
      <div style={{ display: 'flex', gap: '5px' }}>
        <button
          onClick={() => changeLanguage('en')}
          style={{
            padding: '5px 10px',
            border: i18n.language === 'en' ? '2px solid #007bff' : '1px solid #ddd',
            borderRadius: '4px',
            background: i18n.language === 'en' ? '#007bff' : 'white',
            color: i18n.language === 'en' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: i18n.language === 'en' ? 'bold' : 'normal'
          }}
        >
          {t('common.english')}
        </button>
        <button
          onClick={() => changeLanguage('es')}
          style={{
            padding: '5px 10px',
            border: i18n.language === 'es' ? '2px solid #007bff' : '1px solid #ddd',
            borderRadius: '4px',
            background: i18n.language === 'es' ? '#007bff' : 'white',
            color: i18n.language === 'es' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: i18n.language === 'es' ? 'bold' : 'normal'
          }}
        >
          {t('common.spanish')}
        </button>
      </div>
    </div>
  );
};

export default LanguageSwitcher; 