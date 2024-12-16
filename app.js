const qrCodeCanvas = document.getElementById('qrCode');
const createOfferBtn = document.getElementById('createOffer');
const remoteSDPInput = document.getElementById('remoteSDP');
const connectBtn = document.getElementById('connect');
const sendFileBtn = document.getElementById('sendFile');
const fileInput = document.getElementById('fileInput');
const downloadLink = document.getElementById('downloadLink');
const videoScan = document.getElementById('videoScan');
const qrCodeContent = document.getElementById('qrCodeContent');
const logContainer = document.getElementById('logContainer');
const logContent = document.getElementById('logContent');

let isDataChannelOpen = false;
let peerConnection;
let dataChannel;
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

const CHUNK_SIZE = 16 * 1024;
let receiveBuffer = [];
let receivedSize = 0;

// Utility function to log messages
function logMessage(message, type = 'info') {
  const logEntry = document.createElement('p');
  logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;

  if (type === 'error') {
    logEntry.style.color = 'red';
  } else if (type === 'warning') {
    logEntry.style.color = 'orange';
  }

  logContent.appendChild(logEntry);
  logContainer.scrollTop = logContainer.scrollHeight;
}

// Generate WebRTC offer and display QR code
async function createOffer() {
  try {
    peerConnection = new RTCPeerConnection(config);

    // Attach ICE connection state listener
    peerConnection.oniceconnectionstatechange = () => {
      const state = peerConnection.iceConnectionState;
      logMessage(`ICE connection state changed: ${state}`);
      if (state === 'failed') {
        logMessage('ICE connection failed. Please check your network.', 'error');
      }
    };

    dataChannel = peerConnection.createDataChannel('file');
    dataChannel.onopen = () => {
      logMessage('DataChannel is open. Ready to send files!', 'info');
      isDataChannelOpen = true;
    };
    dataChannel.onclose = () => {
      logMessage('DataChannel is closed.', 'warning');
      isDataChannelOpen = false;
    };
    dataChannel.onerror = (error) => {
      logMessage(`DataChannel error: ${error.message}`, 'error');
    };
    dataChannel.onmessage = handleIncomingFileChunk;

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    const offerSDP = JSON.stringify(peerConnection.localDescription);

    QRCode.toCanvas(qrCodeCanvas, offerSDP, (err) => {
      if (err) {
        logMessage('Failed to generate QR Code: ' + err.message, 'error');
      } else {
        logMessage('QR Code generated successfully.', 'info');
        qrCodeContent.textContent = offerSDP;
      }
    });
  } catch (error) {
    logMessage('Error creating WebRTC offer: ' + error.message, 'error');
  }
}

// Handle incoming SDP from QR code or input
async function handleRemoteSDP(remoteSDP) {
  try {
    peerConnection = new RTCPeerConnection(config);

    // Attach ICE connection state listener
    peerConnection.oniceconnectionstatechange = () => {
      const state = peerConnection.iceConnectionState;
      logMessage(`ICE connection state changed: ${state}`);
      if (state === 'failed') {
        logMessage('ICE connection failed. Please check your network.', 'error');
      }
    };

    peerConnection.ondatachannel = (event) => {
      dataChannel = event.channel;
      dataChannel.onopen = () => {
        logMessage('DataChannel is open. Ready to send files!', 'info');
        isDataChannelOpen = true;
      };
      dataChannel.onclose = () => {
        logMessage('DataChannel is closed.', 'warning');
        isDataChannelOpen = false;
      };
      dataChannel.onerror = (error) => {
        logMessage(`DataChannel error: ${error.message}`, 'error');
      };
      dataChannel.onmessage = handleIncomingFileChunk;
    };

    const remoteDescription = new RTCSessionDescription(JSON.parse(remoteSDP));
    await peerConnection.setRemoteDescription(remoteDescription);

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    logMessage('WebRTC connection established successfully.', 'info');
  } catch (error) {
    logMessage('Error handling remote SDP: ' + error.message, 'error');
  }
}

// Send file in chunks
function sendFile() {
  if (!isDataChannelOpen) {
    logMessage('Cannot send file: DataChannel is not open.', 'error');
    return;
  }

  const file = fileInput.files[0];
  if (!file) {
    logMessage('No file selected.', 'error');
    return;
  }

  const fileReader = new FileReader();
  let offset = 0;

  fileReader.onload = (event) => {
    const chunk = event.target.result;

    try {
      dataChannel.send(chunk);
      logMessage(`Sent chunk: ${offset + chunk.byteLength}/${file.size} bytes`);
    } catch (error) {
      logMessage(`Error sending chunk: ${error.message}`, 'error');
      return;
    }

    offset += chunk.byteLength;
    if (offset < file.size) {
      readSlice(offset);
    } else {
      logMessage('File sent successfully!', 'info');
    }
  };

  const readSlice = (o) => {
    const slice = file.slice(o, o + CHUNK_SIZE);
    fileReader.readAsArrayBuffer(slice);
  };

  readSlice(0);
}

// Handle incoming file chunks
function handleIncomingFileChunk(event) {
  receiveBuffer.push(event.data);
  receivedSize += event.data.byteLength;

  logMessage(`Received chunk: ${receivedSize} bytes.`);

  if (receivedSize === parseInt(event.data.size, 10)) {
    const receivedFile = new Blob(receiveBuffer);
    receiveBuffer = [];

    const url = URL.createObjectURL(receivedFile);
    downloadLink.href = url;
    downloadLink.download = 'received_file';
    downloadLink.style.display = 'block';
    downloadLink.textContent = 'Download Received File';

    logMessage('File received successfully.', 'info');
  }
}

// Initialize QR Code scanner
function initializeScanner() {
  const html5QrCode = new Html5Qrcode('videoScan');
  html5QrCode.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 250, height: 250 } },
    (decodedText) => {
      remoteSDPInput.value = decodedText;
      html5QrCode.stop();
      logMessage('QR Code scanned successfully.', 'info');
    },
    (errorMessage) => {
      logMessage(`QR Code scanning error: ${errorMessage}`, 'warning');
    }
  ).catch((error) => logMessage(`Error initializing scanner: ${error.message}`, 'error'));
}

// Event Listeners
createOfferBtn.addEventListener('click', createOffer);
connectBtn.addEventListener('click', () => handleRemoteSDP(remoteSDPInput.value));
sendFileBtn.addEventListener('click', sendFile);
initializeScanner();
