const qrCodeCanvas = document.getElementById('qrCode');
const createOfferBtn = document.getElementById('createOffer');
const remoteSDPInput = document.getElementById('remoteSDP');
const connectBtn = document.getElementById('connect');
const sendMessageBtn = document.getElementById('sendMessage');
const messageInput = document.getElementById('messageInput');
const receivedMessage = document.getElementById('receivedMessage');
const videoScan = document.getElementById('videoScan');

let peerConnection;
let dataChannel;
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// Generate WebRTC offer and display it as a QR code
async function createOffer() {
  peerConnection = new RTCPeerConnection(config);
  dataChannel = peerConnection.createDataChannel('chat');
  dataChannel.onmessage = (event) => {
    receivedMessage.textContent = event.data;
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  QRCode.toCanvas(qrCodeCanvas, JSON.stringify(peerConnection.localDescription), (err) => {
    if (err) console.error(err);
    console.log('QR Code generated');
  });
}

// Handle remote SDP (from scanned QR code or input)
async function handleRemoteSDP(remoteSDP) {
  peerConnection = new RTCPeerConnection(config);
  peerConnection.ondatachannel = (event) => {
    dataChannel = event.channel;
    dataChannel.onmessage = (event) => {
      receivedMessage.textContent = event.data;
    };
  };

  const remoteDescription = new RTCSessionDescription(JSON.parse(remoteSDP));
  await peerConnection.setRemoteDescription(remoteDescription);

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  console.log('Send this back:', JSON.stringify(peerConnection.localDescription));
}

// Send a message via the data channel
function sendMessage() {
  if (dataChannel && dataChannel.readyState === 'open') {
    dataChannel.send(messageInput.value);
  } else {
    console.error('Data channel is not open');
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
sendMessageBtn.addEventListener('click', sendMessage);
initializeScanner();
