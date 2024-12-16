
// Main application logic and event listeners
startScannerBtn.addEventListener('click', startQrScanner);
connectUsingStringBtn.addEventListener('click', () => {
  const qrCodeString = manualSDPInput.value.trim();
  if (!qrCodeString) {
    logMessage('Please enter a valid QR code string.', 'error');
    return;
  }
  try {
    handleRemoteSDP(qrCodeString);
    logMessage('Successfully connected using QR code string.', 'info');
  } catch (error) {
    logMessage(`Error connecting with QR code string: ${error.message}`, 'error');
  }
});

// Event Listeners
createOfferBtn.addEventListener('click', createOffer);
connectBtn.addEventListener('click', () => handleRemoteSDP(remoteSDPInput.value));
sendFileBtn.addEventListener('click', sendFile);
initializeScanner();
