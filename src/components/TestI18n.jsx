import React from 'react';
import { useTranslation } from 'react-i18next';

const TestI18n = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>i18n Test Component</h2>
      <p>Current Language: {i18n.language}</p>
      <p>Welcome: {t('common.welcome')}</p>
      <p>Language: {t('common.language')}</p>
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => changeLanguage('en')}
          style={{ 
            margin: '0 10px', 
            padding: '10px 20px',
            background: i18n.language === 'en' ? '#007bff' : '#f8f9fa',
            color: i18n.language === 'en' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          English
        </button>
        <button 
          onClick={() => changeLanguage('es')}
          style={{ 
            margin: '0 10px', 
            padding: '10px 20px',
            background: i18n.language === 'es' ? '#007bff' : '#f8f9fa',
            color: i18n.language === 'es' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Español
        </button>
      </div>
      
      <div style={{ marginTop: '20px', textAlign: 'left', maxWidth: '600px', margin: '20px auto' }}>
        <h3>Translation Examples:</h3>
        <ul>
          <li>Dashboard: {t('admin.dashboard')}</li>
          <li>Event Settings: {t('admin.eventSettings')}</li>
          <li>Time Slots: {t('admin.timeSlots')}</li>
          <li>Bundles: {t('admin.bundles')}</li>
          <li>Tickets: {t('admin.tickets')}</li>
          <li>Analytics: {t('admin.analytics')}</li>
          <li>Cancel Requests: {t('admin.cancelRequests')}</li>
        </ul>
      </div>
    </div>
  );
};

export default TestI18n; 