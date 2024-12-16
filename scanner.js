
// QR Code Scanner logic
function initializeScanner() {
  html5QrCode = new Html5Qrcode('videoScan');
}

function startQrScanner() {
  if (!html5QrCode) {
    logMessage('QR Code scanner is not initialized.', 'error');
    return;
  }

  videoScanDiv.style.display = 'block';

  html5QrCode.start(
    { facingMode: 'environment' },
    {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      disableFlip: true
    },
    (decodedText) => {
      remoteSDPInput.value = decodedText;
      html5QrCode.stop();
      videoScanDiv.style.display = 'none';
      logMessage('QR Code scanned successfully.', 'info');
    },
    (errorMessage) => {
      logMessage(`QR Code scanning error: ${errorMessage}`, 'warning');
    }
  ).catch((error) => logMessage(`Error initializing scanner: ${error.message}`, 'error'));
}
