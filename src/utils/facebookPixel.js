// Facebook Pixel utility functions
export const fbq = window.fbq || function() {};

export const trackPurchase = (value, currency = 'EUR', eventId = null) => {
  if (window.fbq) {
    const finalEventId = eventId || `purchase_${Date.now()}`;
    
    window.fbq('track', 'Purchase', {
      value: value,
      currency: currency,
      event_id: finalEventId,
      content_type: 'product',
      content_name: 'Mega Jump Park Ticket',
      num_items: 1
    });
    
    return finalEventId;
  }
  return null;
};

export const trackPageView = () => {
  if (window.fbq) {
    window.fbq('track', 'PageView');
  }
};

export const trackViewContent = (contentName, value, currency = 'EUR') => {
  if (window.fbq) {
    window.fbq('track', 'ViewContent', {
      content_name: contentName,
      value: value,
      currency: currency
    });
  }
}; 