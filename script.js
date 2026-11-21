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

function titikTanganFrame(f) {
    if (!f) return null;
    if (f.tanganDominan === 'kanan' && f.tanganKananTitik) return f.tanganKananTitik;
    if (f.tanganDominan === 'kiri' && f.tanganKiriTitik) return f.tanganKiriTitik;
    return f.tanganKananTitik || f.tanganKiriTitik || null;
}

function pergelanganFrame(f) {
    if (!f) return null;
    if (f.tanganDominan === 'kanan' && f.pergelanganKanan) return f.pergelanganKanan;
    if (f.tanganDominan === 'kiri' && f.pergelanganKiri) return f.pergelanganKiri;
    return f.pergelanganKanan || f.pergelanganKiri || null;
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
// KOLEKSI ISYARAT YANG DISOKONG (Hanya isyarat ini dibenarkan keluar)
// =====================================================================
const SENARAI_ISYARAT = [
    {
        label: "MAAF",
        jenis: "gerakan",
        padan: (frames) => {
            if (frames.length < 4) return false;
            const s = skala(frames[frames.length - 1]);

            const titikDada = [];
            for (const f of frames) {
                const tangan = titikTanganFrame(f);
                if (!tangan) continue;

                const diDada =
                    Math.abs(tangan.x - f.tengahDadaX) < s * 0.72 &&
                    Math.abs(tangan.y - f.tengahDadaY) < s * 0.65;

                if (diDada) {
                    titikDada.push(tangan);
                }
            }

            if (titikDada.length < 4) return false;

            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            let jarakLaluan = 0;

            for (let i = 0; i < titikDada.length; i++) {
                const p = titikDada[i];
                minX = Math.min(minX, p.x);
                maxX = Math.max(maxX, p.x);
                minY = Math.min(minY, p.y);
                maxY = Math.max(maxY, p.y);

                if (i > 0) {
                    jarakLaluan += jarak(p, titikDada[i - 1]);
                }
            }

            const rentangX = maxX - minX;
            const rentangY = maxY - minY;

            return (
                jarakLaluan > s * 0.22 &&
                (rentangX > s * 0.09 || rentangY > s * 0.09) &&
                rentangX <= s * 0.58 &&
                rentangY <= s * 0.65
            );
        }
    },
    {
        label: "SAYA",
        jenis: "gerakan",
        padan: (frames, jari) => {
            if (frames.length < 4) return false;
            const terkini = frames[frames.length - 1];
            const awal = frames[Math.max(0, frames.length - 5)];
            const s = skala(terkini);

            const titikKini = (jari && jari.pusatTangan) ? jari.pusatTangan : titikTanganFrame(terkini);
            const titikAwal = (awal.jariAktif && awal.jariAktif.pusatTangan) ? awal.jariAktif.pusatTangan : titikTanganFrame(awal);
            if (!titikKini || !titikAwal) return false;

            const dDada = jarak(titikKini, { x: terkini.tengahDadaX, y: terkini.tengahDadaY });
            const dekatDada = dDada < s * 0.68;
            const pegunX = Math.abs(titikKini.x - titikAwal.x) < s * 0.22;
            const pegunY = Math.abs(titikKini.y - titikAwal.y) < s * 0.24;

            return dekatDada && pegunX && pegunY;
        }
    },
    {
        label: "TERIMA KASIH",
        jenis: "gerakan",
        padan: (frames) => {
            if (frames.length < 4) return false;
            const awal = frames[Math.max(0, frames.length - 7)];
            const terkini = frames[frames.length - 1];
            const s = skala(terkini);

            const tanganAwal = titikTanganFrame(awal);
            const tanganKini = titikTanganFrame(terkini);
            if (!awal.hidung || !tanganAwal || !tanganKini) return false;

            const dekatMulutDaguAwal =
                Math.abs(tanganAwal.x - awal.hidung.x) < s * 0.72 &&
                (tanganAwal.y - awal.hidung.y) > s * 0.08 &&
                (tanganAwal.y - awal.hidung.y) < s * 1.00;

            const gerakTurunAtauKeluar =
                (tanganKini.y - tanganAwal.y) > s * 0.36 ||
                Math.abs(tanganKini.x - tanganAwal.x) > s * 0.48;

            return dekatMulutDaguAwal && gerakTurunAtauKeluar;
        }
    },
    {
        label: "MAKAN",
        jenis: "gerakan",
        padan: (frames, jari) => {
            if (frames.length < 4) return false;
            const terkini = frames[frames.length - 1];
            const s = skala(terkini);

            let kiraDekatMulut = 0;
            let minY = Infinity;
            let maxY = -Infinity;

            for (const f of frames) {
                const tangan = titikTanganFrame(f);
                if (!f.hidung || !tangan) continue;

                const dekatMulut =
                    Math.abs(tangan.x - f.hidung.x) < s * 0.52 &&
                    (tangan.y - f.hidung.y) > s * 0.06 &&
                    (tangan.y - f.hidung.y) < s * 0.85;

                if (dekatMulut) {
                    kiraDekatMulut++;
                    minY = Math.min(minY, tangan.y);
                    maxY = Math.max(maxY, tangan.y);
                }
            }

            const adaGerakKeMulut = (maxY - minY) > s * 0.16;
            const jariTidakTerbukaPenuh = jari
                ? !(jari.ibuJari && jari.telunjuk && jari.tengah && jari.manis && jari.kelingking)
                : true;

            return kiraDekatMulut >= 4 && adaGerakKeMulut && jariTidakTerbukaPenuh;
        }
    },
    {
        label: "HUJAN",
        jenis: "gerakan",
        padan: (frames) => {
            if (frames.length < 4) return false;
            const awal = frames[Math.max(0, frames.length - 7)];
            const terkini = frames[frames.length - 1];
            const s = skala(terkini);

            const tanganAwal = titikTanganFrame(awal);
            const tanganKini = titikTanganFrame(terkini);
            if (!tanganAwal || !tanganKini) return false;

            const mulaDiAtas = awal.hidung
                ? tanganAwal.y < (awal.hidung.y + s * 0.65)
                : tanganAwal.y < 0.52;
            const gerakTurun = (tanganKini.y - tanganAwal.y) > s * 0.48;

            return mulaDiAtas && gerakTurun;
        }
    },
    {
        label: "JANGAN",
        jenis: "gerakan",
        padan: (frames) => {
            if (frames.length < 4) return false;
            const awal = frames[Math.max(0, frames.length - 7)];
            const terkini = frames[frames.length - 1];
            const s = skala(terkini);

            const tanganAwal = titikTanganFrame(awal);
            const tanganKini = titikTanganFrame(terkini);
            if (!tanganAwal || !tanganKini) return false;

            const gerakSisiTegas = Math.abs(tanganKini.x - tanganAwal.x) > s * 0.62;
            const bukanDiMulut = awal.hidung
                ? Math.abs(tanganAwal.y - awal.hidung.y) > s * 0.38
                : true;

            return gerakSisiTegas && bukanDiMulut;
        }
    },
    {
        label: "SEMUA",
        jenis: "gerakan",
        padan: (frames) => {
            if (frames.length < 5) return false;
            const s = skala(frames[frames.length - 1]);

            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            let kiraTitik = 0;

            for (const f of frames) {
                const tangan = titikTanganFrame(f);
                if (!tangan) continue;
                kiraTitik++;
                minX = Math.min(minX, tangan.x);
                maxX = Math.max(maxX, tangan.x);
                minY = Math.min(minY, tangan.y);
                maxY = Math.max(maxY, tangan.y);
            }

            if (kiraTitik < 5) return false;

            return (maxX - minX) > s * 0.72 && (maxY - minY) > s * 0.32;
        }
    },
    {
        label: "SAMPAI",
        jenis: "gerakan",
        padan: (frames) => {
            if (frames.length < 5) return false;
            const awal = frames[Math.max(0, frames.length - 8)];
            const pertengahan = frames[Math.floor((awal ? frames.indexOf(awal) : 0) + (frames.length - 1)) / 2];
            const terkini = frames[frames.length - 1];
            const s = skala(terkini);

            const pAwal = titikTanganFrame(awal);
            const pTengah = titikTanganFrame(pertengahan);
            const pKini = titikTanganFrame(terkini);
            if (!pAwal || !pTengah || !pKini) return false;

            const gerakHampiri = jarak(pAwal, pTengah) > s * 0.30;
            const berhentiDiSasaran = jarak(pTengah, pKini) < s * 0.14;

            return gerakHampiri && berhentiDiSasaran;
        }
    },
    {
        label: "WAKTU",
        jenis: "gerakan",
        padan: (frames) => {
            if (frames.length < 4) return false;
            const awal = frames[Math.max(0, frames.length - 6)];
            const terkini = frames[frames.length - 1];
            const s = skala(terkini);

            const jariTitik = terkini.tanganKananTitik || terkini.tanganKiriTitik;
            const pergelangan = pergelanganFrame(terkini);
            const jariAwal = awal.tanganKananTitik || awal.tanganKiriTitik;
            if (!jariTitik || !pergelangan || !jariAwal) return false;

            const dekatPergelangan = jarak(jariTitik, pergelangan) < s * 0.60;
            const adaGerakMenuju = jarak(jariAwal, jariTitik) > s * 0.22;

            return dekatPergelangan && adaGerakMenuju;
        }
    },
    {
        label: "BOLEH",
        jenis: "gerakan",
        padan: (frames) => {
            if (frames.length < 5) return false;
            const s = skala(frames[frames.length - 1]);

            const titik = [];
            for (const f of frames) {
                const tangan = titikTanganFrame(f);
                if (tangan) titik.push(tangan);
            }
            if (titik.length < 5) return false;

            let minY = Infinity, maxY = -Infinity;
            let tukarArahY = 0;
            let prevDy = 0;

            for (let i = 0; i < titik.length; i++) {
                minY = Math.min(minY, titik[i].y);
                maxY = Math.max(maxY, titik[i].y);

                if (i > 0) {
                    const dy = titik[i].y - titik[i - 1].y;
                    if (Math.abs(dy) > s * 0.055) {
                        if (prevDy !== 0 && Math.sign(dy) !== Math.sign(prevDy)) {
                            tukarArahY++;
                        }
                        prevDy = dy;
                    }
                }
            }

            const rentangY = maxY - minY;
            return rentangY > s * 0.18 && rentangY <= s * 0.70 && tukarArahY >= 2;
        }
    },
    {
        label: "MINTA",
        jenis: "gerakan",
        padan: (frames) => {
            if (frames.length < 4) return false;
            const awal = frames[Math.max(0, frames.length - 6)];
            const terkini = frames[frames.length - 1];
            const s = skala(terkini);

            const tanganAwal = titikTanganFrame(awal);
            const tanganKini = titikTanganFrame(terkini);
            if (!tanganAwal || !tanganKini) return false;

            const jarakAwalKeDada = jarak(tanganAwal, { x: awal.tengahDadaX, y: awal.tengahDadaY });
            const jarakKiniKeDada = jarak(tanganKini, { x: terkini.tengahDadaX, y: terkini.tengahDadaY });

            const gerakKeDada = jarakAwalKeDada > s * 0.78 && (jarakAwalKeDada - jarakKiniKeDada) > s * 0.42;
            const sampaiKawasanDada = jarakKiniKeDada < s * 0.85;

            return gerakKeDada && sampaiKawasanDada;
        }
    },
    {
        label: "AMBIL",
        jenis: "gerakan",
        padan: (frames, jari) => {
            if (frames.length < 4) return false;
            const awal = frames[Math.max(0, frames.length - 6)];
            const terkini = frames[frames.length - 1];
            const s = skala(terkini);

            const tanganAwal = titikTanganFrame(awal);
            const tanganKini = titikTanganFrame(terkini);
            if (!tanganAwal || !tanganKini) return false;

            const jarakAwal = jarak(tanganAwal, { x: awal.tengahDadaX, y: awal.tengahDadaY });
            const jarakKini = jarak(tanganKini, { x: terkini.tengahDadaX, y: terkini.tengahDadaY });
            const gerakTarikKeDalam = (jarakAwal - jarakKini) > s * 0.34 && jarakAwal > s * 0.65;

            const jariTidakTerbukaPenuh = jari
                ? !(jari.ibuJari && jari.telunjuk && jari.tengah && jari.manis && jari.kelingking)
                : true;

            return gerakTarikKeDalam && jariTidakTerbukaPenuh;
        }
    },
    {
        label: "AWAK",
        jenis: "gerakan",
        padan: (frames) => {
            if (frames.length < 4) return false;
            const awal = frames[Math.max(0, frames.length - 6)];
            const terkini = frames[frames.length - 1];
            const s = skala(terkini);

            const tanganAwal = titikTanganFrame(awal);
            const tanganKini = titikTanganFrame(terkini);
            if (!tanganAwal || !tanganKini) return false;

            const jarakAwal = jarak(tanganAwal, { x: awal.tengahDadaX, y: awal.tengahDadaY });
            const jarakKini = jarak(tanganKini, { x: terkini.tengahDadaX, y: terkini.tengahDadaY });

            const gerakMenjauhKeDepan = (jarakKini - jarakAwal) > s * 0.40 && jarakKini > s * 0.78;
            const bukanGerakTurunHujan = (tanganKini.y - tanganAwal.y) < s * 0.34;

            return gerakMenjauhKeDepan && bukanGerakTurunHujan;
        }
    },
    {
        label: "KITA",
        jenis: "gerakan",
        padan: (frames) => {
            if (frames.length < 4) return false;
            const awal = frames[Math.max(0, frames.length - 6)];
            const terkini = frames[frames.length - 1];
            const s = skala(terkini);

            const tanganAwal = titikTanganFrame(awal);
            const tanganKini = titikTanganFrame(terkini);
            if (!tanganAwal || !tanganKini) return false;

            const diKawasanDadaAwal =
                Math.abs(tanganAwal.x - awal.tengahDadaX) < s * 0.95 &&
                Math.abs(tanganAwal.y - awal.tengahDadaY) < s * 0.65;

            const diKawasanDadaKini =
                Math.abs(tanganKini.x - terkini.tengahDadaX) < s * 0.95 &&
                Math.abs(tanganKini.y - terkini.tengahDadaY) < s * 0.65;

            const gerakMelintangDada = Math.abs(tanganKini.x - tanganAwal.x) > s * 0.48;

            return diKawasanDadaAwal && diKawasanDadaKini && gerakMelintangDada;
        }
    },
    {
        label: "1",
        jenis: "angka",
        padan: (_frames, jari) =>
            Boolean(jari && !jari.ibuJari && jari.telunjuk && !jari.tengah && !jari.manis && !jari.kelingking)
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
            Boolean(jari && !jari.ibuJari && jari.telunjuk && jari.tengah && jari.manis && jari.kelingking)
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
    tanganKanan: null,
    tanganKiri: null,
    pergelanganKanan: null,
    pergelanganKiri: null,
    pusatTangan: null,
    tengahDadaX: null,
    tengahDadaY: null,
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

    const rawLebarBahu = (bahuKiri && bahuKanan)
        ? Math.max(0.12, jarak(bahuKiri, bahuKanan))
        : (prevSmoothed.lebarBahu || 0.22);

    const lebarBahu = prevSmoothed.lebarBahu
        ? prevSmoothed.lebarBahu + 0.35 * (rawLebarBahu - prevSmoothed.lebarBahu)
        : rawLebarBahu;
    prevSmoothed.lebarBahu = lebarBahu;

    const tanganDominan = kanan ? 'kanan' : (kiri ? 'kiri' : null);

    const rawKanan = kanan ? kanan[9] : (pose ? pose[16] : null);
    const rawKiri = kiri ? kiri[9] : (pose ? pose[15] : null);
    const rawPergelanganKanan = kanan ? kanan[0] : (pose ? pose[16] : null);
    const rawPergelanganKiri = kiri ? kiri[0] : (pose ? pose[15] : null);

    prevSmoothed.tanganKanan = licinTitik(prevSmoothed.tanganKanan, rawKanan);
    prevSmoothed.tanganKiri = licinTitik(prevSmoothed.tanganKiri, rawKiri);
    prevSmoothed.pergelanganKanan = licinTitik(prevSmoothed.pergelanganKanan, rawPergelanganKanan);
    prevSmoothed.pergelanganKiri = licinTitik(prevSmoothed.pergelanganKiri, rawPergelanganKiri);

    const rawDadaX = (bahuKiri && bahuKanan) ? (bahuKiri.x + bahuKanan.x) / 2 : 0.5;
    const rawDadaY = (bahuKiri && bahuKanan) ? (bahuKiri.y + bahuKanan.y) / 2 + (lebarBahu * 0.52) : 0.6;

    prevSmoothed.tengahDadaX = prevSmoothed.tengahDadaX !== null
        ? prevSmoothed.tengahDadaX + 0.35 * (rawDadaX - prevSmoothed.tengahDadaX)
        : rawDadaX;
    prevSmoothed.tengahDadaY = prevSmoothed.tengahDadaY !== null
        ? prevSmoothed.tengahDadaY + 0.35 * (rawDadaY - prevSmoothed.tengahDadaY)
        : rawDadaY;

    const handAktif = kanan || kiri;
    let jariAktif = analisaJari(handAktif);
    if (jariAktif && jariAktif.pusatTangan) {
        prevSmoothed.pusatTangan = licinTitik(prevSmoothed.pusatTangan, jariAktif.pusatTangan);
        jariAktif = { ...jariAktif, pusatTangan: prevSmoothed.pusatTangan };
    }

    return {
        hidung,
        lebarBahu,
        tanganDominan,
        tengahDadaX: prevSmoothed.tengahDadaX,
        tengahDadaY: prevSmoothed.tengahDadaY,
        tanganKananTitik: prevSmoothed.tanganKanan,
        tanganKiriTitik: prevSmoothed.tanganKiri,
        pergelanganKanan: prevSmoothed.pergelanganKanan,
        pergelanganKiri: prevSmoothed.pergelanganKiri,
        jariAktif
    };
}

function tanganSedangBergerak(frames) {
    if (frames.length < 4) return false;
    const awal = frames[Math.max(0, frames.length - 5)];
    const terkini = frames[frames.length - 1];
    const s = skala(terkini);

    const pAwal = titikTanganFrame(awal);
    const pKini = titikTanganFrame(terkini);
    if (!pAwal || !pKini) return false;
    return jarak(pAwal, pKini) > s * 0.32;
}

function kesanIsyaratDibenarkan(frames) {
    if (frames.length < 4) return "...";
    const terkini = frames[frames.length - 1];
    const jari = terkini ? terkini.jariAktif : null;

    const isyaratMaaf = SENARAI_ISYARAT.find(item => item.label === "MAAF");
    if (isyaratMaaf && isyaratMaaf.padan(frames, jari)) {
        return "MAAF";
    }

    const isyaratSaya = SENARAI_ISYARAT.find(item => item.label === "SAYA");
    if (isyaratSaya && !tanganSedangBergerak(frames) && isyaratSaya.padan(frames, jari)) {
        return "SAYA";
    }

    for (const item of SENARAI_ISYARAT) {
        if (item.label === "MAAF" || item.label === "SAYA") continue;
        if (item.jenis === "gerakan" && item.padan(frames, jari)) {
            return item.label;
        }
    }

    if (tanganSedangBergerak(frames)) {
        return "...";
    }

    for (const item of SENARAI_ISYARAT) {
        if (item.jenis === "angka" && item.padan(frames, jari)) {
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
    if (ciri) {
        statusTextEl.innerText = "Mengesan isyarat dalam set sahaja...";
        frameWindow.push(ciri);
        if (frameWindow.length > WINDOW_SIZE) {
            frameWindow.shift();
        }
        const mentah = kesanIsyaratDibenarkan(frameWindow);
        liveSignEl.innerText = tapisIsyaratDibenarkan(mentah, now);
    } else {
        statusTextEl.innerText = "Pastikan badan atas & tangan kelihatan.";
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
        tanganKanan: null,
        tanganKiri: null,
        pergelanganKanan: null,
        pergelanganKiri: null,
        pusatTangan: null,
        tengahDadaX: null,
        tengahDadaY: null,
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
            videoElement.play();
            statusTextEl.innerText = "Kamera sedia. Cuba MAAF, SAYA atau angka 1–10.";

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
