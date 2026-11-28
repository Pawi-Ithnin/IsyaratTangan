const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const liveSignEl = document.getElementById('live-sign');
const statusTextEl = document.getElementById('status-text');
const stateTagEl = document.getElementById('state-tag');
const fpsTagEl = document.getElementById('fps-tag');
const allowedPillEl = document.getElementById('allowed-pill');
const toggleBtn = document.getElementById('toggleBtn');
const resetBtn = document.getElementById('resetBtn');

function jarak(a, b) {
    if (!a || !b) return 999;
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function skala(f) {
    return (f && f.lebarBahu) ? f.lebarBahu : 0.22;
}

function licinTitik(prev, curr, alpha = 0.45) {
    if (!curr) return null;
    if (!prev) return { x: curr.x, y: curr.y };
    return {
        x: prev.x + alpha * (curr.x - prev.x),
        y: prev.y + alpha * (curr.y - prev.y)
    };
}

// =====================================================================
// KOLEKSI ISYARAT YANG DISOKONG (Angka 1–10 & Huruf A–E)
// =====================================================================
const SENARAI_ISYARAT = [
    // --- HURUF A–E ---
    {
        label: "A",
        jenis: "huruf",
        padan: (_frames, jari) => {
            if (!jari) return false;
            const empatJariTutup = !jari.telunjuk && !jari.tengah && !jari.manis && !jari.kelingking;
            const ibuJariDiSisi = !jari.ibuJari && jari.jarakIbuJariKeKelingking > 0.55;
            return empatJariTutup && ibuJariDiSisi;
        }
    },
    {
        label: "B",
        jenis: "huruf",
        padan: (_frames, jari) => {
            if (!jari) return false;
            const empatJariTegak = jari.telunjuk && jari.tengah && jari.manis && jari.kelingking;
            const jariRapat = jari.jarakTelunjukKeKelingking < 0.78;
            const ibuJariDilipat = !jari.ibuJari;
            return empatJariTegak && jariRapat && ibuJariDilipat;
        }
    },
    {
        label: "C",
        jenis: "huruf",
        padan: (_frames, jari) => {
            if (!jari) return false;
            const bukanGenggamPenuh = jari.bukaanIbuJariTelunjuk > 0.55 && jari.bukaanIbuJariTelunjuk < 1.35;
            const jariMelengkung = !jari.tengah && !jari.manis && !jari.kelingking;
            return bukanGenggamPenuh && jariMelengkung;
        }
    },
    {
        label: "D",
        jenis: "huruf",
        padan: (_frames, jari) => {
            if (!jari) return false;
            const hanyaTelunjukTegak = jari.telunjuk && !jari.tengah && !jari.manis && !jari.kelingking;
            const ibuJariDekatTengah = jari.jarakIbuJariKeTengah < 0.72;
            return hanyaTelunjukTegak && ibuJariDekatTengah;
        }
    },
    {
        label: "E",
        jenis: "huruf",
        padan: (_frames, jari) => {
            if (!jari) return false;
            const semuaJariTurun = !jari.telunjuk && !jari.tengah && !jari.manis && !jari.kelingking;
            const ibuJariDiBawah = !jari.ibuJari && jari.ibuJariDiBawahTelunjuk;
            return semuaJariTurun && ibuJariDiBawah;
        }
    },

    // --- ANGKA 1–10 ---
    {
        label: "1",
        jenis: "angka",
        padan: (_frames, jari) =>
            Boolean(jari && !jari.ibuJari && jari.telunjuk && !jari.tengah && !jari.manis && !jari.kelingking && jari.jarakIbuJariKeTengah >= 0.72)
    },
    {
        label: "2",
        jenis: "angka",
        padan: (_frames, jari) =>
            Boolean(jari && !jari.ibuJari && jari.telunjuk && jari.tengah && !jari.manis && !jari.kelingking)
    },
    {
        label: "4",
        jenis: "angka",
        padan: (_frames, jari) =>
            Boolean(jari && !jari.ibuJari && jari.telunjuk && jari.tengah && jari.manis && jari.kelingking && jari.jarakTelunjukKeKelingking >= 0.78)
    },
    {
        label: "5",
        jenis: "angka",
        padan: (_frames, jari) =>
            Boolean(jari && jari.ibuJari && jari.telunjuk && jari.tengah && jari.manis && jari.kelingking)
    },
    {
        label: "6",
        jenis: "angka",
        padan: (_frames, jari) =>
            Boolean(jari && jari.ibuJari && !jari.telunjuk && !jari.tengah && !jari.manis && !jari.kelingking)
    },
    {
        label: "7",
        jenis: "angka",
        padan: (_frames, jari) =>
            Boolean(jari && jari.ibuJari && jari.telunjuk && !jari.tengah && !jari.manis && !jari.kelingking)
    },
    {
        label: "9",
        jenis: "angka",
        padan: (_frames, jari) =>
            Boolean(jari && jari.ibuJari && jari.telunjuk && jari.tengah && jari.manis && !jari.kelingking)
    },
    {
        label: "8",
        jenis: "angka",
        padan: (_frames, jari) =>
            Boolean(
                jari &&
                jari.ibuJari &&
                jari.telunjuk &&
                jari.tengah &&
                !jari.manis &&
                !jari.kelingking &&
                jari.bukaanIbuJariTelunjuk > 0.98
            )
    },
    {
        label: "3",
        jenis: "angka",
        padan: (_frames, jari) =>
            Boolean(
                jari &&
                jari.ibuJari &&
                jari.telunjuk &&
                jari.tengah &&
                !jari.manis &&
                !jari.kelingking &&
                jari.bukaanIbuJariTelunjuk <= 0.85
            )
    },
    {
        label: "10",
        jenis: "angka",
        padan: (frames, jari) => {
            if (!jari || frames.length < 4) return false;
            const s = skala(frames[frames.length - 1]);
            const tertutup = !jari.ibuJari && !jari.telunjuk && !jari.tengah && !jari.manis && !jari.kelingking;
            if (!tertutup) return false;

            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            let kiraGenggam = 0;

            for (const f of frames) {
                if (
                    f.jariAktif &&
                    !f.jariAktif.ibuJari &&
                    !f.jariAktif.telunjuk &&
                    !f.jariAktif.tengah &&
                    !f.jariAktif.manis &&
                    !f.jariAktif.kelingking &&
                    f.jariAktif.pusatTangan
                ) {
                    kiraGenggam++;
                    minX = Math.min(minX, f.jariAktif.pusatTangan.x);
                    maxX = Math.max(maxX, f.jariAktif.pusatTangan.x);
                    minY = Math.min(minY, f.jariAktif.pusatTangan.y);
                    maxY = Math.max(maxY, f.jariAktif.pusatTangan.y);
                }
            }

            const adaGerakGoyang = (maxX - minX) > s * 0.24 || (maxY - minY) > s * 0.24;
            return kiraGenggam >= 4 && adaGerakGoyang;
        }
    }
];

const ISYARAT_DIBENARKAN = new Set(SENARAI_ISYARAT.map(item => item.label));
allowedPillEl.innerText = `Set (${SENARAI_ISYARAT.length} isyarat)`;

const WINDOW_SIZE = 10;
const VOTE_BUFFER_SIZE = 7;
const HOLD_MS = 550;

const frameWindow = [];
const recentVotes = [];

let prevSmoothed = {
    pusatTangan: null,
    lebarBahu: null
};

let displayedSign = "...";
let holdUntilTime = 0;
let isRunning = true;
let lastFrameTime = performance.now();

function analisaJari(hand) {
    if (!hand || hand.length < 21) return null;

    const saizTapak = Math.max(0.05, jarak(hand[0], hand[9]));

    const telunjuk = hand[8].y < hand[6].y - 0.025;
    const tengah = hand[12].y < hand[10].y - 0.025;
    const manis = hand[16].y < hand[14].y - 0.025;
    const kelingking = hand[20].y < hand[18].y - 0.025;

    const jarakHujungIbuJariKePangkalKelingking = jarak(hand[4], hand[17]) / saizTapak;
    const jarakHujungIbuJariKePangkalTelunjuk = jarak(hand[4], hand[5]) / saizTapak;
    const ibuJari = (hand[4].y < hand[3].y - 0.02) &&
        (jarakHujungIbuJariKePangkalKelingking > 0.74 || jarakHujungIbuJariKePangkalTelunjuk > 0.44);

    const bukaanIbuJariTelunjuk = jarak(hand[4], hand[8]) / saizTapak;
    const jarakIbuJariKeKelingking = jarak(hand[4], hand[20]) / saizTapak;
    const jarakTelunjukKeKelingking = jarak(hand[8], hand[20]) / saizTapak;
    const jarakIbuJariKeTengah = jarak(hand[4], hand[12]) / saizTapak;
    const ibuJariDiBawahTelunjuk = hand[4].y > hand[6].y - 0.015;

    return {
        ibuJari,
        telunjuk,
        tengah,
        manis,
        kelingking,
        bukaanIbuJariTelunjuk,
        jarakIbuJariKeKelingking,
        jarakTelunjukKeKelingking,
        jarakIbuJariKeTengah,
        ibuJariDiBawahTelunjuk,
        pusatTangan: hand[9]
    };
}

function ekstrakCiriFrame(results) {
    const pose = results.poseLandmarks;
    const kiri = results.leftHandLandmarks;
    const kanan = results.rightHandLandmarks;

    const handAktif = kanan || kiri;
    if (!pose && !handAktif) return null;

    const bahuKiri = pose ? pose[11] : null;
    const bahuKanan = pose ? pose[12] : null;

    const rawLebarBahu = (bahuKiri && bahuKanan)
        ? Math.max(0.12, jarak(bahuKiri, bahuKanan))
        : (prevSmoothed.lebarBahu || 0.22);

    const lebarBahu = prevSmoothed.lebarBahu
        ? prevSmoothed.lebarBahu + 0.35 * (rawLebarBahu - prevSmoothed.lebarBahu)
        : rawLebarBahu;
    prevSmoothed.lebarBahu = lebarBahu;

    let jariAktif = analisaJari(handAktif);
    if (jariAktif && jariAktif.pusatTangan) {
        prevSmoothed.pusatTangan = licinTitik(prevSmoothed.pusatTangan, jariAktif.pusatTangan);
        jariAktif = { ...jariAktif, pusatTangan: prevSmoothed.pusatTangan };
    }

    return {
        lebarBahu,
        jariAktif
    };
}

function kesanIsyaratDibenarkan(frames) {
    if (!frames || frames.length === 0) return "...";
    const terkini = frames[frames.length - 1];
    const jari = terkini ? terkini.jariAktif : null;
    if (!jari) return "...";

    for (const item of SENARAI_ISYARAT) {
        if (item.padan(frames, jari)) {
            return item.label;
        }
    }

    return "...";
}

function tapisIsyaratDibenarkan(rawLabel, now) {
    const labelSah = ISYARAT_DIBENARKAN.has(rawLabel) ? rawLabel : "...";

    recentVotes.push(labelSah);
    if (recentVotes.length > VOTE_BUFFER_SIZE) {
        recentVotes.shift();
    }

    const kiraan = {};
    for (const item of recentVotes) {
        kiraan[item] = (kiraan[item] || 0) + 1;
    }

    let pemenang = "...";
    let undiTertinggi = 0;
    for (const [label, jumlah] of Object.entries(kiraan)) {
        if (jumlah > undiTertinggi) {
            undiTertinggi = jumlah;
            pemenang = label;
        }
    }

    const ambangUndi = pemenang === "..." ? 5 : 4;
    if (ISYARAT_DIBENARKAN.has(pemenang) && undiTertinggi >= ambangUndi) {
        if (pemenang !== displayedSign) {
            displayedSign = pemenang;
            holdUntilTime = now + HOLD_MS;
        } else {
            holdUntilTime = Math.max(holdUntilTime, now + HOLD_MS * 0.6);
        }
        return displayedSign;
    }

    if (now < holdUntilTime && displayedSign !== "...") {
        return displayedSign;
    }

    displayedSign = "...";
    return "...";
}

function onResults(results) {
    const now = performance.now();
    const fps = Math.round(1000 / Math.max(1, now - lastFrameTime));
    lastFrameTime = now;
    fpsTagEl.innerText = isRunning ? `FPS: ${fps}` : "FPS: --";

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.poseLandmarks) {
        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#38bdf8', lineWidth: 2 });
        drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#f59e0b', radius: 3 });
    }
    if (results.leftHandLandmarks) {
        drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, { color: '#facc15', lineWidth: 2 });
        drawLandmarks(canvasCtx, results.leftHandLandmarks, { color: '#fef08a', radius: 2 });
    }
    if (results.rightHandLandmarks) {
        drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, { color: '#22c55e', lineWidth: 2 });
        drawLandmarks(canvasCtx, results.rightHandLandmarks, { color: '#bbf7d0', radius: 2 });
    }

    const ciri = ekstrakCiriFrame(results);
    if (ciri && ciri.jariAktif) {
        statusTextEl.innerText = "Mengesan angka 1–10 & huruf A–E...";
        frameWindow.push(ciri);
        if (frameWindow.length > WINDOW_SIZE) {
            frameWindow.shift();
        }
        const mentah = kesanIsyaratDibenarkan(frameWindow);
        liveSignEl.innerText = tapisIsyaratDibenarkan(mentah, now);
    } else {
        statusTextEl.innerText = "Tunjukkan tangan ke kamera untuk angka 1–10 atau A–E.";
        if (now >= holdUntilTime) {
            displayedSign = "...";
            liveSignEl.innerText = "...";
        }
    }

    canvasCtx.restore();
}

const holistic = new Holistic({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`
});

holistic.setOptions({
    modelComplexity: 0,
    smoothLandmarks: true,
    minDetectionConfidence: 0.55,
    minTrackingConfidence: 0.55
});
holistic.onResults(onResults);

toggleBtn.addEventListener('click', () => {
    isRunning = !isRunning;
    toggleBtn.innerText = isRunning ? "Jeda" : "Sambung";
    stateTagEl.innerText = isRunning ? "AKTIF" : "DIJEDA";
    stateTagEl.classList.toggle("ok", isRunning);
    if (!isRunning) {
        fpsTagEl.innerText = "FPS: --";
    }
    statusTextEl.innerText = isRunning ? "Bacaan disambung." : "Bacaan dijeda.";
});

resetBtn.addEventListener('click', () => {
    frameWindow.length = 0;
    recentVotes.length = 0;
    displayedSign = "...";
    holdUntilTime = 0;
    prevSmoothed = {
        pusatTangan: null,
        lebarBahu: null
    };
    liveSignEl.innerText = "...";
    statusTextEl.innerText = "Tetingkap imbasan diset semula.";
});

navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
})
    .then((stream) => {
        videoElement.srcObject = stream;
        videoElement.onloadedmetadata = () => {
            if (videoElement.videoWidth && videoElement.videoHeight) {
                canvasElement.width = videoElement.videoWidth;
                canvasElement.height = videoElement.videoHeight;
            }
            videoElement.play();
            statusTextEl.innerText = "Kamera sedia. Cuba angka 1–10 atau huruf A–E.";

            async function gelungFrame() {
                if (isRunning && !videoElement.paused && !videoElement.ended) {
                    await holistic.send({ image: videoElement });
                }
                requestAnimationFrame(gelungFrame);
            }
            gelungFrame();
        };
    })
    .catch((err) => {
        statusTextEl.innerText = "Gagal akses kamera: " + err.message;
    });
