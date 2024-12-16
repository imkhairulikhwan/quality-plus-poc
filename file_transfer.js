
// File transfer logic
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
