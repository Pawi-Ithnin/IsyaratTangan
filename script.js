// LOGIK PEMETAAN BIM - ANGKA (1-10) & ABJAD (A-E)
function tekaBIM(leftHandLandmarks, rightHandLandmarks, poseLandmarks) {
    // Pilih tangan yang aktif (Utamakan tangan kanan)
    let landmarks = rightHandLandmarks || leftHandLandmarks;
    
    if (!landmarks) return "...";

    // Saiz tangan diguna untuk menormalkan jarak (bebas daripada skala kamera)
    let saizTangan = Math.sqrt(Math.pow(landmarks[5].x - landmarks[17].x, 2) + Math.pow(landmarks[5].y - landmarks[17].y, 2));
    if (saizTangan === 0) saizTangan = 0.1; // Elak pembahagian dengan kosong

    // Status bukaan 4 jari utama (Y coordinate: nilai lebih kecil bermaksud kedudukan lebih tinggi pada skrin)
    let telunjukTerbuka = landmarks[8].y < landmarks[6].y;
    let tengahTerbuka = landmarks[12].y < landmarks[10].y;
    let manisTerbuka = landmarks[16].y < landmarks[14].y;
    let kelingkingTerbuka = landmarks[20].y < landmarks[18].y;

    // Jarak ibu jari ke pangkal telunjuk (dinormalkan dengan saiz tangan)
    let jarakIbuJariKeTelunjuk = Math.abs(landmarks[4].x - landmarks[5].x) / saizTangan;
    
    // Status Ibu Jari
    let ibuJariTerbuka = landmarks[4].y < landmarks[5].y || jarakIbuJariKeTelunjuk > 0.45;  

    // Sempadan X untuk ibu jari
    let minX = Math.min(landmarks[5].x, landmarks[17].x);
    let maxX = Math.max(landmarks[5].x, landmarks[17].x);
    let ibuJariMelipatDiDepan = landmarks[4].x > minX && landmarks[4].x < maxX;

    // -----------------------------------------------------------------
    // LOGIK ABJAD BIM (A - E)
    // -----------------------------------------------------------------

    // Huruf A: Genggaman penuh dengan ibu jari diletakkan lurus di sisi jari lain (tidak melipat ke dalam tapak tangan)
    let ibuJariDiSisi = landmarks[4].x > landmarks[2].x && !ibuJariTerbuka;
    if (!telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka && ibuJariDiSisi) {
        return "A";
    }

    // Huruf B: Keempat-empat jari tegak lurus rapat ke atas, ibu jari melipat di tapak tangan
    let jariRapat = Math.abs(landmarks[8].x - landmarks[20].x) / saizTangan < 0.6;
    if (telunjukTerbuka && tengahTerbuka && manisTerbuka && kelingkingTerbuka && !ibuJariTerbuka && jariRapat) {
        return "B";
    }

    // Huruf C: Jari-jemari melengkung membentuk separuh bulatan (C-shape)
    let cShape = (landmarks[8].x > landmarks[4].x) && 
                 (landmarks[8].y > landmarks[6].y && landmarks[8].y < landmarks[5].y);
    if (cShape && !tengahTerbuka && !manisTerbuka) {
        return "C";
    }

    // Huruf D: Telunjuk sahaja tegak ke atas, jari lain melengkung bertemu ibu jari membentuk gelung (O-shape)
    let jariMembentukGelung = !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka;
    let ibuJariBertemuKelingkingManis = Math.abs(landmarks[4].y - landmarks[16].y) / saizTangan < 0.2;
    if (telunjukTerbuka && jariMembentukGelung && ibuJariBertemuKelingkingManis) {
        return "D";
    }

    // Huruf E: Semua jari melipat rapat ke bawah/tapak tangan dengan ibu jari melintang di bawah jari-jari
    let semuaJariMelipat = !telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka;
    let ibuJariMelintangDiBawah = landmarks[4].y > landmarks[6].y && landmarks[4].y < landmarks[10].y;
    if (semuaJariMelipat && ibuJariMelintangDiBawah) {
        return "E";
    }

    // -----------------------------------------------------------------
    // LOGIK ANGKA BIM (1 - 10)
    // -----------------------------------------------------------------
    
    // Angka 1: Hanya telunjuk tegak, jari lain tutup
    if (telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka && !ibuJariMelipatDiDepan) {
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
