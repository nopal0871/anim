// Base URL API
const BASE_URL = 'https://www.sankavollerei.com/anime/';

// Global state
let currentGenreSlug = '';
let currentAnimeSlug = ''; // Simpan slug anime saat ini untuk kembali ke detail
let currentEpisodeData = null;

// DOM Elements
const homeSection = document.getElementById('homeSection');
const scheduleSection = document.getElementById('scheduleSection');
const completeSection = document.getElementById('completeSection');
const ongoingSection = document.getElementById('ongoingSection');
const genreSection = document.getElementById('genreSection');
const genreAnimeSection = document.getElementById('genreAnimeSection');
const detailSection = document.getElementById('detailSection');
const playerSection = document.getElementById('playerSection');

const ongoingAnimeGrid = document.getElementById('ongoingAnime');
const scheduleAnimeGrid = document.getElementById('scheduleAnime');
const completeAnimeGrid = document.getElementById('completeAnime');
const ongoingListGrid = document.getElementById('ongoingList');
const genreListGrid = document.getElementById('genreList');
const genreAnimeGrid = document.getElementById('genreAnime');
const episodeListContainer = document.getElementById('episodeList');

const completePagination = document.getElementById('completePagination');
const ongoingPagination = document.getElementById('ongoingPagination');
const genrePagination = document.getElementById('genrePagination');

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const navHome = document.getElementById('navHome');
const navSchedule = document.getElementById('navSchedule');
const navComplete = document.getElementById('navComplete');
const navOngoing = document.getElementById('navOngoing');
const navGenre = document.getElementById('navGenre');

const videoPlayer = document.getElementById('videoPlayer');
const playerTitle = document.getElementById('playerTitle');
const closePlayer = document.getElementById('closePlayer');
const skipBack = document.getElementById('skipBack');
const skipForward = document.getElementById('skipForward');

const detailPoster = document.getElementById('detailPoster');
const detailTitle = document.getElementById('detailTitle');
const detailType = document.getElementById('detailType');
const detailStatus = document.getElementById('detailStatus');
const detailRating = document.getElementById('detailRating');
const detailSynopsis = document.getElementById('detailSynopsis');
const backToHome = document.getElementById('backToHome');

// Tampilkan section tertentu
function showSection(sectionId) {
    // Bersihkan player jika keluar dari halaman player
    if (sectionId !== 'playerSection') {
        cleanupPlayer();
    }

    homeSection.style.display = 'none';
    scheduleSection.style.display = 'none';
    completeSection.style.display = 'none';
    ongoingSection.style.display = 'none';
    genreSection.style.display = 'none';
    genreAnimeSection.style.display = 'none';
    detailSection.style.display = 'none';
    playerSection.style.display = 'none';

    document.getElementById(sectionId).style.display = 'block';

    // Update active nav
    navHome.classList.remove('active');
    navSchedule.classList.remove('active');
    navComplete.classList.remove('active');
    navOngoing.classList.remove('active');
    navGenre.classList.remove('active');

    if (sectionId === 'homeSection') navHome.classList.add('active');
    else if (sectionId === 'scheduleSection') navSchedule.classList.add('active');
    else if (sectionId === 'completeSection') navComplete.classList.add('active');
    else if (sectionId === 'ongoingSection') navOngoing.classList.add('active');
    else if (sectionId === 'genreSection') navGenre.classList.add('active');
}

// Fungsi untuk membersihkan player
function cleanupPlayer() {
    const iframe = document.querySelector('#videoPlayer + iframe');
    if (iframe) {
        // Hentikan iframe dengan mengosongkan src-nya
        iframe.src = 'about:blank';
        iframe.removeAttribute('src');
        // Tunggu sebentar lalu hapus
        setTimeout(() => {
            if (iframe.parentNode) {
                iframe.remove();
            }
        }, 100);
    }

    const navEl = document.getElementById('episodeNav');
    if (navEl) navEl.remove();

    const backButton = document.getElementById('playerBackButton');
    if (backButton) backButton.remove();

    // Untuk elemen <video> asli (jika digunakan di masa depan)
    videoPlayer.pause();
    videoPlayer.src = '';

    skipBack.style.display = 'block';
    skipForward.style.display = 'block';
}

// Fetch Data
async function fetchData(endpoint, params = {}) {
    try {
        let url = BASE_URL + endpoint;
        if (Object.keys(params).length > 0) {
            const queryString = new URLSearchParams(params).toString();
            url += '?' + queryString;
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error('Fetch error:', err);
        return null;
    }
}

// Render Grid
function renderAnimeGrid(container, list) {
    container.innerHTML = '';
    if (!list || list.length === 0) {
        container.innerHTML = '<div class="error">Tidak ada data.</div>';
        return;
    }
    list.forEach(item => {
        const card = document.createElement('div');
        card.className = 'anime-card';
        card.dataset.slug = item.slug;
        const poster = item.poster || 'https://via.placeholder.com/300x400?text=No+Image';
        const title = item.title || '—';
        const ep = item.current_episode || '—';
        const day = item.release_day || '—';
        card.innerHTML = `
            <img src="${poster}" alt="${title}" class="anime-poster">
            <div class="anime-info">
                <div class="anime-title">${title}</div>
                <div class="anime-episode">${ep}</div>
                <div class="anime-release-day">${day}</div>
            </div>
        `;
        card.addEventListener('click', () => {
            loadAnimeDetail(item.slug);
        });
        container.appendChild(card);
    });
}

// Render Episode List
function renderEpisodeList(episodes) {
    episodeListContainer.innerHTML = '';
    if (!episodes || episodes.length === 0) {
        episodeListContainer.innerHTML = '<div class="error">Tidak ada episode.</div>';
        return;
    }
    episodes.forEach(ep => {
        const el = document.createElement('div');
        el.className = 'episode-item';
        el.dataset.slug = ep.slug;
        el.innerHTML = `
            <span class="episode-number">${ep.episode_number || '?'}</span>
            <span>${ep.episode || 'Episode'}</span>
        `;
        el.addEventListener('click', () => {
            loadEpisode(ep.slug);
        });
        episodeListContainer.appendChild(el);
    });
}

// Pagination
function renderPagination(container, page, total, cb) {
    container.innerHTML = '';
    if (total <= 1) return;
    if (page > 1) {
        const btn = document.createElement('button');
        btn.className = 'page-btn';
        btn.textContent = 'Sebelumnya';
        btn.onclick = () => cb(page - 1);
        container.appendChild(btn);
    }
    for (let i = 1; i <= total; i++) {
        const btn = document.createElement('button');
        btn.className = 'page-btn';
        btn.textContent = i;
        if (i === page) btn.classList.add('active');
        btn.onclick = () => cb(i);
        container.appendChild(btn);
    }
    if (page < total) {
        const btn = document.createElement('button');
        btn.className = 'page-btn';
        btn.textContent = 'Berikutnya';
        btn.onclick = () => cb(page + 1);
        container.appendChild(btn);
    }
}

function addResolutionSelector(container, mp4Urls) {
    const resDiv = document.createElement('div');
    resDiv.style.marginTop = '10px';
    resDiv.style.display = 'flex';
    resDiv.style.gap = '8px';
    resDiv.style.flexWrap = 'wrap';

    mp4Urls.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'control-btn';
        btn.textContent = item.resolution;
        btn.style.fontSize = '0.9rem';
        btn.style.padding = '6px 10px';
        btn.onclick = () => {
            videoPlayer.pause();
            videoPlayer.src = item.url;
            videoPlayer.load();
            // Opsional: tandai resolusi aktif
            const allBtns = resDiv.querySelectorAll('button');
            allBtns.forEach(b => b.style.opacity = '0.7');
            btn.style.opacity = '1';
        };
        resDiv.appendChild(btn);
    });

    container.appendChild(resDiv);
}
// Load Pages
async function loadHome() {
    showSection('homeSection');
    const data = await fetchData('home');
    if (data?.status === 'success' && data.data?.ongoing_anime) {
        renderAnimeGrid(ongoingAnimeGrid, data.data.ongoing_anime);
    } else {
        ongoingAnimeGrid.innerHTML = '<div class="error">Gagal muat home.</div>';
    }
}

async function loadSchedule() {
    showSection('scheduleSection');
    const data = await fetchData('schedule');
    if (data?.status === 'success' && data.data?.schedule) {
        renderAnimeGrid(scheduleAnimeGrid, data.data.schedule);
    } else {
        scheduleAnimeGrid.innerHTML = '<div class="error">Gagal muat jadwal.</div>';
    }
}

async function loadCompleteAnime(page = 1) {
    showSection('completeSection');
    const data = await fetchData('complete-anime', { page });
    if (data?.status === 'success' && data.data?.completeAnimeData) {
        renderAnimeGrid(completeAnimeGrid, data.data.completeAnimeData);
        if (data.data.paginationData?.last_visible_page) {
            renderPagination(completePagination, page, data.data.paginationData.last_visible_page, loadCompleteAnime);
        }
    } else {
        completeAnimeGrid.innerHTML = '<div class="error">Gagal muat tamat.</div>';
    }
}

async function loadOngoingAnime(page = 1) {
    showSection('ongoingSection');
    const data = await fetchData('ongoing-anime', { page });
    if (data?.status === 'success' && data.data?.ongoingAnimeData) {
        renderAnimeGrid(ongoingListGrid, data.data.ongoingAnimeData);
        if (data.data.paginationData?.last_visible_page) {
            renderPagination(ongoingPagination, page, data.data.paginationData.last_visible_page, loadOngoingAnime);
        }
    } else {
        ongoingListGrid.innerHTML = '<div class="error">Gagal muat ongoing.</div>';
    }
}

async function loadGenres() {
    showSection('genreSection');
    const data = await fetchData('genre');
    if (data?.status === 'success' && data.data?.genres) {
        genreListGrid.innerHTML = '';
        data.data.genres.forEach(genre => {
            const card = document.createElement('div');
            card.className = 'anime-card';
            card.dataset.slug = genre.slug;
            card.innerHTML = `<div class="anime-info"><div class="anime-title">${genre.name}</div></div>`;
            card.addEventListener('click', () => {
                loadAnimeByGenre(genre.slug);
            });
            genreListGrid.appendChild(card);
        });
    } else {
        genreListGrid.innerHTML = '<div class="error">Gagal muat genre.</div>';
    }
}

async function loadAnimeByGenre(slug, page = 1) {
    showSection('genreAnimeSection');
    currentGenreSlug = slug;
    const data = await fetchData(`genre/${slug}`, { page });
    if (data?.status === 'success' && data.data?.genreAnimeData) {
        renderAnimeGrid(genreAnimeGrid, data.data.genreAnimeData);
        if (data.data.paginationData?.last_visible_page) {
            renderPagination(genrePagination, page, data.data.paginationData.last_visible_page, (p) => loadAnimeByGenre(slug, p));
        }
        document.getElementById('genreTitle').textContent = `Genre: ${data.data.genre_name || '—'}`;
    } else {
        genreAnimeGrid.innerHTML = '<div class="error">Gagal muat anime genre.</div>';
    }
}

async function loadAnimeDetail(slug) {
    showSection('detailSection');
    currentAnimeSlug = slug; // Simpan slug untuk kembali nanti
    const data = await fetchData(`anime/${slug}`);
    if (data?.status === 'success' && data.data) {
        const a = data.data;
        detailPoster.src = a.poster || 'https://via.placeholder.com/300x400?text=No+Image';
        detailTitle.textContent = a.title || '—';
        detailType.textContent = a.type || 'TV';
        detailStatus.textContent = a.status || '—';
        detailRating.textContent = `⭐ ${a.rating || '0.0'}`;
        detailSynopsis.textContent = a.synopsis || 'Sinopsis tidak tersedia.';
        renderEpisodeList(a.episode_lists || []);
    } else {
        detailSection.innerHTML = '<div class="error">Gagal muat detail.</div>';
    }
}

async function loadEpisode(slug) {
    const data = await fetchData(`episode/${slug}`);
    if (data?.status === 'success' && data.data) {
        const ep = data.data;
        currentEpisodeData = ep;

        // Ambil semua link MP4 yang valid
        let mp4Urls = [];
        if (ep.download_urls?.mp4?.urls && Array.isArray(ep.download_urls.mp4.urls)) {
            mp4Urls = ep.download_urls.mp4.urls
                .filter(u => u.url && u.url.includes('.mp4') && u.resolution)
                .map(u => ({ url: u.url, resolution: u.resolution }));
        }

        showSection('playerSection');
        playerTitle.textContent = ep.episode || 'Episode';

        const container = videoPlayer.parentElement;
        container.innerHTML = '';

        // Tombol Back
        const backButton = document.createElement('button');
        backButton.id = 'playerBackButton';
        backButton.className = 'control-btn';
        backButton.textContent = '← Kembali ke Detail';
        backButton.style.marginBottom = '10px';
        backButton.onclick = () => loadAnimeDetail(currentAnimeSlug);
        container.appendChild(backButton);

        if (mp4Urls.length > 0) {
            // Urutkan resolusi dari tertinggi ke terendah (opsional)
            mp4Urls.sort((a, b) => {
                const resA = parseInt(a.resolution) || 0;
                const resB = parseInt(b.resolution) || 0;
                return resB - resA;
            });

            // Gunakan resolusi tertinggi sebagai default
            const defaultUrl = mp4Urls[0].url;
            videoPlayer.src = defaultUrl;
            videoPlayer.controls = true;
            videoPlayer.style.display = 'block';
            container.appendChild(videoPlayer);

            // Tampilkan tombol skip
            skipBack.style.display = 'inline-block';
            skipForward.style.display = 'inline-block';

            // Tambahkan pemilih resolusi
            addResolutionSelector(container, mp4Urls);

            // Navigasi episode
            addEpisodeNavigation(ep);
        } else {
            // Fallback: tidak ada MP4 langsung
            videoPlayer.style.display = 'none';
            skipBack.style.display = 'none';
            skipForward.style.display = 'none';

            const openBtn = document.createElement('button');
            openBtn.id = 'openInNewTab';
            openBtn.className = 'control-btn';
            openBtn.textContent = '🎬 Buka Video di Tab Baru';
            openBtn.onclick = () => {
                let url = ep.stream_url || (ep.download_urls?.mp4?.urls?.[0]?.url);
                if (url) window.open(url, '_blank');
            };
            container.appendChild(openBtn);

            addEpisodeNavigation(ep);
        }
    } else {
        alert('Gagal muat episode.');
    }
}

// Search
async function searchAnime(keyword) {
    if (!keyword.trim()) return alert('Masukkan kata kunci.');
    const data = await fetchData(`search/${encodeURIComponent(keyword)}`);
    if (Array.isArray(data?.data) && data.data.length > 0) {
        showSection('homeSection');
        document.querySelector('.section-title').textContent = `Hasil: "${keyword}"`;
        renderAnimeGrid(ongoingAnimeGrid, data.data);
    } else {
        ongoingAnimeGrid.innerHTML = '<div class="error">Tidak ada hasil.</div>';
    }
}

// Event Listeners
navHome.onclick = () => loadHome();
navSchedule.onclick = () => loadSchedule();
navComplete.onclick = () => loadCompleteAnime(1);
navOngoing.onclick = () => loadOngoingAnime(1);
navGenre.onclick = () => loadGenres();
backToHome.onclick = () => loadHome();
closePlayer.onclick = () => loadAnimeDetail(currentAnimeSlug);

searchBtn.onclick = () => searchAnime(searchInput.value.trim());
searchInput.onkeypress = (e) => {
    if (e.key === 'Enter') searchAnime(searchInput.value.trim());
};

// Load Home saat pertama kali
document.addEventListener('DOMContentLoaded', () => {
    loadHome();
});
