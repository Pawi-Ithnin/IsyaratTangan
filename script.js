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
            return "MAKAN"; 
        }
    }

    // =================================================================
    // ZON 2: ZON BADAN & DADA (Contoh: SAYA)
    // =================================================================
    // =================================================================
    // ZON 2: ZON BADAN & DADA (Isyarat: SAYA) - DIBAIKI
    // =================================================================
    if (poseLandmarks && poseLandmarks.length > 12) {
        let bahuKanan = poseLandmarks[11];
        let bahuKiri = poseLandmarks[12];

        // Tentukan sempadan kotak dada (Kiri, Kanan, Atas, Bawah)
        let sempadanKiri = Math.min(bahuKanan.x, bahuKiri.x) - 0.05;
        let sempadanKanan = Math.max(bahuKanan.x, bahuKiri.x) + 0.05;
        let sempadanAtas = Math.min(bahuKanan.y, bahuKiri.y) - 0.02;
        let sempadanBawah = Math.max(bahuKanan.y, bahuKiri.y) + 0.25; // Anggaran jarak ke bawah dada

        // Semak adakah hujung telunjuk (landmarks[8]) berada DI DALAM kotak dada ini
        let diKawasanDada = (hujungTelunjuk.x >= sempadanKiri && hujungTelunjuk.x <= sempadanKanan) &&
                            (hujungTelunjuk.y >= sempadanAtas && hujungTelunjuk.y <= sempadanBawah);

        if (diKawasanDada) {
            let telunjukTerbuka = landmarks[8].y < landmarks[6].y;
            let tengahTerbuka = landmarks[12].y < landmarks[10].y;
            
            // Dalam BIM, isyarat "SAYA" boleh menggunakan telunjuk lurus menunjuk ke dada
            if (telunjukTerbuka && !tengahTerbuka) {
                return "SAYA";
            }
            return "..."; // Sekat angka lain di kawasan dada
        }
    }
    

    // =================================================================
    // ZON 3: ZON BEBAS / NEUTRAL (Hanya Baca Angka 1 - 10 Di Sini)
    // =================================================================
    
    // Status bukaan jari
    let telunjukTerbuka = landmarks[8].y < landmarks[6].y;
    let tengahTerbuka = landmarks[12].y < landmarks[10].y;
    let manisTerbuka = landmarks[16].y < landmarks[14].y;
    let kelingkingTerbuka = landmarks[20].y < landmarks[18].y;

    let jarakIbuJariKeTelunjuk = Math.abs(landmarks[4].x - landmarks[5].x);
    let ibuJariTerbuka = landmarks[4].y < landmarks[5].y || jarakIbuJariKeTelunjuk > 0.1;

    // Logik Angka 1
    if (telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka && !ibuJariTerbuka) return "1";
    
    // Logik Angka 2
    if (telunjukTerbuka && tengahTerbuka && !manisTerbuka && !kelingkingTerbuka && !ibuJariTerbuka) return "2";
    
    // Logik Angka 3 & 8
    if (ibuJariTerbuka && telunjukTerbuka && tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) {
        if (jarakIbuJariKeTelunjuk > 0.16) return "8";
        return "3"; 
    }
    
    // Logik Angka 4-10
    if (telunjukTerbuka && tengahTerbuka && manisTerbuka && kelingkingTerbuka && !ibuJariTerbuka) return "4";
    if (ibuJariTerbuka && telunjukTerbuka && tengahTerbuka && manisTerbuka && kelingkingTerbuka) return "5";
    if (ibuJariTerbuka && !telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) return "6";
    if (ibuJariTerbuka && telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) return "7";
    if (ibuJariTerbuka && telunjukTerbuka && tengahTerbuka && manisTerbuka && !kelingkingTerbuka) return "9";
    if (!ibuJariTerbuka && !telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) return "10 (Genggam & Goyang)";

    return "...";
}
