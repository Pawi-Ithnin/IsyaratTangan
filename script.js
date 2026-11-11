/**
 * Fungsi Utama Pengecaman Bahasa Isyarat Malaysia (BIM)
 * Mengesan: Abjad (A-E), Angka (1-10), serta Isyarat "Saya" dan "Kita"
 */
function kenalPastiBIM(leftHandLandmarks, rightHandLandmarks, poseLandmarks) {
    // Pilih tangan yang aktif (Utamakan tangan kanan)
    let landmarks = rightHandLandmarks || leftHandLandmarks;
    
    if (!landmarks) return "...";

    // -----------------------------------------------------------------
    // 1. PENGIRAAN ASAS & NORMALISASI
    // -----------------------------------------------------------------
    // Saiz tangan diguna untuk menormalkan jarak (bebas daripada skala kamera dekat/jauh)
    let saizTangan = Math.sqrt(Math.pow(landmarks[5].x - landmarks[17].x, 2) + Math.pow(landmarks[5].y - landmarks[17].y, 2));
    if (saizTangan === 0) saizTangan = 0.1; // Elak pembahagian dengan kosong

    // Status bukaan 4 jari utama (Hujung jari < Sendi tengah)
    let telunjukTerbuka = landmarks[8].y < landmarks[6].y;
    let tengahTerbuka = landmarks[12].y < landmarks[10].y;
    let manisTerbuka = landmarks[16].y < landmarks[14].y;
    let kelingkingTerbuka = landmarks[20].y < landmarks[18].y;

    // Jarak ibu jari ke bahagian lain (dinormalkan)
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
    // 2. LOGIK KOSA KATA KHAS ("SAYA" & "KITA")
    // -----------------------------------------------------------------
    if (poseLandmarks) {
        let bahuKiri = poseLandmarks[11];
        let bahuKanan = poseLandmarks[12];
        let dadaX = (bahuKiri.x + bahuKanan.x) / 2;
        let dadaY = (bahuKiri.y + bahuKanan.y) / 2;
        let tengahBadanX = dadaX;

        // Semak isyarat "SAYA": Telunjuk lurus menunjuk ke arah dada, jari lain tutup
        let tengahTertutup = !tengahTerbuka;
        let manisTertutup = !manisTerbuka;
        let kelingkingTertutup = !kelingkingTerbuka;
        let jarakKeDada = Math.sqrt(
            Math.pow(landmarks[8].x - dadaX, 2) + 
            Math.pow(landmarks[8].y - dadaY, 2)
        );

        if (telunjukTerbuka && tengahTertutup && manisTertutup && kelingkingTertutup && jarakKeDada < 0.25) {
            return "Isyarat: Saya";
        }

        // Semak isyarat "KITA": Tangan berada di sekitar kawasan tengah dada dengan telunjuk & tengah terbuka
        let tanganDiDadaX = Math.abs(landmarks[0].x - tengahBadanX) < 0.2;
        if (tanganDiDadaX && telunjukTerbuka && tengahTerbuka) {
            return "Isyarat: Kita";
        }
    }

    // -----------------------------------------------------------------
    // 3. LOGIK ABJAD (A, B, C, D, E)
    // -----------------------------------------------------------------
    // Huruf A: Genggam & ibu jari di tepi
    if (!telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka && ibuJariTerbuka && !ibuJariMelipatDiDepan) {
        return "Huruf A";
    }

    // Huruf B: 4 jari tegak lurus terbuka, ibu jari melipat di depan
    if (telunjukTerbuka && tengahTerbuka && manisTerbuka && kelingkingTerbuka && (ibuJariMelipatDiDepan || !ibuJariTerbuka)) {
        return "Huruf B";
    }

    // Huruf C: Jari melengkung membentuk julat 'C'
    let jariMelengkung = landmarks[8].y > landmarks[7].y && landmarks[12].y > landmarks[11].y;
    if (jariMelengkung && jarakIbuJariKeTelunjukHujung > 0.4 && jarakIbuJariKeTelunjukHujung < 0.95) {
        return "Huruf C";
    }

    // Huruf D: Telunjuk sahaja tegak, ibu jari dekat dengan jari tengah/manis
    if (telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka && jarakIbuJariKeTengah < 0.35) {
        return "Huruf D";
    }

    // Huruf E: Semua 4 jari mengkuku rapat ke bawah
    let semuaJariMengkuku = landmarks[8].y > landmarks[6].y && landmarks[12].y > landmarks[10].y && landmarks[16].y > landmarks[14].y && landmarks[20].y > landmarks[18].y;
    if (semuaJariMengkuku && (ibuJariMelipatDiDepan || jarakIbuJariKeTelunjuk < 0.3)) {
        return "Huruf E";
    }

    // -----------------------------------------------------------------
    // 4. LOGIK ANGKA (1 - 10)
    // -----------------------------------------------------------------
    // Angka 1: Hanya telunjuk tegak
    if (telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka && !ibuJariMelipatDiDepan && jarakIbuJariKeTengah > 0.4) {
        return "Angka 1";
    }
    
    // Angka 2: Telunjuk & tengah terbuka
    if (telunjukTerbuka && tengahTerbuka && !manisTerbuka && !kelingkingTerbuka && !ibuJariTerbuka) {
        return "Angka 2";
    }
    
    // Angka 3 & 8 (Ibu jari + Telunjuk + Tengah)
    if (ibuJariTerbuka && telunjukTerbuka && tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) {
        if (jarakIbuJariKeTelunjuk > 0.8) return "Angka 8"; 
        return "Angka 3"; 
    }
    
    // Angka 4: 4 jari terbuka, ibu jari melipat
    if (telunjukTerbuka && tengahTerbuka && manisTerbuka && kelingkingTerbuka && !ibuJariTerbuka) {
        return "Angka 4";
    }

    // Angka 5: Semua jari terbuka lebar termasuk ibu jari
    if (ibuJariTerbuka && telunjukTerbuka && tengahTerbuka && manisTerbuka && kelingkingTerbuka) {
        return "Angka 5";
    }

    // Angka 6: Genggaman penuh + Ibu jari terbuka
    if (ibuJariTerbuka && !telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) {
        return "Angka 6";
    }

    // Angka 7: Ibu jari + Telunjuk terbuka
    if (ibuJariTerbuka && telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) {
        return "Angka 7";
    }

    // Angka 9: Ibu jari + Telunjuk + Tengah + Manis terbuka
    if (ibuJariTerbuka && telunjukTerbuka && tengahTerbuka && manisTerbuka && !kelingkingTerbuka) {
        return "Angka 9";
    }
    
    // Angka 10: Genggam penuh / ibu jari tertutup rapat
    if (!ibuJariTerbuka && !telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) {
        return "Angka 10 (Genggam & Goyang)";
    }

    return "...";
}
