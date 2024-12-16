
// WebRTC logic for offer creation and handling SDP
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

async function createOffer() {
  try {
    console.log('Creating WebRTC offer with config:', config); // Debug log
    peerConnection = new RTCPeerConnection(config);

    peerConnection.oniceconnectionstatechange = () => {
      const state = peerConnection.iceConnectionState;
      logMessage(`ICE connection state changed: ${state}`);
      if (state === 'failed') {
        logMessage('ICE connection failed. Please check your network.', 'error');
      }
    };

    dataChannel = peerConnection.createDataChannel('file');
    dataChannel.onopen = () => logMessage('DataChannel is open. Ready to send files!', 'info');
    dataChannel.onclose = () => logMessage('DataChannel is closed.', 'warning');
    dataChannel.onerror = (error) => logMessage(`DataChannel error: ${error.message}`, 'error');
    dataChannel.onmessage = handleIncomingFileChunk;

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    const offerSDP = JSON.stringify(peerConnection.localDescription);

    QRCode.toCanvas(qrCodeCanvas, offerSDP, { width: 300, errorCorrectionLevel: 'H' }, (err) => {
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
