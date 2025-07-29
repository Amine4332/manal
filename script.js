document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const entryWrapper = document.getElementById('entry-wrapper');
    const desktopWrapper = document.getElementById('desktop-wrapper');
    const passwordWindow = document.getElementById('password-window');
    const birthdayPopup = document.getElementById('birthday-popup');
    const memoryPopup = document.getElementById('memory-popup-template');
    const finalPopup = document.getElementById('final-popup');

    // All accepted password variations
    const validPasswords = [
        "daydream", "daydreaming", "daydreamin", "daydreamin'",
        "daydreamy", "daydreamer", "daydreamers",
        "Daydream", "Daydreaming", "Daydreamin", "Daydreamin'",
        "Daydreamy", "Daydreamer", "Daydreamers"
    ];

    function populateWindows() {
        passwordWindow.innerHTML = `<div class="title-bar"><div class="title-bar-text">Guess the password</div><div class="title-bar-controls"><button></button><button class="close-button"></button></div></div><div class="window-body"><div class="riddle"><p><em>What's the name of our universe?</em></p><p>It's where I hold your hand<br>before I ever touch it.<br><br>It's where I hear your voice<br>before you even speak.<br><br>It's where I see you,<br>even when my eyes are closed.<br><br>What is this place called?</p></div><form id="password-form"><input type="text" id="password-input" placeholder="Type it below if you know it." autofocus><div class="error-message" id="error-message">Not quite... but I like how you're thinking. Try again.</div><div style="text-align: right;"><button class="action-button" type="submit">Enter</button></div></form></div>`;

        birthdayPopup.innerHTML = `<div class="title-bar"><div class="title-bar-text">Happy Birthday 💕</div><div class="title-bar-controls"><button></button><button class="close-button"></button></div></div><div class="window-body"><p>Happy Birthday, my daydream.</p><p>Today is our birthday.<br>It’s the day when you and my soul were born.<br><br>I never knew how to wrap feelings<br>so I built this instead.</p><p>You don't just make me feel loved.<br>You make me feel understood.</p><p>I called this our universe<br>because that's where you live<br>in the space between my thoughts,<br>in the quiet I don't share with anyone.</p><p><strong>Daydreaming</strong><br>it's not something I do.<br>It's where I find you.</p><p>You made my life feel like a movie.<br>Not perfect. Just alive.<br>Just real.</p><p>Happy birthday, love.</p><p>Let's keep dreaming.<br>Let's keep being real inside our fiction.<br><br><br>– Amine</p><div style="text-align:center; margin-top: 20px;"><button class="action-button" id="enter-universe-button">I made something beautiful for you.</button></div></div>`;

        memoryPopup.innerHTML = `<div class="title-bar"><div class="title-bar-text" id="popup-title"></div><div class="title-bar-controls"><button></button><button class="close-button"></button></div></div><div class="window-body"><div class="popup-visual"></div><div class="popup-text" id="popup-text"></div></div>`;

        finalPopup.innerHTML = `<div class="title-bar"><div class="title-bar-text">You've unlocked something special.</div><div class="title-bar-controls"><button></button><button class="close-button"></button></div></div><div class="window-body"><div id="lyric-display"></div><div id="custom-audio-controls"><button id="play-pause-button">►</button><span id="current-time" class="time-display">0:00</span><div class="progress-bar"><div class="progress-bar-fill"></div></div><span id="total-duration" class="time-display">0:00</span></div><div id="soundcloud-player-container"></div></div>`;
    }

    populateWindows();

    const form = document.getElementById('password-form');
    const passwordInput = document.getElementById('password-input');
    const errorMessage = document.getElementById('error-message');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const userInput = passwordInput.value.trim().toLowerCase().replace(/'/g, "");
        const isValid = validPasswords.some(password =>
            userInput === password.replace(/'/g, "")
        );

        if (isValid) {
            passwordWindow.style.display = 'none';
            birthdayPopup.style.display = 'block';
        } else {
            errorMessage.style.display = 'block';
            passwordInput.value = '';
        }
    });

    function enterTheUniverse() {
        birthdayPopup.style.display = 'none';
        entryWrapper.style.display = 'none';
        desktopWrapper.style.display = 'block';
        initializeDesktop();
    }

    birthdayPopup.querySelector('.close-button').addEventListener('click', enterTheUniverse);
    document.getElementById('enter-universe-button').addEventListener('click', enterTheUniverse);

    document.addEventListener('click', (event) => {
        if (desktopWrapper.style.display !== 'block') return;
        const isInteractive = event.target.closest('.window') || event.target.closest('.desktop-icon') || event.target.closest('.taskbar');
        if (!isInteractive) {
            handleWindowClose();
        }
    });

    function handleWindowClose() {
        const wasMemoryPopupOpen = memoryPopup.style.display === 'block';
        const wasFinalPopupOpen = finalPopup.style.display === 'block';

        if (wasMemoryPopupOpen) {
            memoryPopup.style.display = 'none';
            document.querySelector(`.taskbar-tab[data-memory-id="${memoryPopup.dataset.memoryId}"]`)?.classList.remove('active');
            checkUnlockCondition();
        }
        if (wasFinalPopupOpen) {
            finalPopup.style.display = 'none';
            if (lyricInterval) clearInterval(lyricInterval);
            if (soundcloudWidget) soundcloudWidget.pause();
            createVideoReopenIcon();
        }
    }

    let isDesktopInitialized = false;
    let memories = [];
    let lyrics = [];
    let openedMemories = new Set();
    let isVideoIconCreated = false;

    let draggedIcon = null;
    let didMove = false;

    function initializeDesktop() {
        if (isDesktopInitialized) return;
        isDesktopInitialized = true;

        const clockElement = document.getElementById('clock');
        const startButton = document.querySelector('.start-button');

        fetch('data.json')
            .then(response => response.json())
            .then(data => {
                memories = data.memories;
                lyrics = data.lyrics;

                startButton.addEventListener('click', () => { window.location.reload(); });

                function updateClock() {
                    const now = new Date(); let hours = now.getHours();
                    const minutes = now.getMinutes().toString().padStart(2, '0');
                    const ampm = hours >= 12 ? 'PM' : 'AM'; hours = hours % 12; hours = hours ? hours : 12;
                    clockElement.textContent = `${hours}:${minutes} ${ampm}`;
                }
                setInterval(updateClock, 1000); updateClock();

                memories.forEach(memory => { createIcon(memory); });
                initializeSoundCloudPlayer();
            });
    }

    function addDragListeners(iconDiv) {
        iconDiv.addEventListener('mousedown', dragStart);
        iconDiv.addEventListener('touchstart', dragStart, { passive: true });
    }

    function createIcon(memory, isSpecialVideoIcon = false) {
        const iconsContainer = document.getElementById('desktop-icons-container');
        const iconDiv = document.createElement('div');

        if (isSpecialVideoIcon) {
            iconDiv.className = 'desktop-icon starlight-materialize';
            iconDiv.style.top = '75%';
            iconDiv.style.left = '50%';
            iconDiv.style.transform = 'translateX(-50%)';
        } else {
            iconDiv.className = 'desktop-icon';
            iconDiv.style.top = memory.position.top;
            iconDiv.style.left = memory.position.left;

            const animations = ['float1', 'float2', 'float3', 'float4', 'float5', 'float6'];
            const timings = ['ease', 'ease-in-out', 'linear'];
            const directions = ['normal', 'reverse'];
            const randomAnimationName = animations[Math.floor(Math.random() * animations.length)];
            const randomDuration = Math.random() * 20 + 15;
            const randomTiming = timings[Math.floor(Math.random() * timings.length)];
            const randomDirection = directions[Math.floor(Math.random() * directions.length)];
            iconDiv.style.animationName = randomAnimationName;
            iconDiv.style.animationDuration = `${randomDuration}s`;
            iconDiv.style.animationTimingFunction = randomTiming;
            iconDiv.style.animationDirection = randomDirection;
        }

        iconDiv.innerHTML = `<div class="icon-visual">${memory.visual}</div><div class="icon-label">${memory.title}</div>`;
        iconDiv.dataset.memoryId = memory.id;

        addDragListeners(iconDiv);

        iconsContainer.appendChild(iconDiv);
    }

    function dragStart(e) {
        draggedIcon = e.target.closest('.desktop-icon');
        if (!draggedIcon) return;
        didMove = false;
        const event = e.touches ? e.touches[0] : e;
        dragOffsetX = event.clientX - draggedIcon.getBoundingClientRect().left;
        dragOffsetY = event.clientY - draggedIcon.getBoundingClientRect().top;
        draggedIcon.classList.add('dragging');
    }

    function dragMove(e) {
        if (!draggedIcon) return;
        e.preventDefault();
        didMove = true;
        const event = e.touches ? e.touches[0] : e;
        let newX = event.clientX - dragOffsetX;
        let newY = event.clientY - dragOffsetY;
        draggedIcon.style.left = `${newX}px`;
        draggedIcon.style.top = `${newY}px`;
    }

    function dragEnd() {
        if (!draggedIcon) return;
        draggedIcon.classList.remove('dragging');
        if (!didMove) {
            const memoryId = parseInt(draggedIcon.dataset.memoryId);
            if (memoryId === 99) {
                finalPopup.style.display = 'block';
                if (soundcloudWidget) soundcloudWidget.play();
            } else {
                const memory = memories.find(m => m.id === memoryId);
                if (memory) { openMemoryPopup(memory); }
            }
        }
        draggedIcon = null;
    }

    document.addEventListener('mousemove', dragMove);
    document.addEventListener('touchmove', dragMove, { passive: false });
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);

    const createNoteButton = document.getElementById('create-note-button');
    const noteWindow = document.getElementById('note-window');
    const noteTextarea = document.getElementById('note-textarea');
    const saveNoteButton = document.getElementById('save-note-button');
    const closeNoteButton = noteWindow.querySelector('.close-button');

    createNoteButton.addEventListener('click', () => {
        noteWindow.style.display = 'block';
        noteTextarea.value = localStorage.getItem('note') || '';
    });

    saveNoteButton.addEventListener('click', () => {
        localStorage.setItem('note', noteTextarea.value);
        noteWindow.style.display = 'none';
    });

    closeNoteButton.addEventListener('click', () => {
        noteWindow.style.display = 'none';
    });

    function openMemoryPopup(memory) {
        handleWindowClose();
        memoryPopup.style.display = 'block';
        memoryPopup.dataset.memoryId = memory.id;
        document.getElementById('popup-title').textContent = memory.title;
        document.getElementById('popup-text').innerHTML = memory.text;
        memoryPopup.querySelector('.popup-visual').innerHTML = memory.visual;
        openedMemories.add(memory.id);

        let tab = document.querySelector(`.taskbar-tab[data-memory-id="${memory.id}"]`);
        if (!tab) {
            tab = document.createElement('div');
            tab.className = 'taskbar-tab';
            tab.dataset.memoryId = memory.id;
            tab.innerHTML = `<div class="icon-visual">${memory.visual}</div>`;
            tab.addEventListener('click', (e) => { e.stopPropagation(); openMemoryPopup(memory); });
            document.getElementById('taskbar-windows').appendChild(tab);
        }

        document.querySelectorAll('.taskbar-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    }

    memoryPopup.querySelector('.close-button').addEventListener('click', handleWindowClose);
    finalPopup.querySelector('.close-button').addEventListener('click', handleWindowClose);

    function checkUnlockCondition() {
        if (!isVideoIconCreated && openedMemories.size === memories.length) {
            setTimeout(() => {
                finalPopup.style.display = 'block';
                if (soundcloudWidget) soundcloudWidget.play();
            }, 500);
        }
    }

    function createVideoReopenIcon() {
        if (isVideoIconCreated) return;
        isVideoIconCreated = true;
        const videoMemory = {
            id: 99,
            title: "Our Video",
            visual: `<img src="https://raw.githubusercontent.com/Amine4332/manal/refs/heads/main/Untitlefd-2.png" alt="Our Video">`
        };
        createIcon(videoMemory, true);
    }

    // --- SOUNDCLOUD LYRIC ENGINE ---
    let soundcloudWidget;
    let lyricInterval;

    function initializeSoundCloudPlayer() {
        const playerContainer = document.getElementById('soundcloud-player-container');
        const trackUrl = 'https://soundcloud.com/amine-elmoufid-642633107/hbd_1';
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.id = 'sc-widget';
        iframe.allow = "autoplay";
        iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(trackUrl)}`;
        playerContainer.appendChild(iframe);

        soundcloudWidget = SC.Widget(iframe);

        const lyricDisplay = document.getElementById('lyric-display');
        const playPauseBtn = document.getElementById('play-pause-button');
        const progressBar = document.querySelector('.progress-bar');
        const progressBarFill = document.querySelector('.progress-bar-fill');
        const currentTimeEl = document.getElementById('current-time');
        const totalDurationEl = document.getElementById('total-duration');
        let totalDuration = 0;

        function formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }

        soundcloudWidget.bind(SC.Widget.Events.READY, () => {
            soundcloudWidget.getDuration((duration) => {
                totalDuration = duration / 1000;
                totalDurationEl.textContent = formatTime(totalDuration);
            });
        });

        playPauseBtn.addEventListener('click', () => {
            soundcloudWidget.toggle();
        });

        soundcloudWidget.bind(SC.Widget.Events.PLAY, () => {
            playPauseBtn.textContent = '❚❚';
            playPauseBtn.classList.add('playing');
        });
        soundcloudWidget.bind(SC.Widget.Events.PAUSE, () => {
            playPauseBtn.textContent = '►';
            playPauseBtn.classList.remove('playing');
        });
        soundcloudWidget.bind(SC.Widget.Events.FINISH, () => {
            playPauseBtn.textContent = '►';
            playPauseBtn.classList.remove('playing');
        });

        progressBar.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            soundcloudWidget.seekTo(percentage * totalDuration * 1000);
        });

        let currentLyric = '';
        lyricInterval = setInterval(() => {
            soundcloudWidget.getPosition((position) => {
                const currentTime = position / 1000;

                // Update progress bar and time
                currentTimeEl.textContent = formatTime(currentTime);
                const progressPercent = (currentTime / totalDuration) * 100;
                progressBarFill.style.width = `${progressPercent}%`;

                // Update lyrics
                const activeLyric = lyrics.find(lyric => currentTime >= lyric.start && currentTime <= lyric.end);
                if (activeLyric) {
                    if (currentLyric !== activeLyric.text) {
                        currentLyric = activeLyric.text;
                        lyricDisplay.innerHTML = `<span class="lyric-line">${currentLyric}</span>`;
                    }
                } else if (currentLyric !== '') {
                    currentLyric = '';
                    lyricDisplay.innerHTML = '';
                }
            });
        }, 100);
    }
});
