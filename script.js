// 1. LOGIK PEMETAAN ANGKA & PERKATAAN (BIM) - BERASASKAN ZON RUANG
function tekaAngkaBIM(leftHandLandmarks, rightHandLandmarks, poseLandmarks, faceLandmarks) {
    // Pilih tangan yang aktif (Utamakan tangan kanan)
    let landmarks = rightHandLandmarks || leftHandLandmarks;
    
    if (!landmarks) return "...";

    // Ambil titik rujukan penting untuk tangan
    let hujungTelunjuk = landmarks[8];
    let saizTangan = Math.sqrt(Math.pow(landmarks[5].x - landmarks[17].x, 2) + Math.pow(landmarks[5].y - landmarks[17].y, 2));

    // =================================================================
    // ZON 1: ZON MUKA & KEPALA (Contoh: MAKAN)
    // =================================================================
    if (faceLandmarks && faceLandmarks.length > 13) {
        let mulut = faceLandmarks[13]; 
        let jarakKeMulut = Math.sqrt(Math.pow(hujungTelunjuk.x - mulut.x, 2) + Math.pow(hujungTelunjuk.y - mulut.y, 2));

        // Jika tangan berada dalam lingkungan zon muka/mulut
        if (jarakKeMulut < (saizTangan * 1.4)) {
            // Letakkan semua isyarat berkaitan muka di sini
