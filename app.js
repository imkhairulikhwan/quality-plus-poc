// DOM Elements
const qrCodeCanvas = document.getElementById('qrCode');
const createOfferBtn = document.getElementById('createOffer');
const remoteSDPInput = document.getElementById('remoteSDP');
const connectBtn = document.getElementById('connect');
const sendFileBtn = document.getElementById('sendFile');
const fileInput = document.getElementById('fileInput');
const downloadLink = document.getElementById('downloadLink');
const videoScanDiv = document.getElementById('videoScan');
const startScannerBtn = document.getElementById('startScanner');
const manualSDPInput = document.getElementById('manualSDPInput');
const connectUsingStringBtn = document.getElementById('connectUsingString');
const qrCodeContent = document.getElementById('qrCodeContent');
const logContainer = document.getElementById('logContainer');
const logContent = document.getElementById('logContent');

// Global State
let isDataChannelOpen = false;
let peerConnection;
let dataChannel;
let html5QrCode; // QR Code Scanner instance
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
const CHUNK_SIZE = 16 * 1024;
let receiveBuffer = [];
let receivedSize = 0;

// Event Listeners
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
createOfferBtn.addEventListener('click', createOffer);
connectBtn.addEventListener('click', () => handleRemoteSDP(remoteSDPInput.value));
sendFileBtn.addEventListener('click', sendFile);
initializeScanner();
