// 1. LOGIK PEMETAAN ANGKA & PERKATAAN (BIM) - BERASASKAN ZON RUANG
function tekaAngkaBIM(leftHandLandmarks, rightHandLandmarks, poseLandmarks) {
    // Pilih tangan yang aktif (Utamakan tangan kanan)
    let landmarks = rightHandLandmarks || leftHandLandmarks;
    
    if (!landmarks) return "...";

    // Ambil titik rujukan penting untuk tangan
    let hujungTelunjuk = landmarks[8];
    // Saiz tangan diguna untuk menormalkan jarak (bebas daripada skala kamera dekat/jauh)
    let saizTangan = Math.sqrt(Math.pow(landmarks[5].x - landmarks[17].x, 2) + Math.pow(landmarks[5].y - landmarks[17].y, 2));
    if (saizTangan === 0) saizTangan = 0.1; // Elak pembahagian dengan kosong

    // =================================================================
    // ZON 1: ZON BADAN & DADA (Isyarat: SAYA)
    // =================================================================
    if (poseLandmarks && poseLandmarks.length > 12) {
        let bahuKanan = poseLandmarks[11];
        let bahuKiri = poseLandmarks[12];

        // Tentukan sempadan kotak dada
        let sempadanKiri = Math.min(bahuKanan.x, bahuKiri.x) - 0.05;
        let sempadanKanan = Math.max(bahuKanan.x, bahuKiri.x) + 0.05;
        let sempadanAtas = Math.min(bahuKanan.y, bahuKiri.y) - 0.02;
        let sempadanBawah = Math.max(bahuKanan.y, bahuKiri.y) + 0.30; 

        let diKawasanDada = (hujungTelunjuk.x >= sempadanKiri && hujungTelunjuk.x <= sempadanKanan) &&
                            (hujungTelunjuk.y >= sempadanAtas && hujungTelunjuk.y <= sempadanBawah);

        if (diKawasanDada) {
            let telunjukTerbuka = landmarks[8].y < landmarks[6].y;
            let tengahTerbuka = landmarks[12].y < landmarks[10].y;
            
            if (telunjukTerbuka && !tengahTerbuka) {
                return "SAYA";
            }
            return "..."; // Sekat gabungan angka lain di kawasan dada
        }
    }

    // =================================================================
    // ZON 2: ZON BEBAS / NEUTRAL (Angka 1-10 & Huruf A-E)
    // =================================================================
    
    // Status bukaan 4 jari utama
    let telunjukTerbuka = landmarks[8].y < landmarks[6].y;
    let tengahTerbuka = landmarks[12].y < landmarks[10].y;
    let manisTerbuka = landmarks[16].y < landmarks[14].y;
    let kelingkingTerbuka = landmarks[20].y < landmarks[18].y;

    // Jarak ibu jari ke pangkal telunjuk (dinormalkan dengan saiz tangan)
    let jarakIbuJariKeTelunjuk = Math.abs(landmarks[4].x - landmarks[5].x) / saizTangan;
    
    // Status Ibu Jari
    let ibuJariTerbuka = landmarks[4].y < landmarks[5].y || jarakIbuJariKeTelunjuk > 0.45; 
    
    // Ibu jari melipat di hadapan tapak tangan
    let minX = Math.min(landmarks[5].x, landmarks[17].x);
    let maxX = Math.max(landmarks[5].x, landmarks[17].x);
    let ibuJariMelipatDiDepan = landmarks[4].x > minX && landmarks[4].x < maxX;

    // -----------------------------------------------------------------
    // LOGIK HURUF (A, B, C, D, E)
    // -----------------------------------------------------------------
    
    // HURUF A: Semua 4 jari genggam rapat, ibu jari tegak di SISI tapak tangan/telunjuk
    if (!telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka && ibuJariTerbuka && !ibuJariMelipatDiDepan) {
        return "A";
    }

    // HURUF B: 4 jari lurus tegak, ibu jari melipat melintasi tapak tangan
    if (telunjukTerbuka && tengahTerbuka && manisTerbuka && kelingkingTerbuka && ibuJariMelipatDiDepan) {
        return "B";
    }

    // HURUF C: Jari-jari melengkung membentuk lengkungan C
    let jarakHujungKeIbuJari = Math.sqrt(Math.pow(landmarks[8].x - landmarks[4].x, 2) + Math.pow(landmarks[8].y - landmarks[4].y, 2)) / saizTangan;
    if (telunjukTerbuka && !manisTerbuka && !kelingkingTerbuka && jarakHujungKeIbuJari > 0.3 && jarakHujungKeIbuJari < 0.8) {
        // Menyemak lengkungan separuh bulatan
        if (landmarks[8].y > landmarks[7].y && landmarks[4].y > landmarks[3].y) {
            return "C";
        }
    }

    // HURUF D: Telunjuk tegak, jari lain melengkung menyentuh ibu jari (ibu jari melipat di depan)
    if (telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka && ibuJariMelipatDiDepan) {
        return "D";
    }

    // HURUF E: Semua jari dibengkokkan rapat ke tapak tangan (cakar rapat)
    let kukuDiBawahKnuckle = landmarks[8].y > landmarks[6].y && landmarks[12].y > landmarks[10].y;
    if (kukuDiBawahKnuckle && !telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka && ibuJariMelipatDiDepan) {
        return "E";
    }

    // -----------------------------------------------------------------
    // LOGIK ANGKA (1 - 10)
    // -----------------------------------------------------------------
    
    // Angka 1: Hanya telunjuk tegak, ibu jari tidak melipat rapat menyentuh jari lain
    if (telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka && !ibuJariMelipatDiDepan) {
        return "1";
    }
    
    // Angka 2
    if (telunjukTerbuka && tengahTerbuka && !manisTerbuka && !kelingkingTerbuka && !ibuJariTerbuka) {
        return "2";
    }
    
    // Angka 3 & 8 (Ibu jari + Telunjuk + Tengah)
    if (ibuJariTerbuka && telunjukTerbuka && tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) {
        if (jarakIbuJariKeTelunjuk > 0.8) return "8"; // Bukaan ibu jari sangat lebar
        return "3"; 
    }
    
    // Angka 4 (4 jari terbuka, ibu jari melipat)
    if (telunjukTerbuka && tengahTerbuka && manisTerbuka && kelingkingTerbuka && !ibuJariTerbuka) {
        return "4";
    }

    // Angka 5 (Semua jari terbuka lebar)
    if (ibuJariTerbuka && telunjukTerbuka && tengahTerbuka && manisTerbuka && kelingkingTerbuka) {
        return "5";
    }

    // Angka 6 (Genggaman penuh + Ibu jari terbuka)
    if (ibuJariTerbuka && !telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) {
        return "6";
    }

    // Angka 7 (Ibu jari + Telunjuk)
    if (ibuJariTerbuka && telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) {
        return "7";
    }

    // Angka 9 (Ibu jari + Telunjuk + Tengah + Manis)
    if (ibuJariTerbuka && telunjukTerbuka && tengahTerbuka && manisTerbuka && !kelingkingTerbuka) {
        return "9";
    }
    
    // Angka 10 (Genggam penuh)
    if (!ibuJariTerbuka && !telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) {
        return "10 (Genggam & Goyang)";
    }

    return "...";
}
