const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const textOutput = document.getElementById('text-output');
const statusMessage = document.getElementById('status-message');

function tekaAngkaBIM(landmarks) {
    let telunjukTerbuka = landmarks[8].y < landmarks[6].y;
    let tengahTerbuka = landmarks[12].y < landmarks[10].y;
    let manisTerbuka = landmarks[16].y < landmarks[14].y;
    let kelingkingTerbuka = landmarks[20].y < landmarks[18].y;
    let ibuJariTerbuka = landmarks[4].y < landmarks[5].y || Math.abs(landmarks[4].x - landmarks[5].x) > 0.1;

    if (telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka && !ibuJariTerbuka) return "1";
    if (telunjukTerbuka && tengahTerbuka && !manisTerbuka && !kelingkingTerbuka && !ibuJariTerbuka) return "2";
    if (ibuJariTerbuka && telunjukTerbuka && tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) return "3 / 8 (BIM)"; 
    if (telunjukTerbuka && tengahTerbuka && manisTerbuka && kelingkingTerbuka && !ibuJariTerbuka) return "4";
    if (ibuJariTerbuka && telunjukTerbuka && tengahTerbuka && manisTerbuka && kelingkingTerbuka) return "5";
    if (ibuJariTerbuka && !telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) return "6";
    if (ibuJariTerbuka && telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) return "7";
    if (ibuJariTerbuka && telunjukTerbuka && tengahTerbuka && manisTerbuka && !kelingkingTerbuka) return "9";
    if (!ibuJariTerbuka && !telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) return "10";

    return "...";
}

function lukisTangan(landmarks) {
    canvasCtx.fillStyle = '#007bff';
    canvasCtx.strokeStyle = '#ffffff';
    canvasCtx.lineWidth = 2;
    const sambungan = [
        [0,1], [1,2], [2,3], [3,4], [0,5], [5,6], [6,7], [7,8],
        [5,9], [9,10], [10,11], [11,12], [9,13], [13,14], [14,15], [15,16],
        [13,17], [17,18], [18,19], [19,20], [0,17]
    ];
    sambungan.forEach(([a, b]) => {
        canvasCtx.beginPath();
        canvasCtx.moveTo(landmarks[a].x * canvasElement.width, landmarks[a].y * canvasElement.height);
        canvasCtx.lineTo(landmarks[b].x * canvasElement.width, landmarks[b].y * canvasElement.height);
        canvasCtx.stroke();
    });
    for (let i = 0; i < landmarks.length; i++) {
        const x = landmarks[i].x * canvasElement.width;
        const y = landmarks[i].y * canvasElement.height;
        canvasCtx.beginPath();
        canvasCtx.arc(x, y, 5, 0, 2 * Math.PI);
        canvasCtx.fill();
    }
}

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        statusMessage.innerText = "Tangan dikesan!";
        statusMessage.style.color = "#28a745";
        const landmarks = results.multiHandLandmarks[0];
        lukisTangan(landmarks);
        textOutput.innerText = tekaAngkaBIM(landmarks);
    } else {
        statusMessage.innerText = "Sila tunjukkan tangan anda pada kamera.";
        statusMessage.style.color = "#dc3545";
        textOutput.innerText = "...";
    }
    canvasCtx.restore();
}

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
hands.onResults(onResults);

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
    .then(function(stream) {
        videoElement.srcObject = stream;
        videoElement.onloadedmetadata = function() {
            videoElement.play();
            statusMessage.innerText = "Kamera sedia. Sila buat isyarat angka 1-10.";
            async function hantarFrame() {
                if (!videoElement.paused && !videoElement.ended) {
                    await hands.send({ image: videoElement });
                }
                requestAnimationFrame(hantarFrame);
            }
            hantarFrame();
        };
    })
    .catch(function(err) {
        statusMessage.innerText = "Gagal mengakses kamera: " + err.message;
        statusMessage.style.color = "#dc3545";
    });
} else {
    statusMessage.innerText = "Browser anda tidak menyokong akses kamera.";
    statusMessage.style.color = "#dc3545";
}
