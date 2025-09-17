import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import CancelTicket from "./CancelTicket";
 
const PaymentConfirmed = ({ ticketData, onReturnToHome, settings }) => {
  const { t } = useTranslation();
  const [showCancellation, setShowCancellation] = useState(false);
   
  const BASE_URL = "https://api.megajumpparktickets.eu";
  useEffect(() => {
    console.log(ticketData);
    if (ticketData?.addonData?.totalAddOnAmount) {
      console.log(ticketData?.addonData?.totalAddOnAmount);
    }
console.log(settings);
   
  }, [ticketData]);

 
  

  // If showing cancellation, render the CancelTicket component
  if (showCancellation) {
    return <CancelTicket ticketData={ticketData} />;
  }

  const {
    amount = 0,
    socksCount = 0,
    email,
    date,
    addonData,
    subtotal,
    startTime,
    endTime,
    isCashPayment,
    halfTimeTickets,
    createdAt,
    tickets,
    selectedBundel,
    voucherData,
  } = ticketData;

  const ADMIN_FEE = 2.5;
  const formattedDate = new Date(createdAt).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });


  const bundleDiscount = selectedBundel
    ? selectedBundel.price * (selectedBundel.discountPercent / 100)
    : 0;

  const bundleNetPrice = selectedBundel
    ? selectedBundel.price - bundleDiscount
    : 0;

  const totalPrice = subtotal;
 

  return (
    <div className="confirmed-box">
      <h2>Mega Jump</h2>

      {isCashPayment && (
         <div className="fee-row">
         <p>{tickets} x {t('payment.individualTicket')}</p>
         <p>€{(tickets * (settings?.ticketPrice) ).toFixed(2) }</p>
       </div>
      )}

      {!isCashPayment && (
         <div className="fee-row">
         <p>{tickets} x {t('payment.individualTicket')}</p>
         <p>€{(amount - bundleNetPrice).toFixed(2) }</p>
       </div>
      )}
             {isCashPayment && halfTimeTickets > 0 && (
          <div className="fee-row">
          <p>{halfTimeTickets} x Half-Time {t('payment.individualTicket')}</p>
          <p>€{(halfTimeTickets * 9).toFixed(2)}</p>
        </div>
       )}

      {selectedBundel && (
        <>
          <div className="fee-row">
            <p>{t('payment.bundle')}: {selectedBundel.name} - {t('payment.discount')}: {selectedBundel.discountPercent}%</p>
            <p>
              €{selectedBundel.price.toFixed(2)} - €
              {bundleDiscount.toFixed(2)} = €
              {bundleNetPrice.toFixed(2)}
            </p>
          </div>

          <div className="fee-row">
            <p>{t('payment.bundleDescription')}:</p>
            <p>{selectedBundel.description}</p>
          </div>
        </>
      )}

      {socksCount > 0 && (
        <div className="fee-row">
          <p>{socksCount} x {t('payment.socksAddon')}</p>
          <p>€{(socksCount * (settings?.socksPrice || 0)).toFixed(2)}</p>
        </div>
      )}

      {addonData.cancellationEnabled && (
        <div className="fee-row">
          <p>{tickets === 0 ? selectedBundel.tickets : tickets} x {t('payment.cancellationService')}</p>
          <p>€{addonData.cancellationFee.toFixed(2)}</p>
        </div>
      )}
{!isCashPayment && (
      <div className="fee-row">
        <p>{t('payment.administrationFees')}</p>
        <p>€{ADMIN_FEE.toFixed(2)}</p>
      </div>
    )}

      {voucherData && (
        <div className="fee-row" style={{ color: '#4CAF50', fontWeight: 'bold' }}>
          <p>{t('payment.couponDiscount')} ({voucherData.voucher.discountType === 'percentage' ? `${voucherData.voucher.discountValue}%` : `€${voucherData.voucher.discountValue}`})</p>
          <p>-€{voucherData.discountAmount.toFixed(2)}</p>
        </div>
      )}

      <hr />

      <div className="fee-total">
        <p>{t('payment.total')}:</p>
        <p>€{totalPrice}</p>
      </div>

      <p className="tax-note">{t('payment.taxesIncluded')}</p>

      <h3 className="congrats">🎉 {t('payment.congratulations')}!</h3>
      <p className="email-note">
        {t('payment.emailSent')} <strong>{email}</strong> <br />
        {t('payment.emailDelay')}
      </p>

      <div className="button-row">
        <button className="modal-btn cancel" onClick={onReturnToHome}>
          {t('payment.megaJumpMadrid')}
        </button>
        <button className="modal-btn confirm" onClick={() => setShowCancellation(true)}>
          {t('payment.cancellationService')}
        </button>
      </div>

      <div className="receipt-info">
        <p>
          <strong>{t('payment.confirmationEmailSentTo')}:</strong> {email}
        </p>
        <p>
          <strong>{t('payment.dateTime')}:</strong> {formattedDate}
        </p>
        <p>
          <strong>{t('payment.eventDate')}:</strong> {date}
        </p>
        <p>
          <strong>{t('payment.slot')}:</strong> {startTime} - {endTime}
        </p>
      </div>
    </div>
  );
};

export default PaymentConfirmed;
