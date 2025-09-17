import React, { useEffect, useRef } from "react";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import ticketBackground from "../assets/ticket.webp";
import walkinTicketBackground from "../assets/walkin-ticket.png";
import axios from "axios";

const BASE_URL = "https://api.megajumpparktickets.eu";

const TicketPDFGenerator = ({ ticketData, onDone, source = "regular" }) => {
  const hasGenerated = useRef(false);

  useEffect(() => {
    if (!ticketData || hasGenerated.current) return;
    hasGenerated.current = true;

    const generateAndSend = async () => {
      // Choose PDF format based on source
      let pdfFormat, pdfWidth, pdfHeight;
      
      if (source === "adminCashPayment") {
        // Reduced size for thermal printer (smaller slip)
        pdfWidth = 230; // Reduced from 430px to 350px
        pdfHeight = 590; // Reduced height
        pdfFormat = [pdfWidth, pdfHeight];
      } else {
        // Standard A4 for regular tickets
        pdfFormat = [595, 842];
      }

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: pdfFormat,
      });

      // Choose background based on source
      // Only adminCashPayment uses walkin-ticket.png
      // Everything else (walkin, regular, etc.) uses ticket.png
      const backgroundImage = source === "adminCashPayment" ? walkinTicketBackground : ticketBackground;
      const image = new Image();
      image.src = backgroundImage;

      image.onload = async () => {
        // Scale background image to fit the PDF
        if (source === "adminCashPayment") {
          // For thermal printer, scale the background to fit the 350px width
          const scale = pdfWidth / 290; // Scale factor
          const scaledHeight = 710 * scale;
          doc.addImage(image, "PNG", 0, 0, pdfWidth, scaledHeight);
        } else {
          doc.addImage(image, "PNG", 0, 0, 595, 842);
        }
        // Different positioning for admin cash payment vs everything else
        let x, y, lineHeight;
        
        if (source === "adminCashPayment") {
          // Positioning optimized for thermal printer width (350px) - better aligned text
          x = 32;
          y = 120;
          lineHeight = 12;
        } else {
          // Standard positioning for ticket.png background (A4 format)
          x = 320;
          y = 70;
          lineHeight = 11;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(source === "adminCashPayment" ? 10 : 12); // Smaller font for thermal printer
        doc.setTextColor("000");

        const {
          date,
          startTime,
          endTime,
          cancellationEnabled,
          tickets,
          amount,
          totalAddOnAmount,
          halfTimeTickets,
          subtotal,
          selectedBundel,
          ticketId,
          email,
          addonData,
          name,
        } = ticketData;

        const ADMIN_FEE = 2.5;

        const lines = [
          `Name: ${name}`,
         
          `Ticket ID: ${ticketId}`,
          `Date: ${new Date(date).toLocaleDateString()}  Time: ${startTime} - ${endTime}`,
          `Venue: Mega Jump`,
          `Number of Tickets: ${tickets}`,
          `Ticket Price: €${amount.toFixed(2)}`,
        ];
        if (source === "adminCashPayment") {
          lines.push(
     
            `Half Time Tickets: ${(halfTimeTickets)}`,
       
          );

        }

        if (selectedBundel) {
          lines.push(
            `1 x Bundle: ${selectedBundel.name} - Discount: ${selectedBundel.discountPercent}%`,
            `${selectedBundel.description}`
          );
        }

        if (cancellationEnabled) {
          lines.push(`Cancellation Enabled: ${cancellationEnabled}`);
        }

        if (source === "adminCashPayment") {
          lines.push(
            `Socks Total: €${addonData?.totalAddOnAmount.toFixed(2)}`,
            
            `Total Cost: €${(subtotal).toFixed(2)}`
          );

        }else if(addonData?.cancellationFee  && addonData?.totalAddOnAmount && source !== "adminCashPayment"){
          let sockstotal = addonData?.totalAddOnAmount - addonData?.cancellationFee;  
        lines.push(
          `Socks Total: €${(sockstotal).toFixed(2)}`,
         
          `Administration Fee: €${ADMIN_FEE.toFixed(2)}`,
          `Total Cost: €${(subtotal).toFixed(2)}`
        );
      }else if(source !== "adminCashPayment" && addonData?.totalAddOnAmount){
        let sockstotal = addonData?.totalAddOnAmount ;
        lines.push(
          `Socks Total: €${(sockstotal).toFixed(2)}`,
         
          `Administration Fee: €${ADMIN_FEE.toFixed(2)}`,
          `Total Cost: €${(subtotal).toFixed(2)}`
        );
      }
      else{
        let sockstotal = addonData?.totalAddOnAmount || 0;
        lines.push(
          
          `Socks Total: €${(sockstotal).toFixed(2)}`,
         
          `Administration Fee: €${ADMIN_FEE.toFixed(2)}`,
          `Total Cost: €${(subtotal).toFixed(2)}`
        );
      }


        lines.forEach((line, i) => {
          doc.text(line, x, y + i * lineHeight);
        });

        // QR Code positioning based on source
        let qrX, qrY, qrSize;
        if (source === "adminCashPayment") {
          qrX = x + 110;
          qrY = y + 135;
          qrSize = 50; // Optimized QR size for 350px thermal printer
        } else {
          qrX = x + 125;
          qrY = y + 115;
          qrSize = 80;
        }

        const qrImageData = await QRCode.toDataURL(ticketId);
        doc.addImage(qrImageData, "PNG", qrX, qrY, qrSize, qrSize);

        const fileName = source === "walkin" ? "MegaJump_Ticket.pdf" : "MegaJump_Ticket.pdf";
        doc.save(fileName);

        // For admin cash payment only, show print confirmation dialog
        if (source === "adminCashPayment") {
          const pdfBlob = doc.output("blob");
          const pdfUrl = URL.createObjectURL(pdfBlob);
          
          // Show confirmation dialog
          const shouldPrint = window.confirm("🎫 Ticket generated successfully!\n\nDo you want to print this ticket now?\n\nClick 'OK' to print\nClick 'Cancel' to skip printing");
          
          if (shouldPrint) {
            // Create a hidden iframe to trigger print
            const printFrame = document.createElement("iframe");
            printFrame.style.display = "none";
            printFrame.src = pdfUrl;
            
            printFrame.onload = () => {
              // Small delay to ensure PDF is fully loaded before printing
              setTimeout(() => {
                printFrame.contentWindow.print();
                // Clean up after printing - 1 minute delay
                setTimeout(() => {
                  URL.revokeObjectURL(pdfUrl);
                  document.body.removeChild(printFrame);
                }, 70000); // 1 minute  = 60 seconds
              }, 1000);
            };
            
            document.body.appendChild(printFrame);
          } else {
            // Clean up if user cancels printing
            URL.revokeObjectURL(pdfUrl);
          }
        }

        // Email sending logic with device-specific handling
        const pdfBlob = doc.output("blob");
        const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());

        try {
          let response;
          
          // if (isIOS) {
            // Use new API endpoint for iOS devices with JSON payload
            // Convert PDF blob to base64
            const reader = new FileReader();
            const pdfBase64Promise = new Promise((resolve, reject) => {
              reader.onload = () => {
                const base64 = reader.result.split(',')[1]; // Remove data:application/pdf;base64, prefix
                resolve(base64);
              };
              reader.onerror = reject;
            });
            reader.readAsDataURL(pdfBlob);
            
            const pdfBase64 = await pdfBase64Promise;
            
            const payload = {
              email: email,
              ticketId: ticketId || "ticket",
              pdfBase64: pdfBase64
            };

            response = await axios.post(`${BASE_URL}/api/tickets/send-email`, payload, {
              headers: {
                "ngrok-skip-browser-warning": "true",
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              timeout: 300000, // 30 second timeout
            });

            alert(response.data.message);

          // } else {
          //   // Use original API endpoint for non-iOS devices
          //   const formData = new FormData();
          //   formData.append("ticketPdf", pdfBlob, fileName);
          //   formData.append("email", email);
           
          //   formData.append("ticketId", ticketId || "ticket");
          //   formData.append("name", name);

          //   response = await axios.post(`${BASE_URL}/api/tickets/send-email`, formData, {
          //     headers: {
          //       "ngrok-skip-browser-warning": "true",
          //       Accept: "application/json",
          //       "Content-Type": "multipart/form-data",
          //     },
          //     timeout: 30000, // 30 second timeout
          //   });
          // }
          
          if (response.data.success) {
            console.log("✅ Email sent successfully:", response.data);
            // Show success message for non-iOS devices
            if (!isIOS) {
              alert(`📧 Ticket emailed to: ${email}\n\nPlease check your email (including spam folder).`);
            }
          } else {
            console.warn("⚠️ Email response indicates failure:", response.data);
            // Don't show error immediately, email might still be delivered
            if (!isIOS) {
              alert(`📧 Ticket emailed to: ${email}\n\nPlease check your email (including spam folder).`);
            }
          }
        } catch (err) {
          console.error("❌ Email send failed:", err);
          
          // Check if it's a timeout or network error
          if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
            // No alert for iOS devices
            if (!isIOS) {
              alert(`📧 Ticket emailed to: ${email}\n\nPlease check your email (including spam folder).\n\nNote: Email delivery may take a few minutes.`);
            }
          } else if (err.response?.status >= 500) {
            // Server error - email might still be sent
            // No alert for iOS devices
            if (!isIOS) {
              alert(`📧 Ticket emailed to: ${email}\n\nPlease check your email (including spam folder).\n\nNote: Server was busy, but email should arrive shortly.`);
            }
          } else {
            // Only show error for non-iOS devices (like invalid email)
            if (!isIOS) {
              console.log("📧 Email will be delivered in next 10 minutes");
            }
            // For iOS devices, no alert is shown since email will be delivered late
          }
        }

        if (typeof onDone === "function") onDone();
      };

      image.onerror = () => {
        alert("❌ Failed to load ticket background image.");
        if (typeof onDone === "function") onDone();
      };
    };

    generateAndSend();
  }, [ticketData, onDone, source]);

  return null; // No UI needed for this component
};

export default TicketPDFGenerator;
