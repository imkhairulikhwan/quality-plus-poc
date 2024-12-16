
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
  peerConnection = new RTCPeerConnection(config);
  dataChannel = peerConnection.createDataChannel('file');
  dataChannel.onmessage = handleIncomingFileChunk;

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  const offerSDP = JSON.stringify(peerConnection.localDescription);

  // Generate the QR Code
  QRCode.toCanvas(qrCodeCanvas, offerSDP, (err) => {
    if (err) console.error(err);
    console.log('QR Code generated');
  });

  // Display the QR code content
  qrCodeContent.textContent = offerSDP;
}


// Handle incoming SDP from QR code or input
async function handleRemoteSDP(remoteSDP) {
  peerConnection = new RTCPeerConnection(config);
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
    console.error('No file selected');
    return;
  }

  const fileReader = new FileReader();
  let offset = 0;

  fileReader.onload = (event) => {
    const chunk = event.target.result;
    dataChannel.send(chunk);

    offset += chunk.byteLength;
    if (offset < file.size) {
      readSlice(offset);
    } else {
      console.log('File sent successfully');
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
