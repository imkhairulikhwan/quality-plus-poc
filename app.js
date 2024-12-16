// DOM Elements
const qrCodeCanvas = document.getElementById('qrCode');
const qrCodeContent = document.getElementById('qrCodeContent');
const createOfferBtn = document.getElementById('createOffer');
const remoteSDPInput = document.getElementById('remoteSDP');
const connectBtn = document.getElementById('connect');
const sendMessageBtn = document.getElementById('sendMessage');
const messageInput = document.getElementById('messageInput');
const receivedMessage = document.getElementById('receivedMessage');
const videoScan = document.getElementById('videoScan');
const copyQrCodeContentBtn = document.getElementById('copyQrCodeContent');
const logContent = document.getElementById('logContent');

let peerConnection;
let dataChannel;
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// Utility: Log messages to the interface
function logMessage(message, type = 'info') {
  const logEntry = document.createElement('p');
  logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;

  // Style logs based on type
  if (type === 'error') logEntry.style.color = 'red';
  if (type === 'warning') logEntry.style.color = 'orange';

  logContent.appendChild(logEntry);
  logContent.parentElement.scrollTop = logContent.scrollHeight;
}

// Generate WebRTC offer and display it as a QR code and string
async function createOffer() {
  try {
    peerConnection = new RTCPeerConnection(config);
    dataChannel = peerConnection.createDataChannel('chat');

    // Log data channel events
    dataChannel.onopen = () => {
      logMessage('Data channel is open.');
      sendMessageBtn.disabled = false; // Enable Send button
    };
    dataChannel.onclose = () => {
      logMessage('Data channel is closed.', 'warning');
      sendMessageBtn.disabled = true; // Disable Send button
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    const offerSDP = JSON.stringify(peerConnection.localDescription);

    // Generate the QR Code
    QRCode.toCanvas(qrCodeCanvas, offerSDP, (err) => {
      if (err) {
        logMessage('Failed to generate QR Code: ' + err.message, 'error');
        return;
      }
      logMessage('QR Code generated successfully.');
    });

    // Display the QR code content as a string
    qrCodeContent.value = offerSDP;
  } catch (error) {
    logMessage('Error creating WebRTC offer: ' + error.message, 'error');
  }
}

// Handle remote SDP (from scanned QR code or input)
async function handleRemoteSDP(remoteSDP) {
  try {
    peerConnection = new RTCPeerConnection(config);

    // Listen for data channel creation
    peerConnection.ondatachannel = (event) => {
      dataChannel = event.channel;

      dataChannel.onopen = () => {
        logMessage('Data channel is open.');
        sendMessageBtn.disabled = false; // Enable Send button
      };
      dataChannel.onclose = () => {
        logMessage('Data channel is closed.', 'warning');
        sendMessageBtn.disabled = true; // Disable Send button
      };

      dataChannel.onmessage = (event) => {
        receivedMessage.textContent = event.data;
        logMessage('Message received: ' + event.data);
      };
    };

    const remoteDescription = new RTCSessionDescription(JSON.parse(remoteSDP));
    await peerConnection.setRemoteDescription(remoteDescription);

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    logMessage('WebRTC connection established successfully.');
  } catch (error) {
    logMessage('Error handling remote SDP: ' + error.message, 'error');
  }
}

// Send a message via the data channel
function sendMessage() {
  if (dataChannel && dataChannel.readyState === 'open') {
    dataChannel.send(messageInput.value);
    logMessage('Message sent: ' + messageInput.value);
    messageInput.value = ''; // Clear the input field after sending
  } else {
    logMessage('Data channel is not open yet.', 'error');
  }
}

// Copy QR Code content to clipboard
function copyQrCodeContent() {
  if (qrCodeContent.value) {
    navigator.clipboard.writeText(qrCodeContent.value)
      .then(() => logMessage('QR code content copied to clipboard.'))
      .catch((err) => logMessage('Failed to copy QR code content: ' + err.message, 'error'));
  } else {
    logMessage('No QR Code content to copy.', 'warning');
  }
}

// Initialize QR Code scanner
function initializeScanner() {
  const html5QrCode = new Html5Qrcode('videoScan');
  let lastErrorMessage = '';

  html5QrCode.start(
    { facingMode: 'environment' },
    {
      fps: 5, // Reduce scanning frequency
      qrbox: { width: 250, height: 250 } // Define scanning area
    },
    (decodedText) => {
      remoteSDPInput.value = decodedText;
      html5QrCode.stop();
      logMessage('QR Code scanned successfully.');
    },
    (errorMessage) => {
      // Suppress repetitive error messages
      if (errorMessage !== lastErrorMessage) {
        logMessage('QR Code scanning error: ' + errorMessage, 'warning');
        lastErrorMessage = errorMessage;
      }
    }
  ).catch((error) => logMessage('Error initializing scanner: ' + error.message, 'error'));
}

// Event Listeners
createOfferBtn.addEventListener('click', createOffer);
connectBtn.addEventListener('click', () => handleRemoteSDP(remoteSDPInput.value));
sendMessageBtn.addEventListener('click', sendMessage);
copyQrCodeContentBtn.addEventListener('click', copyQrCodeContent);
initializeScanner();
