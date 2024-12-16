
const qrCodeCanvas = document.getElementById('qrCode');
const createOfferBtn = document.getElementById('createOffer');
const remoteSDPInput = document.getElementById('remoteSDP');
const connectBtn = document.getElementById('connect');
const sendFileBtn = document.getElementById('sendFile');
const fileInput = document.getElementById('fileInput');
const downloadLink = document.getElementById('downloadLink');
const videoScan = document.getElementById('videoScan');

let peerConnection;
let dataChannel;
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

const CHUNK_SIZE = 16 * 1024;
let receiveBuffer = [];
let receivedSize = 0;

// Generate WebRTC offer and display QR code
const qrCodeContent = document.getElementById('qrCodeContent'); // Add this element in your HTML

async function createOffer() {
  try {
    peerConnection = new RTCPeerConnection(config);
    // Attach the ICE connection state change listener
    peerConnection.oniceconnectionstatechange = () => {
      const state = peerConnection.iceConnectionState;
      logMessage(`ICE connection state changed: ${state}`);

      if (state === 'failed') {
        logMessage('ICE connection failed. Please check your network.', 'error');
      }
    };

    dataChannel = peerConnection.createDataChannel('file');
    dataChannel.onmessage = handleIncomingFileChunk;

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    const offerSDP = JSON.stringify(peerConnection.localDescription);

    // Generate the QR Code
    QRCode.toCanvas(qrCodeCanvas, offerSDP, (err) => {
      if (err) {
        logMessage('Failed to generate QR Code: ' + err.message, 'error');
        console.error(err);
      } else {
        logMessage('QR Code generated successfully', 'info');
        qrCodeContent.textContent = offerSDP;
      }
    });
  } catch (error) {
    logMessage('Error creating WebRTC offer: ' + error.message, 'error');
    console.error(error);
  }
}

const logContainer = document.getElementById('logContainer');
const logContent = document.getElementById('logContent');

function logMessage(message, type = 'info') {
  const logEntry = document.createElement('p');
  logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  
  // Style logs based on type (info, error, warning)
  if (type === 'error') {
    logEntry.style.color = 'red';
  } else if (type === 'warning') {
    logEntry.style.color = 'orange';
  }

  logContent.appendChild(logEntry);
  logContainer.scrollTop = logContainer.scrollHeight; // Auto-scroll to the bottom
}


// Handle incoming SDP from QR code or input
async function handleRemoteSDP(remoteSDP) {
  peerConnection = new RTCPeerConnection(config);
  // Attach the ICE connection state change listener
  peerConnection.oniceconnectionstatechange = () => {
    const state = peerConnection.iceConnectionState;
    logMessage(`ICE connection state changed: ${state}`);

    if (state === 'failed') {
      logMessage('ICE connection failed. Please check your network.', 'error');
    }
  };
  
  peerConnection.ondatachannel = (event) => {
    dataChannel = event.channel;
    dataChannel.onmessage = handleIncomingFileChunk;
  };

  const remoteDescription = new RTCSessionDescription(JSON.parse(remoteSDP));
  await peerConnection.setRemoteDescription(remoteDescription);

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  console.log('Send this back:', JSON.stringify(peerConnection.localDescription));
}

// Send file in chunks
function sendFile() {
  const file = fileInput.files[0];
  if (!file) {
    logMessage('No file selected', 'error');
    return;
  }

  const fileReader = new FileReader();
  let offset = 0;

  fileReader.onload = (event) => {
    const chunk = event.target.result;
    dataChannel.send(chunk);

    offset += chunk.byteLength;
    logMessage(`Sent chunk: ${offset}/${file.size} bytes`);

    if (offset < file.size) {
      readSlice(offset);
    } else {
      logMessage('File sent successfully', 'info');
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

  if (receivedSize === parseInt(event.data.size, 10)) {
    const receivedFile = new Blob(receiveBuffer);
    receiveBuffer = [];

    const url = URL.createObjectURL(receivedFile);
    downloadLink.href = url;
    downloadLink.download = 'received_file';
    downloadLink.style.display = 'block';
    downloadLink.textContent = 'Download Received File';
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
    },
    (errorMessage) => {
      console.warn(errorMessage);
    }
  ).catch(console.error);
}

// Event Listeners
createOfferBtn.addEventListener('click', createOffer);
connectBtn.addEventListener('click', () => handleRemoteSDP(remoteSDPInput.value));
sendFileBtn.addEventListener('click', sendFile);
initializeScanner();
