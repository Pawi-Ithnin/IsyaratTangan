const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const outputLabel = document.getElementById('output-box');

// =================================================================
// 1. LOGIK PEMETAAN & PENGECAMAN BIM
// =================================================================
function kenalPastiBIM(leftHandLandmarks, rightHandLandmarks, poseLandmarks) {
    let landmarks = rightHandLandmarks || leftHandLandmarks;
    
    // -------------------------------------------------------------
    // A. LOGIK KOSA KATA KHAS ("SAYA" & "KITA") - Memerlukan Pose
    // -------------------------------------------------------------
    if (poseLandmarks && landmarks) {
        let bahuKiri = poseLandmarks[11];
        let bahuKanan = poseLandmarks[12];
        let dadaX = (bahuKiri.x + bahuKanan.x) / 2;
        let dadaY = (bahuKiri.y + bahuKanan.y) / 2;

        let telunjukTerbuka = landmarks[8].y < landmarks[6].y;
        let tengahTerbuka = landmarks[12].y < landmarks[10].y;
        let manisTerbuka = landmarks[16].y < landmarks[14].y;
        let kelingkingTerbuka = landmarks[20].y < landmarks[18].y;

        let tengahTertutup = !tengahTerbuka;
        let manisTertutup = !manisTerbuka;
        let kelingkingTertutup = !kelingkingTerbuka;
        
        let jarakKeDada = Math.sqrt(
            Math.pow(landmarks[8].x - dadaX, 2) + 
            Math.pow(landmarks[8].y - dadaY, 2)
        );

        // Isyarat "SAYA"
        if (telunjukTerbuka && tengahTertutup && manisTertutup && kelingkingTertutup && jarakKeDada < 0.25) {
            return "Isyarat: Saya";
        }

        // Isyarat "KITA"
        let tanganDiDadaX = Math.abs(landmarks[0].x - dadaX) < 0.2;
        if (tanganDiDadaX && telunjukTerbuka && tengahTerbuka) {
            return "Isyarat: Kita";
        }
    }

    if (!landmarks) return "...";

    // -------------------------------------------------------------
    // B. NORMALISASI & STATUS JARI
    // -------------------------------------------------------------
    let saizTangan = Math.sqrt(Math.pow(landmarks[5].x - landmarks[17].x, 2) + Math.pow(landmarks[5].y - landmarks[17].y, 2));
    if (saizTangan === 0) saizTangan = 0.1;

    let telunjukTerbuka = landmarks[8].y < landmarks[6].y;
    let tengahTerbuka = landmarks[12].y < landmarks[10].y;
    let manisTerbuka = landmarks[16].y < landmarks[14].y;
    let kelingkingTerbuka = landmarks[20].y < landmarks[18].y;

    let jarakIbuJariKeTelunjuk = Math.abs(landmarks[4].x - landmarks[5].x) / saizTangan;
    let jarakIbuJariKeTengah = Math.sqrt(Math.pow(landmarks[4].x - landmarks[12].x, 2) + Math.pow(landmarks[4].y - landmarks[12].y, 2)) / saizTangan;
    let jarakIbuJariKeTelunjukHujung = Math.sqrt(Math.pow(landmarks[4].x - landmarks[8].x, 2) + Math.pow(landmarks[4].y - landmarks[8].y, 2)) / saizTangan;

    let ibuJariTerbuka = landmarks[4].y < landmarks[5].y || jarakIbuJariKeTelunjuk > 0.45;  

    let minX = Math.min(landmarks[5].x, landmarks[17].x);
    let maxX = Math.max(landmarks[5].x, landmarks[17].x);
    let ibuJariMelipatDiDepan = landmarks[4].x > minX && landmarks[4].x < maxX;

    // -------------------------------------------------------------
    // C. LOGIK ABJAD (A, B, C, D, E)
    // -------------------------------------------------------------
    if (!telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka && ibuJariTerbuka && !ibuJariMelipatDiDepan) {
        return "Huruf A";
    }
    if (telunjukTerbuka && tengahTerbuka && manisTerbuka && kelingkingTerbuka && (ibuJariMelipatDiDepan || !ibuJariTerbuka)) {
        return "Huruf B";
    }
    let jariMelengkung = landmarks[8].y > landmarks[7].y && landmarks[12].y > landmarks[11].y;
    if (jariMelengkung && jarakIbuJariKeTelunjukHujung > 0.4 && jarakIbuJariKeTelunjukHujung < 0.95) {
        return "Huruf C";
    }
    if (telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka && jarakIbuJariKeTengah < 0.35) {
        return "Huruf D";
    }
    let semuaJariMengkuku = landmarks[8].y > landmarks[6].y && landmarks[12].y > landmarks[10].y && landmarks[16].y > landmarks[14].y && landmarks[20].y > landmarks[18].y;
    if (semuaJariMengkuku && (ibuJariMelipatDiDepan || jarakIbuJariKeTelunjuk < 0.3)) {
        return "Huruf E";
    }

    // -------------------------------------------------------------
    // D. LOGIK ANGKA (1 - 10)
    // -------------------------------------------------------------
    if (telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka && !ibuJariMelipatDiDepan && jarakIbuJariKeTengah > 0.4) {
        return "Angka 1";
    }
    if (telunjukTerbuka && tengahTerbuka && !manisTerbuka && !kelingkingTerbuka && !ibuJariTerbuka) {
        return "Angka 2";
    }
    if (ibuJariTerbuka && telunjukTerbuka && tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) {
        if (jarakIbuJariKeTelunjuk > 0.8) return "Angka 8"; 
        return "Angka 3"; 
    }
    if (telunjukTerbuka && tengahTerbuka && manisTerbuka && kelingkingTerbuka && !ibuJariTerbuka) {
        return "Angka 4";
    }
    if (ibuJariTerbuka && telunjukTerbuka && tengahTerbuka && manisTerbuka && kelingkingTerbuka) {
        return "Angka 5";
    }
    if (ibuJariTerbuka && !telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) {
        return "Angka 6";
    }
    if (ibuJariTerbuka && telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) {
        return "Angka 7";
    }
    if (ibuJariTerbuka && telunjukTerbuka && tengahTerbuka && manisTerbuka && !kelingkingTerbuka) {
        return "Angka 9";
    }
    if (!ibuJariTerbuka && !telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) {
        return "Angka 10 (Genggam & Goyang)";
    }

    return "...";
}

// =================================================================
// 2. INTEGRASI MEDIAPIPE (HANDS & POSE)
// =================================================================
let letupanHasilKiri = null;
let letupanHasilKanan = null;
let letupanPose = null;

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
hands.onResults((results) => {
    letupanHasilKiri = null;
    letupanHasilKanan = null;

    if (results.multiHandLandmarks && results.multiHandedness) {
        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const landmarks = results.multiHandLandmarks[i];
            const label = results.multiHandedness[i].label; // 'Left' atau 'Right'
            
            if (label === 'Left') letupanHasilKiri = landmarks;
            if (label === 'Right') letupanHasilKanan = landmarks;
        }
    }
});

const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});
pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
pose.onResults((results) => {
    letupanPose = results.poseLandmarks || null;
});

// Gelung utama pemprosesan bingkai video (Camera Loop)
async function onFrame() {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

    // Hantar imej ke model Hands & Pose
    await hands.send({ image: videoElement });
    await pose.send({ image: videoElement });

    // Lukis kerangka tangan pada skrin
    if (letupanHasilKiri) drawConnectors(canvasCtx, letupanHasilKiri, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 2});
    if (letupanHasilKanan) drawConnectors(canvasCtx, letupanHasilKanan, HAND_CONNECTIONS, {color: '#FF0000', lineWidth: 2});

    // Jalankan fungsi pengecaman BIM
    let keputusan = kenalPastiBIM(letupanHasilKiri, letupanHasilKanan, letupanPose);
    outputLabel.innerText = keputusan;

    canvasCtx.restore();
    requestAnimationFrame(onFrame);
}

// Mulakan Kamera menggunakan MediaPipe Camera Utils
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await onFrame();
    },
    width: 640,
    height: 480
});

camera.start().then(() => {
    outputLabel.innerText = "Kamera Aktif. Sila mula membuat isyarat!";
});}
