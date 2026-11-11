// 1. LOGIK PEMETAAN ANGKA & ABJAD (BIM) - BERASASKAN ZON RUANG
function tekaAngkaDanHurufBIM(leftHandLandmarks, rightHandLandmarks, poseLandmarks) {
    // Pilih tangan yang aktif (Utamakan tangan kanan)
    let landmarks = rightHandLandmarks || leftHandLandmarks;
    
    if (!landmarks) return "...";

    // Saiz tangan diguna untuk menormalkan jarak (bebas daripada skala kamera dekat/jauh)
    let saizTangan = Math.sqrt(Math.pow(landmarks[5].x - landmarks[17].x, 2) + Math.pow(landmarks[5].y - landmarks[17].y, 2));
    if (saizTangan === 0) saizTangan = 0.1; // Elak pembahagian dengan kosong

    // Status bukaan 4 jari utama (Hujung jari < Sendi tengah)
    let telunjukTerbuka = landmarks[8].y < landmarks[6].y;
    let tengahTerbuka = landmarks[12].y < landmarks[10].y;
    let manisTerbuka = landmarks[16].y < landmarks[14].y;
    let kelingkingTerbuka = landmarks[20].y < landmarks[18].y;

    // Jarak ibu jari ke pangkal telunjuk & hujung jari tengah (dinormalkan)
    let jarakIbuJariKeTelunjuk = Math.abs(landmarks[4].x - landmarks[5].x) / saizTangan;
    let jarakIbuJariKeTengah = Math.sqrt(Math.pow(landmarks[4].x - landmarks[12].x, 2) + Math.pow(landmarks[4].y - landmarks[12].y, 2)) / saizTangan;
    let jarakIbuJariKeTelunjukHujung = Math.sqrt(Math.pow(landmarks[4].x - landmarks[8].x, 2) + Math.pow(landmarks[4].y - landmarks[8].y, 2)) / saizTangan;

    // Status Ibu Jari
    let ibuJariTerbuka = landmarks[4].y < landmarks[5].y || jarakIbuJariKeTelunjuk > 0.45;  

    // Kedudukan relatif melintang ibu jari
    let minX = Math.min(landmarks[5].x, landmarks[17].x);
    let maxX = Math.max(landmarks[5].x, landmarks[17].x);
    let ibuJariMelipatDiDepan = landmarks[4].x > minX && landmarks[4].x < maxX;

    // -----------------------------------------------------------------
    // LOGIK ABJAD (A, B, C, D, E)
    // -----------------------------------------------------------------

    // Huruf A: Genggam (4 jari tutup) & Ibu jari tegak/di tepi telunjuk (ibu jari terbuka ke atas/tepi, tidak melipat di depan)
    if (!telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka && ibuJariTerbuka && !ibuJariMelipatDiDepan) {
        return "Huruf A";
    }

    // Huruf B: 4 jari tegak lurus terbuka, ibu jari melipat di depan tapak tangan
    if (telunjukTerbuka && tengahTerbuka && manisTerbuka && kelingkingTerbuka && (ibuJariMelipatDiDepan || !ibuJariTerbuka)) {
        return "Huruf B";
    }

    // Huruf C: Jari-jari separuh melengkung (ujung jari x/y membentuk julat 'C') dan bukaan ibu jari sederhana
    let jariMelengkung = landmarks[8].y > landmarks[7].y && landmarks[12].y > landmarks[11].y;
    if (jariMelengkung && jarakIbuJariKeTelunjukHujung > 0.4 && jarakIbuJariKeTelunjukHujung < 0.95) {
        return "Huruf C";
    }

    // Huruf D: Telunjuk sahaja tegak lurus, ibu jari menyentuh/berdekatan hujung jari tengah/manis
    if (telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka && jarakIbuJariKeTengah < 0.35) {
        return "Huruf D";
    }

    // Huruf E: Semua 4 jari melipat/mengkuku rapat ke bawah, ibu jari terlipat rapat di bawah jari-jari
    let semuaJariMengkuku = landmarks[8].y > landmarks[6].y && landmarks[12].y > landmarks[10].y && landmarks[16].y > landmarks[14].y && landmarks[20].y > landmarks[18].y;
    if (semuaJariMengkuku && (ibuJariMelipatDiDepan || jarakIbuJariKeTelunjuk < 0.3)) {
        return "Huruf E";
    }

    // -----------------------------------------------------------------
    // LOGIK ANGKA (1 - 10)
    // -----------------------------------------------------------------
    
    // Angka 1: Hanya telunjuk tegak, jari lain tutup, ibu jari tidak melipat rapat
    if (telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka && !ibuJariMelipatDiDepan && jarakIbuJariKeTengah > 0.4) {
        return "1";
    }
    
    // Angka 2: Telunjuk & tengah terbuka, ibu jari tertutup
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

    // Angka 5 (Semua jari terbuka lebar termasuk ibu jari)
    if (ibuJariTerbuka && telunjukTerbuka && tengahTerbuka && manisTerbuka && kelingkingTerbuka) {
        return "5";
    }

    // Angka 6 (Genggaman penuh + Ibu jari terbuka)
    if (ibuJariTerbuka && !telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) {
        return "6";
    }

    // Angka 7 (Ibu jari + Telunjuk terbuka)
    if (ibuJariTerbuka && telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) {
        return "7";
    }

    // Angka 9 (Ibu jari + Telunjuk + Tengah + Manis terbuka)
    if (ibuJariTerbuka && telunjukTerbuka && tengahTerbuka && manisTerbuka && !kelingkingTerbuka) {
        return "9";
    }
    
    // Angka 10 (Genggam penuh / ibu jari tertutup rapat)
    if (!ibuJariTerbuka && !telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) {
        return "10 (Genggam & Goyang)";
    }

    return "...";
}
