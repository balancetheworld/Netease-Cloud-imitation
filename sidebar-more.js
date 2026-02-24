const moreToggle = document.getElementById('moreToggle');
const moreItems = document.getElementById('moreItems');
const moreArrow = document.getElementById('moreArrow');
const collapseToggle = document.getElementById('collapseToggle');

// 更多展开键
moreToggle.addEventListener('click', function () {
    moreItems.style.display = 'block';  // 隐藏菜单
    moreToggle.style.display = 'none';  // 隐藏更多按钮
    moreArrow.classList.add('rotated'); // 箭头旋转
});

// 收起折叠
collapseToggle.addEventListener('click', function () {
    moreItems.style.display = 'none';   // 隐藏菜单
    moreToggle.style.display = 'flex';  // 重新显示更多按钮
    moreArrow.classList.remove('rotated');
});

const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');

searchInput.addEventListener('input', function () {
    clearBtn.style.display = this.value.length > 0 ? 'block' : 'none';
});

clearBtn.addEventListener('click', function () {
    searchInput.value = '';
    searchInput.focus();
    clearBtn.style.display = 'none';
});

// 返回按钮
document.querySelector('.back-icon').addEventListener('click', () => {
    alert('返回点击');
});

(function () {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearBtn');
    const suggestionsPanel = document.getElementById('suggestionsPanel');
    const rowItems = document.querySelectorAll('.row-item');
    const viewMore = document.getElementById('viewMore');
    const backBtn = document.getElementById('backBtn');
    const moreBtn = document.getElementById('moreBtn');

    // 点击搜索框可以显示面板
    searchInput.addEventListener('focus', function () {
        suggestionsPanel.style.display = 'block';
    });

    // 清除按钮
    searchInput.addEventListener('input', function () {
        const hasValue = this.value.length > 0;
        clearBtn.style.display = hasValue ? 'block' : 'none';
        suggestionsPanel.style.display = 'block';
    });

    // 清除按钮点击
    clearBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        searchInput.value = '';
        searchInput.focus();
        clearBtn.style.display = 'none';
    });

    // 点击行内项目
    rowItems.forEach(item => {
        item.addEventListener('click', function () {
            const textEl = this.querySelector('.row-text');
            const value = textEl.textContent;
            const fullValue = this.dataset.value || value;

            searchInput.value = fullValue;
            clearBtn.style.display = 'block';
            if (window.player) {
                window.player.searchMusic(fullValue);
            } else {
                performSearch(fullValue);
            }
            suggestionsPanel.style.display = 'none';
        });
    });

    // 回车搜索
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            if (window.player) {
                window.player.searchMusic(this.value);
            } else {
                performSearch(this.value);
            }
            suggestionsPanel.style.display = 'none';
        }
    });

    // 执行搜索
    function performSearch(query) {
        if (query.trim()) {
            alert(`搜索: ${query}`);
            console.log('搜索:', query);
        } else {
            alert('请输入搜索内容');
        }
    }

    // 点其他区域关闭面板
    document.addEventListener('click', function (e) {
        const searchContainer = document.querySelector('.search-container');
        const panel = document.getElementById('suggestionsPanel');

        if (!searchContainer.contains(e.target) && panel.style.display === 'block') {
            panel.style.display = 'none';
        }
    });

    // 点面板内部时不关闭
    suggestionsPanel.addEventListener('click', function (e) {
        e.stopPropagation();
    });

    // 返回按钮
    backBtn.addEventListener('click', function () {
        alert('返回');
    });

    // 更多按钮
    moreBtn.addEventListener('click', function () {
        alert('更多菜单');
    });

    // 初始化
    clearBtn.style.display = 'none';
    suggestionsPanel.style.display = 'none';
})();

//  播放器类完整版，接入API
class MusicPlayer {
    constructor() {
        this.apiBase = 'http://localhost:3000';

        // 检查音频元素
        let audioEl = document.getElementById('audioPlayer');
        if (!audioEl) {
            audioEl = document.createElement('audio');
            audioEl.id = 'audioPlayer';
            audioEl.preload = 'metadata';
            document.body.appendChild(audioEl);
        }
        this.audio = audioEl;

        this.isFullscreen = false;
        this.isDragging = false;
        this.dragType = null;
        this.isMuted = false;
        this.playlist = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.volume = 0.7;
        this.currentLyrics = [];

        // 绑定事件处理函数
        this.onMouseMove = null;
        this.onMouseUp = null;

        this.init();
        this.bindEvents();


        this.fetchPlaylists();

        // 默认搜索值林俊杰
        setTimeout(() => {
            this.searchMusic('林俊杰');
        }, 1000);
    }

    init() {
        this.audio.volume = this.volume;

        this.contentArea = document.getElementById('contentArea') || document.querySelector('.main-content');

        // 进度条元素
        this.miniProgressBar = document.getElementById('miniProgressBar');
        this.fullscreenProgressBar = document.getElementById('fullscreenProgressBar');
        this.miniProgressCurrent = document.getElementById('miniProgressCurrent');
        this.fullscreenProgressCurrent = document.getElementById('fullscreenProgressCurrent');

        // 音量元素
        this.miniVolumeSlider = document.getElementById('miniVolumeSlider');
        this.miniVolumeIcon = document.getElementById('miniVolumeIcon');
        this.miniVolumeCurrent = document.getElementById('miniVolumeCurrent');

        this.updateVolumeUI();
    }

    bindEvents() {
        // 播放控制按钮
        const miniPlayBtn = document.getElementById('miniPlayPauseBtn');
        if (miniPlayBtn) {
            miniPlayBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePlay();
            });
        }

        const miniPrevBtn = document.getElementById('miniPrevBtn');
        if (miniPrevBtn) {
            miniPrevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.prev();
            });
        }

        const miniNextBtn = document.getElementById('miniNextBtn');
        if (miniNextBtn) {
            miniNextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.next();
            });
        }

        const fullscreenPlayBtn = document.getElementById('fullscreenPlayPauseBtn');
        if (fullscreenPlayBtn) {
            fullscreenPlayBtn.addEventListener('click', () => this.togglePlay());
        }

        const fullscreenPrevBtn = document.getElementById('fullscreenPrevBtn');
        if (fullscreenPrevBtn) {
            fullscreenPrevBtn.addEventListener('click', () => this.prev());
        }

        const fullscreenNextBtn = document.getElementById('fullscreenNextBtn');
        if (fullscreenNextBtn) {
            fullscreenNextBtn.addEventListener('click', () => this.next());
        }

        // 进度条事件
        if (this.miniProgressBar) {
            this.setupProgressBar(this.miniProgressBar, 'mini');
        }
        if (this.fullscreenProgressBar) {
            this.setupProgressBar(this.fullscreenProgressBar, 'fullscreen');
        }

        // 音量控制
        if (this.miniVolumeSlider) {
            this.miniVolumeSlider.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setVolume(e);
            });
        }

        if (this.miniVolumeIcon) {
            this.miniVolumeIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMute();
            });
        }

        // 音频事件
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateTotalTime());
        this.audio.addEventListener('ended', () => this.next());

        // 全屏切换
        const miniPlayer = document.getElementById('miniPlayer');
        if (miniPlayer) {
            miniPlayer.addEventListener('click', (e) => {
                if (!e.target.closest('button') && !e.target.closest('.mini-volume')) {
                    this.openFullscreen();
                }
            });
        }

        const fullscreenBack = document.getElementById('fullscreenBack');
        if (fullscreenBack) {
            fullscreenBack.addEventListener('click', () => this.closeFullscreen());
        }

        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.closeFullscreen());
        }

        // 全局拖动事件
        this.onMouseMove = (e) => {
            if (this.isDragging) {
                e.preventDefault();
                if (this.dragType === 'mini' && this.miniProgressBar) {
                    this.seek(e, 'mini');
                } else if (this.dragType === 'fullscreen' && this.fullscreenProgressBar) {
                    this.seek(e, 'fullscreen');
                }
            }
        };

        this.onMouseUp = () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.dragType = null;
            }
        };

        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
    }

    // 搜索音乐,定义异步函数
    async searchMusic(keyword) {
        if (!keyword.trim()) return;

        try {
            console.log(`搜索: ${keyword}`);

            const response = await fetch(`${this.apiBase}/search?keywords=${encodeURIComponent(keyword)}`);
            const data = await response.json();

            if (data.code === 200 && data.result.songs) {
                const songs = data.result.songs.slice(0, 10);

                this.playlist = [];
                for (let song of songs) {
                    try {
                        // 歌曲详情
                        const detailResponse = await fetch(`${this.apiBase}/song/detail?ids=${song.id}`);
                        const detailData = await detailResponse.json();

                        if (detailData.code === 200 && detailData.songs.length > 0) {
                            const songDetail = detailData.songs[0];

                            // 播放URL
                            const urlResponse = await fetch(`${this.apiBase}/song/url?id=${song.id}`);
                            const urlData = await urlResponse.json();

                            if (urlData.code === 200 && urlData.data.length > 0) {
                                const songUrl = urlData.data[0].url;

                                if (songUrl) {
                                    this.playlist.push({
                                        id: song.id,
                                        title: song.name,
                                        artist: song.artists.map(a => a.name).join('/'),
                                        album: song.album.name,
                                        src: songUrl,
                                        cover: song.album.picUrl || `https://picsum.photos/340/340?random=${song.id}`,
                                        duration: this.formatTime(songDetail.duration / 1000)
                                    });
                                }
                            }
                        }
                    } catch (e) {
                        console.error('获取歌曲详情失败:', e);
                    }
                }

                if (this.playlist.length > 0) {
                    this.currentIndex = 0;
                    this.loadSong(0);

                    // this.renderPlaylist();
                    if (this.playlist.length > 0) {
                        this.currentIndex = 0;
                        this.loadSong(0);

                        // 只渲染最新音乐区域
                        const latestRow = document.getElementById('latestMusicRow');
                        if (latestRow) {
                            latestRow.innerHTML = this.playlist.map((song, index) => `
            <div class="music-row-item" data-index="${index}" onclick="player.playSong(${index})">
                <div class="music-row-cover">
                    <img src="${song.cover}" style="width:100%;height:100%;object-fit:cover;" alt="${song.title}">
                </div>
                <div class="music-row-info">
                    <div class="song-name">${song.title}</div>
                    <div class="artist">${song.artist}</div>
                </div>
            </div>
        `).join('');
                        }
                    } else {
                        alert('未找到可播放的歌曲');
                    }
                } else {
                    alert('未找到可播放的歌曲');
                }
            } else {
                alert('搜索失败');
            }
        } catch (error) {
            console.error('搜索出错:', error);
            alert('搜索失败，请检查API服务是否启动');
        }
    }

    renderPlaylist() {
        const latestRow = document.getElementById('latestMusicRow');
        if (latestRow && this.playlist.length > 0) {
            latestRow.innerHTML = this.playlist.map((song, index) => `
            <div class="music-row-item" data-index="${index}" onclick="player.playSong(${index})">
                <div class="music-row-cover">
                    <img src="${song.cover}" style="width:100%;height:100%;object-fit:cover;" alt="${song.title}">
                </div>
                <div class="music-row-info">
                    <div class="song-name">${song.title}</div>
                    <div class="artist">${song.artist}</div>
                </div>
            </div>
        `).join('');
        }
    }

    // 播放指定索引的歌曲
    playSong(index) {
        this.currentIndex = index;
        this.loadSong(index);
        this.audio.play().catch(e => console.log('播放失败:', e));
        this.isPlaying = true;
        this.updatePlayIcons('fa-pause');
    }





    // 设置进度条
    setupProgressBar(progressBar, type) {
        if (!progressBar) return;

        progressBar.addEventListener('click', (e) => {
            e.stopPropagation();
            this.seek(e, type);
        });

        progressBar.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.isDragging = true;
            this.dragType = type;
            this.seek(e, type);
        });

        progressBar.addEventListener('mouseup', (e) => {
            e.stopPropagation();
        });
    }

    seek(e, type) {
        if (!this.audio.duration) return;

        const progressBar = type === 'mini' ? this.miniProgressBar : this.fullscreenProgressBar;
        if (!progressBar) return;

        const rect = progressBar.getBoundingClientRect();

        let clientX = e.clientX;
        if (clientX === undefined && e.touches) {
            clientX = e.touches[0].clientX;
        }

        let percent = (clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));

        const seekTime = percent * this.audio.duration;
        this.audio.currentTime = seekTime;
        this.updateProgressUI(percent, seekTime);
    }

    updateProgressUI(percent, currentTime) {
        if (this.miniProgressCurrent) {
            this.miniProgressCurrent.style.width = (percent * 100) + '%';
        }
        if (this.fullscreenProgressCurrent) {
            this.fullscreenProgressCurrent.style.width = (percent * 100) + '%';
        }

        const timeStr = this.formatTime(currentTime);
        const miniCurrent = document.getElementById('miniCurrentTime');
        const fullscreenCurrent = document.getElementById('fullscreenCurrentTime');

        if (miniCurrent) miniCurrent.textContent = timeStr;
        if (fullscreenCurrent) fullscreenCurrent.textContent = timeStr;
    }

    updateProgress() {
        if (this.isDragging) return;

        if (!this.audio.duration || isNaN(this.audio.duration)) return;

        const current = this.audio.currentTime;
        const duration = this.audio.duration;
        const percent = (current / duration) * 100;
        const timeStr = this.formatTime(current);

        if (this.miniProgressCurrent) {
            this.miniProgressCurrent.style.width = percent + '%';
        }
        if (this.fullscreenProgressCurrent) {
            this.fullscreenProgressCurrent.style.width = percent + '%';
        }

        const miniCurrent = document.getElementById('miniCurrentTime');
        const fullscreenCurrent = document.getElementById('fullscreenCurrentTime');

        if (miniCurrent) miniCurrent.textContent = timeStr;
        if (fullscreenCurrent) fullscreenCurrent.textContent = timeStr;

        this.updateLyricHighlight(current);
    }

    updateTotalTime() {
        const timeStr = this.formatTime(this.audio.duration);
        const miniTotal = document.getElementById('miniTotalTime');
        const fullscreenTotal = document.getElementById('fullscreenTotalTime');

        if (miniTotal) miniTotal.textContent = timeStr;
        if (fullscreenTotal) fullscreenTotal.textContent = timeStr;
    }

    loadSong(index) {
        if (!this.playlist[index]) return;

        const song = this.playlist[index];
        this.currentIndex = index;

        this.audio.src = song.src;
        this.audio.load();

        this.updateSongInfo(song);

        // 获取歌词
        this.fetchLyrics(song.id);
    }

    async fetchLyrics(songId) {
        try {
            const response = await fetch(`${this.apiBase}/lyric?id=${songId}`);
            const data = await response.json();

            if (data.code === 200 && data.lrc && data.lrc.lyric) {
                this.parseLyrics(data.lrc.lyric);
            } else {
                this.renderDefaultLyrics();
            }
        } catch (error) {
            console.error('获取歌词失败:', error);
            this.renderDefaultLyrics();
        }
    }

    parseLyrics(lyricStr) {
        const lines = lyricStr.split('\n');
        const lyrics = [];

        lines.forEach(line => {
            const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
            if (match) {
                const minutes = parseInt(match[1]);
                const seconds = parseInt(match[2]);
                const milliseconds = parseInt(match[3]);
                const time = minutes * 60 + seconds + milliseconds / 1000;
                const text = match[4].trim();

                if (text) {
                    lyrics.push({ time, text });
                }
            }
        });

        if (lyrics.length > 0) {
            this.renderLyrics(lyrics);
        } else {
            this.renderDefaultLyrics();
        }
    }

    renderLyrics(lyricsData) {
        const container = document.getElementById('fullscreenLyricsContainer');
        if (!container) return;

        this.currentLyrics = lyricsData;

        container.innerHTML = lyricsData.map(lyric =>
            `<div class="fullscreen-lyric-line" data-time="${lyric.time}">${lyric.text}</div>`
        ).join('');

        container.querySelectorAll('.fullscreen-lyric-line').forEach(line => {
            line.addEventListener('click', () => {
                const time = parseFloat(line.dataset.time);
                this.audio.currentTime = time;
            });
        });
    }

    renderDefaultLyrics() {
        const container = document.getElementById('fullscreenLyricsContainer');
        if (!container) return;

        const lyricsData = [
            { time: 0, text: '暂无歌词' },
            { time: 1, text: '正在加载歌词...' }
        ];

        this.currentLyrics = lyricsData;

        container.innerHTML = lyricsData.map(lyric =>
            `<div class="fullscreen-lyric-line" data-time="${lyric.time}">${lyric.text}</div>`
        ).join('');
    }

    updateLyricHighlight(currentTime) {
        if (!this.currentLyrics) return;

        const lyrics = document.querySelectorAll('.fullscreen-lyric-line');
        if (lyrics.length === 0) return;

        let activeIndex = -1;

        for (let i = 0; i < this.currentLyrics.length; i++) {
            if (currentTime >= this.currentLyrics[i].time) {
                activeIndex = i;
            } else {
                break;
            }
        }

        lyrics.forEach((line, index) => {
            if (index === activeIndex) {
                line.classList.add('active');
                line.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                line.classList.remove('active');
            }
        });
    }

    updateSongInfo(song) {
        const miniTitle = document.getElementById('miniTitle');
        const miniArtist = document.getElementById('miniArtist');
        const miniCover = document.getElementById('miniCover');
        const miniTotal = document.getElementById('miniTotalTime');

        const detailTitle = document.getElementById('detailTitle');
        const fullscreenArtist = document.getElementById('fullscreenArtist');
        const fullscreenAlbum = document.getElementById('fullscreenAlbum');
        const detailCover = document.getElementById('detailCover');
        const fullscreenTotal = document.getElementById('fullscreenTotalTime');

        if (miniTitle) miniTitle.textContent = song.title;
        if (miniArtist) miniArtist.textContent = song.artist;
        if (miniCover) miniCover.src = song.cover;
        if (miniTotal) miniTotal.textContent = song.duration;

        if (detailTitle) detailTitle.textContent = song.title;
        if (fullscreenArtist) fullscreenArtist.textContent = song.artist;
        if (fullscreenAlbum) fullscreenAlbum.textContent = song.album;
        if (detailCover) detailCover.src = song.cover;
        if (fullscreenTotal) fullscreenTotal.textContent = song.duration;
    }

    togglePlay() {
        if (this.isPlaying) {
            this.audio.pause();
            this.updatePlayIcons('fa-play');
        } else {
            this.audio.play().catch(e => console.log('播放失败:', e));
            this.updatePlayIcons('fa-pause');
        }
        this.isPlaying = !this.isPlaying;
    }

    updatePlayIcons(iconClass) {
        const miniIcon = document.getElementById('miniPlayIcon');
        const fullscreenIcon = document.getElementById('fullscreenPlayIcon');

        if (miniIcon) miniIcon.className = `fas ${iconClass}`;
        if (fullscreenIcon) fullscreenIcon.className = `fas ${iconClass}`;
    }

    prev() {
        if (this.playlist.length === 0) return;
        let newIndex = this.currentIndex - 1;
        if (newIndex < 0) newIndex = this.playlist.length - 1;
        this.loadSong(newIndex);
        if (this.isPlaying) {
            this.audio.play().catch(e => console.log('播放失败:', e));
        }
    }

    next() {
        if (this.playlist.length === 0) return;
        let newIndex = this.currentIndex + 1;
        if (newIndex >= this.playlist.length) newIndex = 0;
        this.loadSong(newIndex);
        if (this.isPlaying) {
            this.audio.play().catch(e => console.log('播放失败:', e));
        }
    }

    setVolume(e) {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percent = Math.min(1, Math.max(0, clickX / rect.width));

        this.volume = percent;
        this.audio.volume = percent;
        this.updateVolumeUI();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.audio.muted = this.isMuted;
        this.updateVolumeUI();
    }

    updateVolumeUI() {
        if (!this.miniVolumeCurrent) return;

        const percent = this.isMuted ? 0 : this.volume * 100;
        this.miniVolumeCurrent.style.width = percent + '%';

        if (!this.miniVolumeIcon) return;

        if (this.isMuted || this.volume === 0) {
            this.miniVolumeIcon.className = 'fas fa-volume-mute';
        } else if (this.volume < 0.5) {
            this.miniVolumeIcon.className = 'fas fa-volume-down';
        } else {
            this.miniVolumeIcon.className = 'fas fa-volume-up';
        }
    }

    openFullscreen() {
        this.isFullscreen = true;
        const fullscreenPlayer = document.getElementById('fullscreenPlayer');
        const overlay = document.getElementById('overlay');

        if (fullscreenPlayer) fullscreenPlayer.classList.add('active');
        if (overlay) overlay.classList.add('active');
        if (this.contentArea) this.contentArea.style.filter = 'blur(4px)';
    }

    closeFullscreen() {
        this.isFullscreen = false;
        const fullscreenPlayer = document.getElementById('fullscreenPlayer');
        const overlay = document.getElementById('overlay');

        if (fullscreenPlayer) fullscreenPlayer.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        if (this.contentArea) this.contentArea.style.filter = 'none';
    }

    formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' + secs : secs}`;
    }



    // 获取官方歌单
    async fetchPlaylists() {
        try {
            // 获取多个歌单（这里用一些热门歌单ID）
            const playlistIds = [
                '3778678',  // 热歌榜
                '3779629',  // 新歌榜
                '2809577409', // 电子音乐
                '2884035',  // 原创歌曲榜
                '19723756', // 云音乐飙升榜
                '3778678'   // 热歌榜（重复用于演示）
            ];

            const playlists = [];

            // 只取前6个歌单（和你的卡片数量匹配）
            for (let i = 0; i < 6; i++) {
                try {
                    const response = await fetch(`${this.apiBase}/playlist/detail?id=${playlistIds[i]}`);
                    const data = await response.json();

                    if (data.code === 200 && data.playlist) {
                        const playlist = data.playlist;

                        // 获取歌单的前3首歌曲用于显示
                        const songs = playlist.tracks.slice(0, 3).map(track => track.name);

                        playlists.push({
                            id: playlist.id,
                            name: playlist.name,
                            cover: playlist.coverImgUrl,
                            playCount: this.formatPlayCount(playlist.playCount),
                            tracks: songs,
                            trackCount: playlist.trackCount
                        });
                    }
                } catch (e) {
                    console.error('获取歌单失败:', e);
                }
            }

            this.renderPlaylists(playlists);
        } catch (error) {
            console.error('获取歌单列表失败:', error);
        }
    }
    // 播放歌单第一首歌
    async playPlaylistFirst(playlistId) {
        try {
            const response = await fetch(`${this.apiBase}/playlist/detail?id=${playlistId}`);
            const data = await response.json();

            if (data.code === 200 && data.playlist && data.playlist.tracks.length > 0) {
                const firstSong = data.playlist.tracks[0];

                // 获取播放URL
                const urlResponse = await fetch(`${this.apiBase}/song/url?id=${firstSong.id}`);
                const urlData = await urlResponse.json();

                if (urlData.code === 200 && urlData.data.length > 0) {
                    const songUrl = urlData.data[0].url;

                    if (songUrl) {
                        // 创建播放列表（歌单的所有歌曲）
                        this.playlist = data.playlist.tracks.map(track => ({
                            id: track.id,
                            title: track.name,
                            artist: track.artists.map(a => a.name).join('/'),
                            album: track.album.name,
                            cover: track.album.picUrl,
                            duration: this.formatTime(track.duration / 1000)
                        }));

                        // 获取每首歌的播放URL
                        for (let i = 0; i < this.playlist.length; i++) {
                            try {
                                const urlResp = await fetch(`${this.apiBase}/song/url?id=${this.playlist[i].id}`);
                                const urlData = await urlResp.json();
                                if (urlData.code === 200 && urlData.data.length > 0) {
                                    this.playlist[i].src = urlData.data[0].url;
                                }
                            } catch (e) {
                                console.error('获取歌曲URL失败:', e);
                            }
                        }

                        // 过滤掉没有播放地址的歌曲
                        this.playlist = this.playlist.filter(song => song.src);

                        if (this.playlist.length > 0) {
                            this.currentIndex = 0;
                            this.loadSong(0);
                            this.audio.play();
                            this.isPlaying = true;
                            this.updatePlayIcons('fa-pause');

                            // 打开全屏播放器
                            this.openFullscreen();
                        }
                    }
                }
            }
        } catch (error) {
            console.error('播放失败:', error);
            alert('播放失败，请稍后重试');
        }
    }
    // 格式化播放量
    formatPlayCount(count) {
        if (count >= 10000) {
            return (count / 10000).toFixed(1) + '万';
        }
        return count.toString();
    }

    // 渲染歌单到页面
    renderPlaylists(playlists) {
        const cardGrid = document.querySelector('.card-grid');
        if (!cardGrid || playlists.length === 0) return;

        cardGrid.innerHTML = playlists.map(playlist => `
        <div class="music-card" data-id="${playlist.id}" onclick="player.openPlaylist(${playlist.id})">
            <div class="card-img">
                <img src="${playlist.cover}" alt="${playlist.name}">
                <span class="play-count"><i class="fas fa-headphones"></i> ${playlist.playCount}</span>
                
                <!-- 覆盖层 -->
                <div class="card-overlay">
                    <div class="play-overlay-btn" onclick="event.stopPropagation(); player.playPlaylistFirst(${playlist.id})">
                        <i class="fas fa-play"></i>
                    </div>
                    <div class="overlay-songs">
                        ${playlist.tracks.map(song => `
                            <div class="overlay-song">
                                <i class="fas fa-music"></i> ${song}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="card-info">
                <h4>${playlist.name}</h4>
                <p><i class="fas fa-headphones"></i> ${playlist.playCount}</p>
            </div>
        </div>
    `).join('');
    }

    // 打开歌单（点击卡片）
    openPlaylist(playlistId) {
        console.log('打开歌单:', playlistId);
        // 这里可以跳转到歌单详情页
        alert(`打开歌单 ID: ${playlistId}`);
    }

    // 播放歌单第一首歌（点击覆盖层的播放按钮）
    async playPlaylistFirst(playlistId) {
        try {
            const response = await fetch(`${this.apiBase}/playlist/detail?id=${playlistId}`);
            const data = await response.json();

            if (data.code === 200 && data.playlist && data.playlist.tracks.length > 0) {
                const firstSong = data.playlist.tracks[0];

                // 获取播放URL
                const urlResponse = await fetch(`${this.apiBase}/song/url?id=${firstSong.id}`);
                const urlData = await urlResponse.json();

                if (urlData.code === 200 && urlData.data.length > 0) {
                    const songUrl = urlData.data[0].url;

                    if (songUrl) {
                        // 创建临时播放列表
                        this.playlist = [{
                            id: firstSong.id,
                            title: firstSong.name,
                            artist: firstSong.artists.map(a => a.name).join('/'),
                            album: firstSong.album.name,
                            src: songUrl,
                            cover: firstSong.album.picUrl,
                            duration: this.formatTime(firstSong.duration / 1000)
                        }];

                        this.currentIndex = 0;
                        this.loadSong(0);
                        this.audio.play();
                        this.isPlaying = true;
                        this.updatePlayIcons('fa-pause');

                        // 打开全屏播放器
                        this.openFullscreen();
                    }
                }
            }
        } catch (error) {
            console.error('播放失败:', error);
        }
    }
}

// 初始化播放器
let player;
let playlistCarousel;
document.addEventListener('DOMContentLoaded', () => {
    try {
        player = new MusicPlayer();
        window.player = player;
        console.log('播放器初始化成功');

        // 初始化歌单轮播
        setTimeout(() => {
            playlistCarousel = new PlaylistCarousel('http://localhost:3000');
        }, 500); // 设延迟，等播放器初始化完成
    } catch (e) {
        console.error('播放器初始化失败:', e);
    }
});



//  歌单轮播 
class PlaylistCarousel {
    constructor(apiBase) {
        this.apiBase = apiBase;
        this.playlists = [];
        this.currentIndex = 0;
        this.visibleCount = this.getVisibleCount(); // 每屏显示的卡片数
        this.totalPages = 0;
        this.carousel = document.getElementById('playlistCarousel');
        this.dotsContainer = document.getElementById('playlistDots');
        this.prevBtn = document.getElementById('playlistPrev');
        this.nextBtn = document.getElementById('playlistNext');


        this.autoPlayInterval = null;
        this.autoPlayDelay = 5000;

        this.init();
        this.startAutoPlay();

        this.init();
    }

    // 屏幕适配
    getVisibleCount() {
        const width = window.innerWidth;
        if (width > 1200) return 5;
        if (width > 992) return 4;
        if (width > 768) return 3;
        if (width > 480) return 2;
        return 1;
    }

    async init() {
        await this.fetchPlaylists();
        this.render();
        this.bindEvents();

        // 监听窗口大小变化，重新计算
        window.addEventListener('resize', () => {
            const newCount = this.getVisibleCount();
            if (newCount !== this.visibleCount) {
                this.visibleCount = newCount;
                this.totalPages = Math.ceil(this.playlists.length / this.visibleCount);
                this.currentIndex = Math.min(this.currentIndex, this.totalPages - 1);
                this.updateCarousel();
                this.renderDots();
            }
        });
    }

    // 获取歌单数据
    async fetchPlaylists() {
        // 显示加载状态
        if (this.carousel) {
            this.carousel.innerHTML = '<div class="carousel-loading">加载歌单中...</div>';
        }

        try {
            // 热门歌单
            const playlistIds = [
                '3778678',
                '3779629',
                '2809577409',
                '2884035',
                '19723756',
                '2250011882',
                '60198',
                '713687087',
                '745098260',
                '2681808683'
            ];

            this.playlists = [];

            for (let id of playlistIds) {
                try {
                    const response = await fetch(`${this.apiBase}/playlist/detail?id=${id}`);
                    const data = await response.json();

                    if (data.code === 200 && data.playlist) {
                        const playlist = data.playlist;

                        // 获取歌单的前3首歌曲
                        const songs = playlist.tracks.slice(0, 3).map(track => track.name);

                        this.playlists.push({
                            id: playlist.id,
                            name: playlist.name,
                            cover: playlist.coverImgUrl,
                            playCount: this.formatPlayCount(playlist.playCount),
                            tracks: songs,
                            trackCount: playlist.trackCount
                        });
                    }
                } catch (e) {
                    console.error('获取歌单失败:', e);
                }
            }

            this.totalPages = Math.ceil(this.playlists.length / this.visibleCount);

        } catch (error) {
            console.error('获取歌单列表失败:', error);
            this.playlists = this.getFallbackPlaylists(); // 获取失败用备用数据
            this.totalPages = Math.ceil(this.playlists.length / this.visibleCount);
        }
    }

    // 当API失败，使用备用数据
    getFallbackPlaylists() {
        return [
            {
                id: '1',
                name: '热歌榜',
                cover: 'https://picsum.photos/200/200?random=1',
                playCount: '556.8万',
                tracks: ['七里香', '告白气球', '稻香']
            },
            {
                id: '2',
                name: '新歌榜',
                cover: 'https://picsum.photos/200/200?random=2',
                playCount: '324.2万',
                tracks: ['我会等', '笼', '向云端']
            },
            {
                id: '3',
                name: '电子音乐',
                cover: 'https://picsum.photos/200/200?random=3',
                playCount: '189.3万',
                tracks: ['Faded', 'Alone', 'The Spectre']
            },
            {
                id: '4',
                name: '原创歌曲榜',
                cover: 'https://picsum.photos/200/200?random=4',
                playCount: '267.8万',
                tracks: ['我记得', '最优解', '唯一的']
            },
            {
                id: '5',
                name: '云音乐飙升榜',
                cover: 'https://picsum.photos/200/200?random=5',
                playCount: '432.1万',
                tracks: ['可能', '是妈妈是女儿', '说好的']
            },
            {
                id: '6',
                name: '流行音乐',
                cover: 'https://picsum.photos/200/200?random=6',
                playCount: '789.4万',
                tracks: ['乌梅子酱', '雪', '星光']
            }
        ];
    }

    // 格式化播放量
    formatPlayCount(count) {
        if (count >= 10000) {
            return (count / 10000).toFixed(1) + '万';
        }
        return count.toString();
    }

    // 渲染轮播
    render() {
        if (!this.carousel) return;

        this.carousel.innerHTML = this.playlists.map(playlist => `
            <div class="music-card" data-id="${playlist.id}">
                <div class="card-img">
                    <img src="${playlist.cover}" alt="${playlist.name}" loading="lazy">
                    <span class="play-count"><i class="fas fa-headphones"></i> ${playlist.playCount}</span>
                    
                    <!-- 覆盖层 -->
                    <div class="card-overlay">
                        <div class="play-overlay-btn" onclick="event.stopPropagation(); window.player && window.player.playPlaylistFirst('${playlist.id}')">
                            <i class="fas fa-play"></i>
                        </div>
                        <div class="overlay-songs">
                            ${playlist.tracks.map(song => `
                                <div class="overlay-song">
                                    <i class="fas fa-music"></i> ${song}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="card-info">
                    <h4>${playlist.name}</h4>
                    <p><i class="fas fa-headphones"></i> ${playlist.playCount}</p>
                </div>
            </div>
        `).join('');

        // 绑定点击事件
        this.carousel.querySelectorAll('.music-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                const playlistId = card.dataset.id;
                this.openPlaylist(playlistId, index);
            });
        });

        this.renderDots();
        this.updateCarousel();
    }

    // 渲染分页点
    renderDots() {
        if (!this.dotsContainer) return;

        let dotsHtml = '';
        for (let i = 0; i < this.totalPages; i++) {
            dotsHtml += `<span class="dot ${i === this.currentIndex ? 'active' : ''}" data-index="${i}"></span>`;
        }

        this.dotsContainer.innerHTML = dotsHtml;

        // 绑定点击事件
        this.dotsContainer.querySelectorAll('.dot').forEach(dot => {
            dot.addEventListener('click', () => {
                const index = parseInt(dot.dataset.index);
                this.goToPage(index);
            });
        });
    }

    // 更新轮播位置
    updateCarousel() {
        if (!this.carousel) return;

        const cardWidth = this.carousel.querySelector('.music-card')?.offsetWidth || 200;
        const gap = 20;
        const translateX = -this.currentIndex * (cardWidth + gap) * this.visibleCount;

        this.carousel.style.transform = `translateX(${translateX}px)`;

        // 更新按钮状态
        if (this.prevBtn) {
            this.prevBtn.disabled = this.currentIndex === 0;
        }
        if (this.nextBtn) {
            this.nextBtn.disabled = this.currentIndex === this.totalPages - 1;
        }

        // 更新分页点激活状态
        if (this.dotsContainer) {
            this.dotsContainer.querySelectorAll('.dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === this.currentIndex);
            });
        }
    }

    // 上一页
    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateCarousel();
        }
    }

    // 下一页
    next() {
        if (this.currentIndex < this.totalPages - 1) {
            this.currentIndex++;
            this.updateCarousel();
        }
    }

    // 跳转到指定页
    goToPage(index) {
        if (index >= 0 && index < this.totalPages) {
            this.currentIndex = index;
            this.updateCarousel();
        }
    }


    // 自动轮播
    startAutoPlay() {
        this.stopAutoPlay();
        this.autoPlayInterval = setInterval(() => {
            if (this.currentIndex < this.totalPages - 1) {
                this.next();
            } else {
                this.goToPage(0); // 循环到第一页
            }
        }, this.autoPlayDelay);
    }

    // 停止自动轮播
    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }
    // 绑定事件,鼠标悬停时自动暂停轮播
    bindEvents() {
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => {
                this.prev();
                this.stopAutoPlay();
                this.startAutoPlay(); // 重新开始计时
            });
        }
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => {
                this.next();
                this.stopAutoPlay();
                this.startAutoPlay();
            });
        }

        // 鼠标悬停在轮播区域，暂停自动轮播
        if (this.carousel) {
            this.carousel.addEventListener('mouseenter', () => this.stopAutoPlay());
            this.carousel.addEventListener('mouseleave', () => this.startAutoPlay());
        }

        // 鼠标悬停在分页点上时也暂停
        if (this.dotsContainer) {
            this.dotsContainer.addEventListener('mouseenter', () => this.stopAutoPlay());
            this.dotsContainer.addEventListener('mouseleave', () => this.startAutoPlay());
        }
    }

    // 打开歌单
    openPlaylist(playlistId, index) {
        console.log('打开歌单:', playlistId);
        // 可以在这里实现跳转到歌单详情页
        alert(`打开歌单: ${this.playlists[index]?.name || playlistId}`);
    }
}


// 有声书板块 
function renderAudioBooks() {
    const audioBookRow = document.getElementById('audioBookRow');
    if (!audioBookRow) return;

    // 静态有声书数据
    const audioBooks = [
        {
            title: '三体：全册有声书',
            artist: '刘慈欣 / 有声剧场',
            cover: 'https://picsum.photos/70/70?random=101',
            duration: '45:30'
        },
        {
            title: '活着（张震演播）',
            artist: '余华 / 张震',
            cover: 'https://picsum.photos/70/70?random=102',
            duration: '32:15'
        },
        {
            title: '平凡的世界',
            artist: '路遥 / 李野默',
            cover: 'https://picsum.photos/70/70?random=103',
            duration: '58:20'
        },
        {
            title: '白夜行',
            artist: '东野圭吾 / 有声剧场',
            cover: 'https://picsum.photos/70/70?random=104',
            duration: '41:10'
        },
        {
            title: '百年孤独',
            artist: '马尔克斯 / 有声书',
            cover: 'https://picsum.photos/70/70?random=105',
            duration: '36:45'
        },
        {
            title: '解忧杂货店',
            artist: '东野圭吾 / 有声剧场',
            cover: 'https://picsum.photos/70/70?random=106',
            duration: '29:30'
        },
        {
            title: '追风筝的人',
            artist: '卡勒德·胡赛尼',
            cover: 'https://picsum.photos/70/70?random=107',
            duration: '38:25'
        },
        {
            title: '小王子',
            artist: '圣埃克苏佩里',
            cover: 'https://picsum.photos/70/70?random=108',
            duration: '22:15'
        }
    ];

    // 生成HTML
    let html = '';
    audioBooks.forEach(book => {
        html += `
            <div class="music-row-item">
                <div class="music-row-cover">
                    <img src="${book.cover}" style="width:100%;height:100%;object-fit:cover;" alt="${book.title}">
                </div>
                <div class="music-row-info">
                    <div class="song-name">📚 ${book.title}</div>
                    <div class="artist">🎤 ${book.artist}</div>
                </div>
            </div>
        `;
    });

    audioBookRow.innerHTML = html;
}

// 页面加载完成后
document.addEventListener('DOMContentLoaded', function () {
    console.log('页面加载完成，开始渲染有声书...');

    // 稍微延迟，确保DOM完全加载
    setTimeout(() => {
        renderAudioBooks();
        console.log('有声书渲染函数执行完毕');
    }, 500);
});


// 页面切换 
class PageManager {
    constructor() {
        this.chipJingxuan = document.getElementById('chipJingxuan');
        this.chipGedan = document.getElementById('chipGedan');
        this.jingxuanContent = document.getElementById('jingxuanContent');
        this.gedanContent = document.getElementById('gedanContent');
        this.gedanGrid = document.getElementById('gedanGrid');

        this.init();
    }

    init() {
        // 绑定点击事件
        if (this.chipJingxuan) {
            this.chipJingxuan.addEventListener('click', () => this.switchToJingxuan());
        }
        if (this.chipGedan) {
            this.chipGedan.addEventListener('click', () => this.switchToGedan());
        }

        // 初始化加载歌单广场
        this.loadGedanData();
        this.initFilters();


    }

    initFilters() {
        const filterChips = document.querySelectorAll('.filter-chip');
        filterChips.forEach(chip => {
            chip.addEventListener('click', () => {
                // 移除其他激活状态
                filterChips.forEach(c => c.classList.remove('active'));
                // 激活当前点击
                chip.classList.add('active');

                // 筛选逻辑
                console.log('筛选:', chip.textContent);
            });
        });
    }

    switchToJingxuan() {
        // 更新标签
        this.chipJingxuan.classList.add('highlight');
        this.chipGedan.classList.remove('highlight');

        // 切换内容
        this.jingxuanContent.style.display = 'block';
        this.gedanContent.style.display = 'none';
    }

    switchToGedan() {
        // 更新标签
        this.chipGedan.classList.add('highlight');
        this.chipJingxuan.classList.remove('highlight');

        // 切换内容显示
        this.jingxuanContent.style.display = 'none';
        this.gedanContent.style.display = 'block';
    }

    async loadGedanData() {
        if (!this.gedanGrid) return;

        try {
            // 歌单列表
            const playlistIds = [
                '3778678',  // 热歌榜
                '3779629',  // 新歌榜
                '2809577409', // 电子音乐
                '2884035',  // 原创歌曲榜
                '19723756', // 云音乐飙升榜
                '2250011882', // 流行音乐
                '60198',    // 经典老歌
                '713687087', // 摇滚
                '745098260', // 民谣
                '2681808683', // 说唱
                '218452172', // 治愈
                '3136952023', // 运动
                '3136952023', // 运动
                '3778678',  // 热歌榜（重复用于演示，实际应该用不同的ID）
                '3779629',  // 新歌榜
                '2809577409', // 电子音乐
                '2884035',  // 原创歌曲榜
                '19723756', // 云音乐飙升榜
                '2250011882', // 流行音乐
                '60198',    // 经典老歌
                '713687087', // 摇滚
                '745098260', // 民谣
                '2681808683', // 说唱
                '218452172', // 治愈
                '3136952023', // 运动
                '3778678',  // 热歌榜
                '3779629',  // 新歌榜
                '2809577409', // 电子音乐
                '2884035',  // 原创歌曲榜
                '19723756', // 云音乐飙升榜
                '2250011882' // 流行音乐
            ];

            const playlists = [];

            for (let id of playlistIds) {
                try {
                    const response = await fetch(`http://localhost:3000/playlist/detail?id=${id}`);
                    const data = await response.json();

                    if (data.code === 200 && data.playlist) {
                        const playlist = data.playlist;

                        playlists.push({
                            id: playlist.id,
                            name: playlist.name,
                            cover: playlist.coverImgUrl,
                            playCount: this.formatPlayCount(playlist.playCount),
                            trackCount: playlist.trackCount
                        });
                    }
                } catch (e) {
                    console.error('获取歌单失败:', e);
                }
            }

            if (playlists.length > 0) {
                this.renderGedanGrid(playlists);
            } else {
                this.renderFallbackGedan();
            }
        } catch (error) {
            console.error('加载歌单失败:', error);
            this.renderFallbackGedan();
        }
    }

    renderGedanGrid(playlists) {
        if (!this.gedanGrid) return;

        this.gedanGrid.innerHTML = playlists.map(playlist => `
            <div class="music-card" data-id="${playlist.id}">
                <div class="card-img">
                    <img src="${playlist.cover}" alt="${playlist.name}" loading="lazy">
                    <span class="play-count"><i class="fas fa-headphones"></i> ${playlist.playCount}</span>
                    
                    <div class="card-overlay">
                        <div class="play-overlay-btn" onclick="event.stopPropagation(); window.player && window.player.playPlaylistFirst('${playlist.id}')">
                            <i class="fas fa-play"></i>
                        </div>
                    </div>
                </div>
                <div class="card-info">
                    <h4>${playlist.name}</h4>
                    <p><i class="fas fa-music"></i> ${playlist.trackCount}首</p>
                </div>
            </div>
        `).join('');

        // 添加分页
        this.addPagination();
    }

    renderFallbackGedan() {
        if (!this.gedanGrid) return;

        const fallbackPlaylists = [
            {
                id: '1',
                name: '热歌榜',
                cover: 'https://picsum.photos/200/200?random=101',
                playCount: '556.8万',
                trackCount: 50
            },
            {
                id: '2',
                name: '新歌榜',
                cover: 'https://picsum.photos/200/200?random=102',
                playCount: '324.2万',
                trackCount: 50
            },
            {
                id: '3',
                name: '电子音乐',
                cover: 'https://picsum.photos/200/200?random=103',
                playCount: '189.3万',
                trackCount: 45
            },
            {
                id: '4',
                name: '原创歌曲榜',
                cover: 'https://picsum.photos/200/200?random=104',
                playCount: '267.8万',
                trackCount: 40
            },
            {
                id: '5',
                name: '云音乐飙升榜',
                cover: 'https://picsum.photos/200/200?random=105',
                playCount: '432.1万',
                trackCount: 50
            },
            {
                id: '6',
                name: '流行音乐',
                cover: 'https://picsum.photos/200/200?random=106',
                playCount: '789.4万',
                trackCount: 60
            },
            {
                id: '7',
                name: '经典老歌',
                cover: 'https://picsum.photos/200/200?random=107',
                playCount: '654.3万',
                trackCount: 55
            },
            {
                id: '8',
                name: '摇滚合集',
                cover: 'https://picsum.photos/200/200?random=108',
                playCount: '321.5万',
                trackCount: 42
            }
        ];

        this.gedanGrid.innerHTML = fallbackPlaylists.map(playlist => `
            <div class="music-card" data-id="${playlist.id}">
                <div class="card-img">
                    <img src="${playlist.cover}" alt="${playlist.name}" loading="lazy">
                    <span class="play-count"><i class="fas fa-headphones"></i> ${playlist.playCount}</span>
                    
                    <div class="card-overlay">
                        <div class="play-overlay-btn" onclick="event.stopPropagation(); window.player && window.player.playPlaylistFirst('${playlist.id}')">
                            <i class="fas fa-play"></i>
                        </div>
                    </div>
                </div>
                <div class="card-info">
                    <h4>${playlist.name}</h4>
                    <p><i class="fas fa-music"></i> ${playlist.trackCount}首</p>
                </div>
            </div>
        `).join('');

        this.addPagination();
    }

    addPagination() {
        const pagination = document.createElement('div');
        pagination.className = 'pagination';
        pagination.innerHTML = `
            <button class="page-btn active">1</button>
            <button class="page-btn">2</button>
            <button class="page-btn">3</button>
            <button class="page-btn">4</button>
            <button class="page-btn">5</button>
            <button class="page-btn"><i class="fas fa-chevron-right"></i></button>
        `;

        // 移除已存在的分页
        const oldPagination = this.gedanContent.querySelector('.pagination');
        if (oldPagination) {
            oldPagination.remove();
        }

        this.gedanContent.appendChild(pagination);
    }

    formatPlayCount(count) {
        if (count >= 10000) {
            return (count / 10000).toFixed(1) + '万';
        }
        return count.toString();
    }
}

// 初始化Page Manager
document.addEventListener('DOMContentLoaded', function () {

    // 初始化页面管理器
    setTimeout(() => {
        window.pageManager = new PageManager();
        console.log('页面管理器初始化成功');
    }, 600);
});