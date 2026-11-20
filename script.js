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

// =====================================================================
// KOLEKSI ISYARAT YANG DISOKONG (Termasuk HUJAN)
// =====================================================================
const SENARAI_ISYARAT = [
    {
        label: "HUJAN",
        padan: (frames) => {
            if (frames.length < 3) return false;
            const awal = frames[0];
            const terkini = frames[frames.length - 1];
            const tanganAwal = awal.tanganKananTitik || awal.tanganKiriTitik;
            const tanganKini = terkini.tanganKananTitik || terkini.tanganKiriTitik;

            if (!tanganAwal || !tanganKini) return false;

            // Bermula di kawasan atas/bahu dan bergerak turun ke bawah
            const mulaDiAtas = awal.hidung ? tanganAwal.y < (awal.hidung.y + 0.18) : tanganAwal.y < 0.55;
            const gerakTurun = (tanganKini.y - tanganAwal.y) > 0.09;

            return mulaDiAtas && gerakTurun;
        }
    },
    {
        label: "MINTA",
        padan: (frames) => {
            if (frames.length < 3) return false;
            const awal = frames[0];
            const terkini = frames[frames.length - 1];
            const tanganAwal = awal.tanganKananTitik || awal.tanganKiriTitik;
            const tanganKini = terkini.tanganKananTitik || terkini.tanganKiriTitik;

            if (!tanganAwal || !tanganKini) return false;

            const jarakAwalKeDada = jarak(tanganAwal, {
                x: awal.tengahDadaX,
                y: awal.tengahDadaY
            });
            const jarakKiniKeDada = jarak(tanganKini, {
                x: terkini.tengahDadaX,
                y: terkini.tengahDadaY
            });

            const gerakKeDada = (jarakAwalKeDada - jarakKiniKeDada) > 0.08;
            const sampaiKawasanDada = jarakKiniKeDada < 0.22;

            return gerakKeDada && sampaiKawasanDada;
        }
    },
    {
        label: "MAAF",
        padan: (frames) => {
            if (frames.length < 3) return false;

            let kiraDiDada = 0;
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

            for (const f of frames) {
                const tangan = f.tanganKananTitik || f.tanganKiriTitik;
                if (!tangan) continue;

                const diDada =
                    Math.abs(tangan.x - f.tengahDadaX) < 0.16 &&
                    Math.abs(tangan.y - f.tengahDadaY) < 0.14;

                if (diDada) {
                    kiraDiDada++;
                    minX = Math.min(minX, tangan.x);
                    maxX = Math.max(maxX, tangan.x);
                    minY = Math.min(minY, tangan.y);
                    maxY = Math.max(maxY, tangan.y);
                }
            }

            const rentangX = maxX - minX;
            const rentangY = maxY - minY;
            const gerakPutarDada = (rentangX > 0.035 && rentangX <= 0.09) || (rentangY > 0.035 && rentangY <= 0.12);

            return kiraDiDada >= 3 && gerakPutarDada;
        }
    },
    {
        label: "KITA",
        padan: (frames) => {
            if (frames.length < 3) return false;
            const awal = frames[0];
            const terkini = frames[frames.length - 1];
            const tanganAwal = awal.tanganKananTitik || awal.tanganKiriTitik;
            const tanganKini = terkini.tanganKananTitik || terkini.tanganKiriTitik;

            if (!tanganAwal || !tanganKini) return false;

            const diKawasanDadaAwal =
                Math.abs(tanganAwal.x - awal.tengahDadaX) < 0.24 &&
                Math.abs(tanganAwal.y - awal.tengahDadaY) < 0.16;

            const diKawasanDadaKini =
                Math.abs(tanganKini.x - terkini.tengahDadaX) < 0.24 &&
                Math.abs(tanganKini.y - terkini.tengahDadaY) < 0.16;

            const gerakMelintangDada = Math.abs(tanganKini.x - tanganAwal.x) > 0.09;

            return diKawasanDadaAwal && diKawasanDadaKini && gerakMelintangDada;
        }
    },
    {
        label: "MAKAN",
        padan: (frames, jari) => {
            if (frames.length < 3) return false;

            let kiraDekatMulut = 0;
            let minY = Infinity;
            let maxY = -Infinity;

            for (const f of frames) {
                const tangan = f.tanganKananTitik || f.tanganKiriTitik;
                if (!f.hidung || !tangan) continue;

                const dekatMulut =
                    Math.abs(tangan.x - f.hidung.x) < 0.14 &&
                    (tangan.y - f.hidung.y) > 0.01 &&
                    (tangan.y - f.hidung.y) < 0.22;

                if (dekatMulut) {
                    kiraDekatMulut++;
                    minY = Math.min(minY, tangan.y);
                    maxY = Math.max(maxY, tangan.y);
                }
            }

            const adaGerakKeMulut = (maxY - minY) > 0.03;
            const jariTidakTerbukaPenuh = jari
                ? !(jari.ibuJari && jari.telunjuk && jari.tengah && jari.manis && jari.kelingking)
                : true;

            return kiraDekatMulut >= 3 && adaGerakKeMulut && jariTidakTerbukaPenuh;
        }
    },
    {
        label: "TERIMA KASIH",
        padan: (frames) => {
            if (frames.length < 3) return false;
            const awal = frames[0];
            const terkini = frames[frames.length - 1];
            const tanganAwal = awal.tanganKananTitik || awal.tanganKiriTitik;
            const tanganKini = terkini.tanganKananTitik || terkini.tanganKiriTitik;

            if (!awal.hidung || !tanganAwal || !tanganKini) return false;

            const dekatMulutDaguAwal =
                Math.abs(tanganAwal.x - awal.hidung.x) < 0.16 &&
                (tanganAwal.y - awal.hidung.y) > 0.02 &&
                (tanganAwal.y - awal.hidung.y) < 0.24;

            const gerakTurunAtauKeluar =
                (tanganKini.y - tanganAwal.y) > 0.07 ||
                Math.abs(tanganKini.x - tanganAwal.x) > 0.10;

            return dekatMulutDaguAwal && gerakTurunAtauKeluar;
        }
    },
    {
        label: "SAYA",
        padan: (frames) => {
            const terkini = frames[frames.length - 1];
            if (!terkini || !terkini.tanganKananTitik) return false;
            const dDada = jarak(terkini.tanganKananTitik, {
                x: terkini.tengahDadaX,
                y: terkini.tengahDadaY
            });
            return dDada < 0.14;
        }
    },
    {
        label: "1",
        padan: (_frames, jari) =>
            Boolean(jari && !jari.ibuJari && jari.telunjuk && !jari.tengah && !jari.manis && !jari.kelingking)
    },
    {
        label: "2",
        padan: (_frames, jari) =>
            Boolean(jari && !jari.ibuJari && jari.telunjuk && jari.tengah && !jari.manis && !jari.kelingking)
    },
    {
        label: "4",
        padan: (_frames, jari) =>
            Boolean(jari && !jari.ibuJari && jari.telunjuk && jari.tengah && jari.manis && jari.kelingking)
    },
    {
        label: "5",
        padan: (_frames, jari) =>
            Boolean(jari && jari.ibuJari && jari.telunjuk && jari.tengah && jari.manis && jari.kelingking)
    },
    {
        label: "6",
        padan: (_frames, jari) =>
            Boolean(jari && jari.ibuJari && !jari.telunjuk && !jari.tengah && !jari.manis && !jari.kelingking)
    },
    {
        label: "7",
        padan: (_frames, jari) =>
            Boolean(jari && jari.ibuJari && jari.telunjuk && !jari.tengah && !jari.manis && !jari.kelingking)
    },
    {
        label: "9",
        padan: (_frames, jari) =>
            Boolean(jari && jari.ibuJari && jari.telunjuk && jari.tengah && jari.manis && !jari.kelingking)
    },
    {
        label: "8",
        padan: (_frames, jari) =>
            Boolean(
                jari &&
                jari.ibuJari &&
                jari.telunjuk &&
                jari.tengah &&
                !jari.manis &&
                !jari.kelingking &&
                jari.bukaanIbuJariTelunjuk > 0.92
            )
    },
    {
        label: "3",
        padan: (_frames, jari) =>
            Boolean(
                jari &&
                jari.ibuJari &&
                jari.telunjuk &&
                jari.tengah &&
                !jari.manis &&
                !jari.kelingking &&
                jari.bukaanIbuJariTelunjuk <= 0.92
            )
    },
    {
        label: "10",
        padan: (frames, jari) => {
            if (!jari || frames.length < 3) return false;
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

            const adaGerakGoyang = (maxX - minX) > 0.045 || (maxY - minY) > 0.045;
            return kiraGenggam >= 3 && adaGerakGoyang;
        }
    }
];

const ISYARAT_DIBENARKAN = new Set(SENARAI_ISYARAT.map(item => item.label));
allowedPillEl.innerText = `Set (${SENARAI_ISYARAT.length} isyarat)`;

const WINDOW_SIZE = 5;
const VOTE_BUFFER_SIZE = 3;
const frameWindow = [];
const recentVotes = [];

let isRunning = true;
let lastFrameTime = performance.now();

function jarak(a, b) {
    if (!a || !b) return 999;
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function analisaJari(hand) {
    if (!hand || hand.length < 21) return null;

    const saizTapak = Math.max(0.05, jarak(hand[0], hand[9]));

    const telunjuk = hand[8].y < hand[6].y - 0.02;
    const tengah = hand[12].y < hand[10].y - 0.02;
    const manis = hand[16].y < hand[14].y - 0.02;
    const kelingking = hand[20].y < hand[18].y - 0.02;

    const jarakHujungIbuJariKePangkalKelingking = jarak(hand[4], hand[17]) / saizTapak;
    const jarakHujungIbuJariKePangkalTelunjuk = jarak(hand[4], hand[5]) / saizTapak;
    const ibuJari = (hand[4].y < hand[3].y - 0.015) &&
        (jarakHujungIbuJariKePangkalKelingking > 0.72 || jarakHujungIbuJariKePangkalTelunjuk > 0.42);

    const bukaanIbuJariTelunjuk = jarak(hand[4], hand[8]) / saizTapak;

    return {
        ibuJari,
        telunjuk,
        tengah,
        manis,
        kelingking,
        bukaanIbuJariTelunjuk,
        pusatTangan: hand[9]
    };
}

function ekstrakCiriFrame(results) {
    const pose = results.poseLandmarks;
    const kiri = results.leftHandLandmarks;
    const kanan = results.rightHandLandmarks;

    if (!pose && !kiri && !kanan) return null;

    const hidung = pose ? pose[0] : null;
    const bahuKiri = pose ? pose[11] : null;
    const bahuKanan = pose ? pose[12] : null;
    const tanganKananTitik = kanan ? kanan[8] : (pose ? pose[16] : null);
    const tanganKiriTitik = kiri ? kiri[8] : (pose ? pose[15] : null);

    const tengahDadaX = (bahuKiri && bahuKanan) ? (bahuKiri.x + bahuKanan.x) / 2 : 0.5;
    const tengahDadaY = (bahuKiri && bahuKanan) ? (bahuKiri.y + bahuKanan.y) / 2 + 0.12 : 0.6;

    const handAktif = kanan || kiri;
    const jariAktif = analisaJari(handAktif);

    return {
        hidung,
        tengahDadaX,
        tengahDadaY,
        tanganKananTitik,
        tanganKiriTitik,
        jariAktif
    };
}

function kesanIsyaratDibenarkan(frames) {
    if (frames.length < 3) return "...";
    const terkini = frames[frames.length - 1];
    const jari = terkini ? terkini.jariAktif : null;

    for (const item of SENARAI_ISYARAT) {
        if (item.padan(frames, jari)) {
            return item.label;
        }
    }
    return "...";
}

function tapisIsyaratDibenarkan(rawLabel) {
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

    if (ISYARAT_DIBENARKAN.has(pemenang) && undiTertinggi >= 2) {
        return pemenang;
    }
    return "...";
}

function onResults(results) {
    const now = performance.now();
    const fps = Math.round(1000 / Math.max(1, now - lastFrameTime));
    lastFrameTime = now;
    fpsTagEl.innerText = `FPS: ${fps}`;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.poseLandmarks) {
        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#38bdf8', lineWidth: 2 });
        drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#f59e0b', radius: 3 });
    }
    if (results.leftHandLandmarks) {
        drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, { color: '#facc15', lineWidth: 2 });
    }
    if (results.rightHandLandmarks) {
        drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, { color: '#22c55e', lineWidth: 2 });
    }

    const ciri = ekstrakCiriFrame(results);
    if (ciri) {
        statusTextEl.innerText = "Mengesan isyarat dalam set sahaja...";
        frameWindow.push(ciri);
        if (frameWindow.length > WINDOW_SIZE) {
            frameWindow.shift();
        }
        const mentah = kesanIsyaratDibenarkan(frameWindow);
        liveSignEl.innerText = tapisIsyaratDibenarkan(mentah);
    } else {
        statusTextEl.innerText = "Pastikan badan atas & tangan kelihatan.";
        liveSignEl.innerText = "...";
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
    statusTextEl.innerText = isRunning ? "Bacaan disambung." : "Bacaan dijeda.";
});

resetBtn.addEventListener('click', () => {
    frameWindow.length = 0;
    recentVotes.length = 0;
    liveSignEl.innerText = "...";
    statusTextEl.innerText = "Tetingkap imbasan diset semula.";
});

navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
})
    .then((stream) => {
        videoElement.srcObject = stream;
        videoElement.onloadedmetadata = () => {
            videoElement.play();
            statusTextEl.innerText = "Kamera sedia. Cuba isyarat HUJAN.";

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
