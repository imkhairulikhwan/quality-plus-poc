WebRTC File Transfer with QR Code
This application allows peer-to-peer file transfer between two devices using WebRTC. The connection is established using a QR code or an SDP string. Follow the steps below to initialize the connection and send files.

Table of Contents
Overview
Setup
Steps to Use
Generate QR Code (Offer)
Share QR Code or String
Connect to Remote SDP
Send a File
Common Issues and Debugging
Overview
This WebRTC application:

Creates a peer-to-peer connection between two devices.
Establishes the connection using QR code or SDP string exchange.
Allows for file transfer over the data channel once the connection is established.
Setup
Clone or download the repository.
Serve the project using a local server or deploy it to a hosting platform (e.g., GitHub Pages).
Open the application on two devices to start the file transfer process.
Steps to Use
1. Generate QR Code (Offer)
Device A:

Click the "Generate QR Code" button.
A QR code and its corresponding SDP string will be generated.
The QR code will be displayed, and the SDP string will appear in a textarea.
Expected Output:

QR code is shown.
Logs:
css
Copy code
[time] QR Code generated successfully.
2. Share QR Code or String
Device A:

Use the "Copy to Clipboard" button to copy the SDP string.
Share the SDP string with Device B (via messaging app or any method) or let Device B scan the QR code directly.
3. Connect to Remote SDP
Device B:

Paste the copied SDP string into the "Remote SDP" field or scan the QR code using the scanner.
Click the "Connect" button.
Device B will generate an answer SDP and establish the WebRTC connection with Device A.
Expected Output:

Logs on Device B:
csharp
Copy code
[time] WebRTC connection established successfully.
Logs on Device A:
csharp
Copy code
[time] Data channel is open.
4. Send a File
Device A (or B):

Select a file using the "Choose File" button.
Click the "Send" button.
Expected Output:

Logs on sender:
arduino
Copy code
[time] File transfer started: <filename>
[time] File transfer completed.
Logs on receiver:
csharp
Copy code
[time] Received file: <filename>
A download link will appear for the received file.
Common Issues and Debugging
1. Data Channel Not Opening
Ensure the WebRTC connection is established first.
Logs should display:
csharp
Copy code
[time] Data channel is open.
2. File Transfer Fails
Verify that the selected file is not too large for the data channel buffer.
Ensure the Data Channel is in the open state.
3. QR Code Not Scanning
Ensure the QR code is properly aligned within the scanner area.
Check for good lighting conditions and proper camera focus.
Additional Notes:
Make sure both devices are on the same network if you're using STUN/TURN servers for NAT traversal.
The file transfer size is subject to WebRTC data channel limitations.
