
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
