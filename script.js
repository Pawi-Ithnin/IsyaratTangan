function tekaBIM(leftHandLandmarks, rightHandLandmarks, poseLandmarks) {
    let landmarks = rightHandLandmarks || leftHandLandmarks;
    
    if (!landmarks) return "...";

    let saizTangan = Math.sqrt(Math.pow(landmarks[5].x - landmarks[17].x, 2) + Math.pow(landmarks[5].y - landmarks[17].y, 2));
    if (saizTangan === 0) saizTangan = 0.1;

    let telunjukTerbuka = landmarks[8].y < landmarks[6].y;
    let tengahTerbuka = landmarks[12].y < landmarks[10].y;
    let manisTerbuka = landmarks[16].y < landmarks[14].y;
    let kelingkingTerbuka = landmarks[20].y < landmarks[18].y;

    let jarakIbuJariKeTelunjuk = Math.abs(landmarks[4].x - landmarks[5].x) / saizTangan;
    let ibuJariTerbuka = landmarks[4].y < landmarks[5].y || jarakIbuJariKeTelunjuk > 0.45;  

    // -----------------------------------------------------------------
    // SEMAKAN ABJAD BIM (A - E) YANG DIUBAHSUAI
    // -----------------------------------------------------------------

    // Huruf A: Genggaman penuh (semua jari tutup)
    if (!telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) {
        return "A";
    }

    // Huruf B: 4 jari terbuka ke atas dan rapat
    let jariRapat = Math.abs(landmarks[8].x - landmarks[20].x) / saizTangan < 0.7;
    if (telunjukTerbuka && tengahTerbuka && manisTerbuka && kelingkingTerbuka && !ibuJariTerbuka && jariRapat) {
        return "B";
    }

    // Huruf C: Jari melengkung (C-shape)
    let cShape = (landmarks[8].x > landmarks[4].x) && (landmarks[8].y >= landmarks[6].y);
    if (cShape && !tengahTerbuka && !manisTerbuka) {
        return "C";
    }

    // Huruf D: Telunjuk tegak, jari lain membentuk gelung
    let jarakIbuJariKeJariTengah = Math.abs(landmarks[4].x - landmarks[12].x) / saizTangan;
    if (telunjukTerbuka && !tengahTerbuka && !manisTerbuka && jarakIbuJariKeJariTengah < 0.35) {
        return "D";
    }

    // Huruf E: Semua jari melipat di tapak tangan
    let semuaJariMelipat = !telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka;
    if (semuaJariMelipat && landmarks[4].y >= landmarks[6].y) {
        return "E";
    }

    // -----------------------------------------------------------------
    // SEMAKAN ANGKA BIM (1 - 10)
    // -----------------------------------------------------------------
    if (telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) return "1";
    if (telunjukTerbuka && tengahTerbuka && !manisTerbuka && !kelingkingTerbuka && !ibuJariTerbuka) return "2";
    if (ibuJariTerbuka && telunjukTerbuka && tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) return "3";
    if (telunjukTerbuka && tengahTerbuka && manisTerbuka && kelingkingTerbuka && !ibuJariTerbuka) return "4";
    if (ibuJariTerbuka && telunjukTerbuka && tengahTerbuka && manisTerbuka && kelingkingTerbuka) return "5";
    if (ibuJariTerbuka && !telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) return "6";
    if (ibuJariTerbuka && telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) return "7";
    if (ibuJariTerbuka && telunjukTerbuka && tengahTerbuka && !manisTerbuka && !kelingkingTerbuka && jarakIbuJariKeTelunjuk > 0.8) return "8";
    if (ibuJariTerbuka && telunjukTerbuka && tengahTerbuka && manisTerbuka && !kelingkingTerbuka) return "9";
    if (!ibuJariTerbuka && !telunjukTerbuka && !tengahTerbuka && !manisTerbuka && !kelingkingTerbuka) return "10";

    return "...";
}
