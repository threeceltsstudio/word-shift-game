// Import word lists
import WORD_LISTS from './wordlist.js';

// Audio Manager Class
class AudioManager {
    constructor() {
        // Initialize sound state
        this.isSoundEnabled = localStorage.getItem('soundEnabled') !== 'false';
        this.soundButton = document.getElementById('sound-btn');
        this.updateSoundButtonIcon();

        // Initialize Web Audio API
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Add sound button click handler
        this.soundButton.addEventListener('click', () => this.toggleSound());
    }

    updateSoundButtonIcon() {
        const icon = this.soundButton.querySelector('i');
        icon.className = this.isSoundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
        this.soundButton.classList.toggle('muted', !this.isSoundEnabled);
    }

    toggleSound() {
        this.isSoundEnabled = !this.isSoundEnabled;
        localStorage.setItem('soundEnabled', this.isSoundEnabled);
        this.updateSoundButtonIcon();
    }

    createOscillator(options) {
        if (!this.isSoundEnabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = options.type || 'sine';
        oscillator.frequency.setValueAtTime(options.frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(options.gain || 0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + options.duration);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + options.duration);
    }

    playSequence(notes) {
        if (!this.isSoundEnabled) return;
        notes.forEach((note, index) => {
            setTimeout(() => {
                this.createOscillator(note);
            }, note.delay || index * 100);
        });
    }

    play(soundName) {
        if (!this.isSoundEnabled) return;

        switch (soundName) {
            case 'move':
                // Simple click sound
                this.createOscillator({
                    frequency: 440,
                    duration: 0.08,
                    type: 'sine',
                    gain: 0.2
                });
                break;

            case 'correct':
                // Happy ascending arpeggio
                this.playSequence([
                    { frequency: 523.25, duration: 0.15, gain: 0.2 }, // C5
                    { frequency: 659.25, duration: 0.15, gain: 0.2, delay: 100 }, // E5
                    { frequency: 783.99, duration: 0.15, gain: 0.2, delay: 200 }  // G5
                ]);
                break;

            case 'wrong':
                // Error buzz sound
                this.createOscillator({
                    frequency: 220,
                    duration: 0.15,
                    type: 'square',
                    gain: 0.15
                });
                break;

            case 'levelUp':
                // Triumphant ascending sequence
                this.playSequence([
                    { frequency: 523.25, duration: 0.1, gain: 0.2 }, // C5
                    { frequency: 659.25, duration: 0.1, gain: 0.2, delay: 100 }, // E5
                    { frequency: 783.99, duration: 0.2, gain: 0.25, delay: 200 }, // G5
                    { frequency: 1046.50, duration: 0.3, gain: 0.3, delay: 300 }  // C6
                ]);
                break;

            case 'gameOver':
                // Sad descending sequence
                this.playSequence([
                    { frequency: 493.88, duration: 0.2, gain: 0.2 }, // B4
                    { frequency: 392.00, duration: 0.2, gain: 0.2, delay: 200 }, // G4
                    { frequency: 329.63, duration: 0.4, gain: 0.2, delay: 400 }  // E4
                ]);
                break;
        }
    }
}

// Initialize Playgama SDK
let bridge;
let isPlaygamaEnvironment = false;

async function initializePlaygama() {
    try {
        // Initialize bridge according to SDK docs
        await bridge.initialize();
        isPlaygamaEnvironment = true;
            
        // Send mandatory game_ready message
        await bridge.platform.sendMessage("game_ready");
        console.log('Playgama SDK initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing Playgama SDK:', error);
        isPlaygamaEnvironment = false;
        return false;
    }
}

export class WordShiftGame {
    constructor() {
        // Initialize game configuration first
        this.config = {
            startingTime: 30,
            timeBonus: 10,
            hintPenalty: 15,
            wordsPerLevel: 5,
            startWordLength: 4
        };

        // Initialize leaderboard support flags
        this.leaderboardSupport = {
            isSupported: false,
            isNativePopupSupported: false,
            isMultipleBoardsSupported: false,
            isSetScoreSupported: false,
            isGetScoreSupported: false,
            isGetEntriesSupported: false
        };

        // Initialize word lists directly
        this.wordLists = WORD_LISTS;

        // Initialize high score
        this.highScore = {
            level: 1,
            moves: 0
        };

        // Initialize audio manager
        this.audio = new AudioManager();
        
        // Initialize drag state
        this.dragState = {
            isDragging: false,
            startX: 0,
            currentTile: null,
            originalIndex: -1,
            moveDirection: null // Will be set to 'left' or 'right' based on drag
        };
        
        // Set up interstitial ad handling
        if (bridge && bridge.advertisement) {
            // Track interstitial state
            bridge.advertisement.on(
                bridge.EVENT_NAME.INTERSTITIAL_STATE_CHANGED,
                state => {
                    switch (state) {
                        case 'opened':
                            // Mute game sounds when ad opens
                            this.audio.isSoundEnabled = false;
                            this.audio.updateSoundButtonIcon();
                            break;
                        case 'closed':
                        case 'failed':
                            // Restore sound state when ad closes or fails
                            this.audio.isSoundEnabled = true;
                            this.audio.updateSoundButtonIcon();
                            break;
                    }
                }
            );
        }
        
        // Cache DOM elements
        this.cacheDOM();
        
        // Hide modals initially
        this.hideModals();
        
        // Set up social feature availability
        this.setupSocialFeatures();
        
        // Set up event listeners
        this.setupEventListeners();

        // Initialize game state
        this.initializeGameState();

        // Initialize game
        this.loadWords();
    }

    cacheDOM() {
        this.wordContainer = document.querySelector('.word-container');
        this.levelCounter = document.getElementById('level-counter');
        this.moveCounter = document.getElementById('move-counter');
        this.timerDisplay = document.getElementById('timer');
        this.hintButton = document.getElementById('hint-btn');
        this.solveButton = document.getElementById('solve-btn');
        this.gameOverModal = document.getElementById('game-over');
        this.levelUpModal = document.getElementById('level-up');
        this.finalLevelDisplay = document.getElementById('final-level');
        this.finalMovesDisplay = document.getElementById('final-moves');
        this.highScoreLevelDisplay = document.getElementById('high-score-level');
        this.highScoreMovesDisplay = document.getElementById('high-score-moves');
        this.wordLengthDisplay = document.getElementById('word-length');
        this.playAgainButton = document.getElementById('play-again-btn');
        this.shareScoreButton = document.getElementById('share-score-btn');
        this.rateGameButton = document.getElementById('rate-game-btn');
        this.addFavoriteButton = document.getElementById('add-favorite-btn');
        this.addHomeButton = document.getElementById('add-home-btn');

        // Verify all required elements are found
        if (!this.playAgainButton) {
            console.error('Play again button not found!');
        }
        if (!this.gameOverModal) {
            console.error('Game over modal not found!');
        }
    }

    setupSocialFeatures() {
        // Check which social features are supported
        if (bridge && bridge.social) {
            // Share support
            if (!bridge.social.isShareSupported) {
                this.shareScoreButton.style.display = 'none';
            }

            // Rate support
            if (!bridge.social.isRateSupported) {
                this.rateGameButton.style.display = 'none';
            }

            // Add to favorites support
            if (!bridge.social.isAddToFavoritesSupported) {
                this.addFavoriteButton.style.display = 'none';
            }

            // Add to home screen support
            if (!bridge.social.isAddToHomeScreenSupported) {
                this.addHomeButton.style.display = 'none';
            }
        } else {
            // Hide all social buttons if bridge.social is not available
            this.shareScoreButton.style.display = 'none';
            this.rateGameButton.style.display = 'none';
            this.addFavoriteButton.style.display = 'none';
            this.addHomeButton.style.display = 'none';
        }
    }

    setupEventListeners() {
        // Mouse events for drag and drop
        this.wordContainer.addEventListener('mousedown', (e) => this.handleDragStart(e));
        document.addEventListener('mousemove', (e) => this.handleDragMove(e));
        document.addEventListener('mouseup', (e) => this.handleDragEnd(e));

        // Touch events for mobile
        this.wordContainer.addEventListener('touchstart', (e) => this.handleDragStart(e));
        document.addEventListener('touchmove', (e) => this.handleDragMove(e));
        document.addEventListener('touchend', (e) => this.handleDragEnd(e));

        // Add other event listeners
        this.hintButton.addEventListener('click', () => this.useHint());
        this.solveButton.addEventListener('click', () => this.showSolveAd());
        this.playAgainButton.addEventListener('click', () => this.startNewGame());
        this.shareScoreButton.addEventListener('click', () => this.shareScore());
        this.rateGameButton.addEventListener('click', () => this.handleRateGame());
        this.addFavoriteButton.addEventListener('click', () => this.handleAddToFavorites());
        this.addHomeButton.addEventListener('click', () => this.handleAddToHomeScreen());
    }

    initializeGameState() {
        this.level = 1;
        this.moves = 0;
        this.timeLeft = this.config.startingTime;
        this.currentWord = '';
        this.scrambledWord = '';
        this.wordLength = this.config.startWordLength;
        this.hintsUsed = 0;
        this.isGameOver = false;
        
        // Start the timer when initializing game state
        this.startTimer();
    }

    hideModals() {
        // Hide all modals
        this.gameOverModal.classList.add('hidden');
        this.levelUpModal.classList.add('hidden');
    }

    async initializeGame() {
        try {
            // Initialize Playgama SDK
            await initializePlaygama();
            
            // Check if banner ads are supported
            this.bannerSupported = bridge.advertisement.isBannerSupported;
            
            // Set up rewarded ad state listener
            bridge.advertisement.on(bridge.EVENT_NAME.REWARDED_STATE_CHANGED, state => {
                console.log('Rewarded state:', state);
                switch (state) {
                    case 'opened':
                        // Mute game sounds when ad opens
                        this.audio.isSoundEnabled = false;
                        this.audio.updateSoundButtonIcon();
                        break;
                    case 'closed':
                    case 'failed':
                        // Restore sound state when ad closes or fails
                        this.audio.isSoundEnabled = true;
                        this.audio.updateSoundButtonIcon();
                        break;
                    case 'rewarded':
                        // Handle the reward
                        this.handleSolveReward();
                        break;
                }
            });

            // Set up visibility change handler
            bridge.game.on(bridge.EVENT_NAME.VISIBILITY_STATE_CHANGED, state => {
                if (state === 'hidden') {
                    // Pause game when tab is hidden
                    if (this.timerInterval) {
                        clearInterval(this.timerInterval);
                        this.timerInterval = null;
                    }
                    // Save game state when hidden
                    this.saveGameData();
                    // Hide banner when game is hidden
                    if (this.bannerSupported) {
                        bridge.advertisement.hideBanner();
                    }
                } else if (state === 'visible' && !this.isGameOver) {
                    // Resume game when tab becomes visible again
                    this.startTimer();
                    // Show banner when game becomes visible
                    if (this.bannerSupported) {
                        this.showBanner();
                    }
                }
            });

            // Load saved game data
            await this.loadGameData();

            // Show initial banner if supported
            if (this.bannerSupported) {
                this.showBanner();
            }

            // Load words and start game
            await this.loadWords();
            this.startNewGame();

            // Check leaderboard support
            if (bridge && bridge.leaderboard) {
                this.leaderboardSupport = {
                    isSupported: bridge.leaderboard.isSupported,
                    isNativePopupSupported: bridge.leaderboard.isNativePopupSupported,
                    isMultipleBoardsSupported: bridge.leaderboard.isMultipleBoardsSupported,
                    isSetScoreSupported: bridge.leaderboard.isSetScoreSupported,
                    isGetScoreSupported: bridge.leaderboard.isGetScoreSupported,
                    isGetEntriesSupported: bridge.leaderboard.isGetEntriesSupported
                };
                console.log('Leaderboard support:', this.leaderboardSupport);
            }

        } catch (error) {
            console.error('Error initializing game:', error);
            // Initialize high score from localStorage as fallback
            const savedHighScore = localStorage.getItem('highScore');
            if (savedHighScore) {
                this.highScore = JSON.parse(savedHighScore);
            }
            // Still try to load words and start game even if SDK fails
            await this.loadWords();
            this.startNewGame();
        }
    }

    async loadGameData() {
        try {
            // Try to load from Playgama platform storage first
            if (bridge && bridge.storage && await bridge.storage.isAvailable(bridge.STORAGE_TYPE.PLATFORM_INTERNAL)) {
                console.log('Loading data from Playgama storage');
                const data = await bridge.storage.get('highScore', bridge.STORAGE_TYPE.PLATFORM_INTERNAL);
                
                if (data) {
                    console.log('Loaded high score from Playgama:', data);
                    this.highScore = data;
                }
            } else {
                // Fallback to localStorage
                console.log('Falling back to localStorage');
                const savedHighScore = localStorage.getItem('highScore');
                if (savedHighScore) {
                    this.highScore = JSON.parse(savedHighScore);
                }
            }
        } catch (error) {
            console.error('Error loading game data:', error);
            // Try loading from localStorage as fallback
            try {
                const savedHighScore = localStorage.getItem('highScore');
                if (savedHighScore) {
                    this.highScore = JSON.parse(savedHighScore);
                }
            } catch (e) {
                console.error('Failed to load from localStorage:', e);
            }
        }

        // Ensure highScore exists
        if (!this.highScore) {
            this.highScore = { level: 1, moves: 0 };
        }
        console.log('Current high score:', this.highScore);
    }

    async saveGameData() {
        try {
            const gameData = {
                level: this.highScore.level,
                moves: this.highScore.moves
            };

            // Try to save to Playgama platform storage first
            if (bridge && bridge.storage && await bridge.storage.isAvailable(bridge.STORAGE_TYPE.PLATFORM_INTERNAL)) {
                console.log('Saving high score to Playgama:', gameData);
                await bridge.storage.set('highScore', gameData, bridge.STORAGE_TYPE.PLATFORM_INTERNAL);
                
                // Send score to leaderboard if available
                if (bridge.leaderboard) {
                    try {
                        await bridge.leaderboard.submitScore({
                            score: this.highScore.level * 1000 + Math.max(0, 1000 - this.highScore.moves),
                            details: {
                                level: this.highScore.level,
                                moves: this.highScore.moves
                            }
                        });
                    } catch (e) {
                        console.error('Failed to submit to leaderboard:', e);
                    }
                }
            } else {
                // Fallback to localStorage
                console.log('Falling back to localStorage for high score');
                localStorage.setItem('highScore', JSON.stringify(gameData));
            }
        } catch (error) {
            console.error('Error saving game data:', error);
            // Fallback to localStorage
            try {
                localStorage.setItem('highScore', JSON.stringify(this.highScore));
            } catch (e) {
                console.error('Failed to save to localStorage:', e);
            }
        }
    }

    async loadWords() {
        try {
            // Show loading state
            this.wordContainer.innerHTML = `
                <div class="loading">
                    <div class="loading-text">Loading word dictionary...</div>
                </div>`;

            // Log word counts by length
            Object.entries(this.wordLists).forEach(([length, words]) => {
                console.log(`${length} letters: ${words.length} words`);
            });

            // Start game immediately since words are already loaded
            this.selectNewWord();

        } catch (error) {
            console.error('Error loading words:', error);
            this.wordContainer.innerHTML = `
                <div class="loading error">
                    <div class="loading-text">Error loading dictionary</div>
                </div>`;
        }
    }

    selectNewWord() {
        // Select random word from appropriate list
        const wordList = this.wordLists[this.wordLength];
        if (!wordList || wordList.length === 0) {
            console.error(`No words available for length ${this.wordLength}`);
            return;
        }

        // Make sure we don't get the same word twice in a row
        let newWord;
        do {
            newWord = wordList[Math.floor(Math.random() * wordList.length)];
        } while (newWord === this.currentWord && wordList.length > 1);
        
        this.currentWord = newWord;
        
        // Make sure the word is properly scrambled
        do {
            this.scrambledWord = this.scrambleWord(this.currentWord);
        } while (this.scrambledWord === this.currentWord);
        
        this.createLetterTiles();
        this.updateTileColors();
    }

    scrambleWord(word) {
        let scrambled = word.split('');
        let same = true;
        
        while (same) {
            for (let i = scrambled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [scrambled[i], scrambled[j]] = [scrambled[j], scrambled[i]];
            }
            same = scrambled.join('') === word;
        }
        
        return scrambled.join('');
    }

    updateTileColors() {
        const tiles = this.wordContainer.children;
        let hasCorrect = false;
        
        for (let i = 0; i < tiles.length; i++) {
            const letter = tiles[i].textContent;
            const wasCorrect = tiles[i].classList.contains('correct');
            tiles[i].classList.remove('correct', 'present');
            
            if (letter === this.currentWord[i]) {
                tiles[i].classList.add('correct');
                if (!wasCorrect) {
                    // Play correct sound only for newly correct letters
                    this.audio.play('correct');
                }
                hasCorrect = true;
            } else if (this.currentWord.includes(letter)) {
                tiles[i].classList.add('present');
                if (!hasCorrect && !wasCorrect) {
                    // Play wrong sound only if no correct letters and wasn't previously correct
                    this.audio.play('wrong');
                }
            } else if (!hasCorrect && !wasCorrect) {
                this.audio.play('wrong');
            }
        }
    }

    useHint() {
        if (this.timeLeft <= this.config.hintPenalty) {
            alert('Not enough time for a hint!');
            return;
        }

        const incorrectPositions = [];
        for (let i = 0; i < this.scrambledWord.length; i++) {
            if (this.scrambledWord[i] !== this.currentWord[i]) {
                incorrectPositions.push(i);
            }
        }

        if (incorrectPositions.length === 0) {
            alert('All letters are in correct positions!');
            return;
        }

        // Select random incorrect position
        const hintIndex = incorrectPositions[Math.floor(Math.random() * incorrectPositions.length)];
        const correctLetter = this.currentWord[hintIndex];
        
        // Find current position of the correct letter
        const currentIndex = this.scrambledWord.indexOf(correctLetter);
        
        // Swap letters
        const letters = this.scrambledWord.split('');
        [letters[hintIndex], letters[currentIndex]] = [letters[currentIndex], letters[hintIndex]];
        this.scrambledWord = letters.join('');
        
        // Apply time penalty
        this.timeLeft -= this.config.hintPenalty;
        this.hintsUsed++;
        
        this.updateDisplay();
        this.createLetterTiles();
        this.updateTileColors();
        
        if (this.scrambledWord === this.currentWord) {
            this.handleLevelComplete();
        }
    }

    async showSolveAd() {
        try {
            // Show interstitial before rewarded ad
            if (bridge && bridge.advertisement) {
                await bridge.advertisement.showInterstitial();
            }
            // Show rewarded ad
            await bridge.advertisement.showRewarded();
        } catch (error) {
            console.error('Error showing ads:', error);
            // Fallback to regular solve if ad fails
            this.solveWord();
        }
    }

    handleSolveReward() {
        // Player has watched the ad, give them the reward
        this.solveWord();
    }

    solveWord() {
        this.scrambledWord = this.currentWord;
        this.createLetterTiles();
        this.updateTileColors();
        
        setTimeout(() => {
            this.level++;
            this.selectNewWord();
        }, 1000);
    }

    handleLevelComplete() {
        // Play level up sound first
        this.audio.play('levelUp');
        
        // Increment level and add time bonus
        this.level++;
        this.timeLeft += this.config.timeBonus;
        
        // Calculate new word length before showing modal
        this.wordLength = this.config.startWordLength + Math.floor((this.level - 1) / this.config.wordsPerLevel);
        this.wordLength = Math.min(this.wordLength, 8); // Cap at 8 letters
        
        // Show interstitial every 5 levels
        if (this.level % 5 === 0 && bridge && bridge.advertisement) {
            bridge.advertisement.showInterstitial();
        }
        
        // Update display
        this.updateDisplay();
        
        // Show level up modal
        this.wordLengthDisplay.textContent = this.wordLength;
        this.levelUpModal.classList.remove('hidden');

        // Signal achievement
        if (bridge && bridge.platform) {
            bridge.platform.sendMessage("player_got_achievement");
        }
        
        // Hide modal and select new word after delay
        setTimeout(() => {
            this.levelUpModal.classList.add('hidden');
            this.selectNewWord();
        }, 2000);
    }

    endGame() {
        console.log('Entering endGame function');
        
        // Stop the timer if it's still running
        if (this.timerInterval) {
            console.log('Clearing timer interval');
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Set game over state first
        this.isGameOver = true;

        // Show interstitial at game over
        if (bridge && bridge.advertisement) {
            bridge.advertisement.showInterstitial();
        }
        
        // Calculate stats
        const totalWordsCompleted = ((this.level - 1) * this.config.wordsPerLevel);
        console.log('Game over stats:', {
            level: this.level,
            totalWords: totalWordsCompleted,
            moves: this.moves
        });
        
        // Update high score if needed
        if (!this.highScore) this.highScore = { level: 1, moves: 0 };
        
        if (this.level > this.highScore.level || 
            (this.level === this.highScore.level && this.moves < this.highScore.moves)) {
            console.log('New high score!', {
                level: this.level,
                moves: this.moves
            });
            this.highScore = {
                level: this.level,
                moves: this.moves
            };
            // Save the new high score
            this.saveGameData();
        }
        
        try {
            // Play game over sound
            this.audio.play('gameOver');
            
            // Hide any other modals
            if (this.levelUpModal) {
                this.levelUpModal.classList.add('hidden');
            }
            
            // Update and show game over modal
            if (this.gameOverModal && this.finalLevelDisplay && this.finalMovesDisplay) {
                console.log('Updating game over modal');
                this.finalLevelDisplay.textContent = `${this.level} (${totalWordsCompleted} words)`;
                this.finalMovesDisplay.textContent = this.moves;
                this.highScoreLevelDisplay.textContent = this.highScore.level;
                this.highScoreMovesDisplay.textContent = this.highScore.moves;
                
                // Show the modal
                this.gameOverModal.classList.remove('hidden');
                console.log('Game over modal should be visible now');
            } else {
                console.error('Game over modal elements not found:', {
                    modal: !!this.gameOverModal,
                    levelDisplay: !!this.finalLevelDisplay,
                    movesDisplay: !!this.finalMovesDisplay
                });
            }

            // Signal gameplay stopped
            if (bridge && bridge.platform) {
                bridge.platform.sendMessage("gameplay_stopped");
            }

            // Hide banner at game over
            if (this.bannerSupported && bridge && bridge.advertisement) {
                bridge.advertisement.hideBanner();
            }

            // Submit score to leaderboard
            this.submitScore();

        } catch (error) {
            console.error('Error in endGame:', error);
        }
    }

    updateDisplay() {
        this.levelCounter.textContent = this.level;
        this.moveCounter.textContent = this.moves;
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        if (this.timerDisplay) {
            // Ensure timer never shows negative values
            this.timerDisplay.textContent = Math.max(0, this.timeLeft);
            
            // Add visual feedback when time is low
            if (this.timeLeft <= 10) {
                this.timerDisplay.classList.add('low-time');
            } else {
                this.timerDisplay.classList.remove('low-time');
            }
        } else {
            console.error('Timer display element not found');
        }
    }

    showBanner() {
        if (!bridge || !bridge.advertisement || !this.bannerSupported) return;

        // Configure banner options based on platform
        let options = {};
        
        if (bridge.platform) {
            switch (bridge.platform.id) {
                case 'vk':
                    options = {
                        position: 'bottom',
                        layoutType: 'resize',
                        canClose: false
                    };
                    break;
                case 'crazy_games':
                    options = {
                        position: 'bottom'
                    };
                    break;
                case 'game_distribution':
                    options = {
                        position: 'bottom'
                    };
                    break;
                case 'msn':
                    options = {
                        position: 'top:728x90'
                    };
                    break;
                default:
                    options = {
                        position: 'bottom'
                    };
            }
        }

        bridge.advertisement.showBanner(options);
    }

    async shareScore() {
        const totalWordsCompleted = ((this.level - 1) * this.config.wordsPerLevel);
        const shareText = `🎮 Word Shift Score:\n` +
                         `📊 Level ${this.level}\n` +
                         `📝 Words Completed: ${totalWordsCompleted}\n` +
                         `🎯 Total Moves: ${this.moves}\n` +
                         `🏆 High Score: Level ${this.highScore.level}\n` +
                         `🎮 Play Word Shift now!`;

        if (bridge && bridge.social && bridge.social.isShareSupported) {
            try {
                const options = {};
                
                switch (bridge.platform.id) {
                    case 'vk':
                        options.link = window.location.href;
                        break;
                    case 'facebook':
                    case 'msn':
                        options.title = 'Word Shift Score';
                        options.text = shareText;
                        // You would need to generate or have a sharing image
                        // options.image = 'base64 or URL of sharing image';
                        break;
                }

                await bridge.social.share(options);
                console.log('Score shared successfully');
            } catch (error) {
                console.error('Error sharing score:', error);
                this.fallbackShare(shareText);
            }
        } else {
            this.fallbackShare(shareText);
        }
    }

    fallbackShare(shareText) {
        // Fallback to clipboard
        try {
            navigator.clipboard.writeText(shareText);
            
            // Show temporary success message
            const originalText = this.shareScoreButton.innerHTML;
            this.shareScoreButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
            
            setTimeout(() => {
                this.shareScoreButton.innerHTML = originalText;
            }, 2000);
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            alert('Could not share score. Please try again.');
        }
    }

    async handleRateGame() {
        if (bridge && bridge.social && bridge.social.isRateSupported) {
            try {
                await bridge.social.rate();
                // Hide the rate button after successful rating
                this.rateGameButton.style.display = 'none';
            } catch (error) {
                console.error('Error rating game:', error);
            }
        }
    }

    async handleAddToFavorites() {
        if (bridge && bridge.social && bridge.social.isAddToFavoritesSupported) {
            try {
                await bridge.social.addToFavorites();
                // Show success message
                const originalText = this.addFavoriteButton.innerHTML;
                this.addFavoriteButton.innerHTML = '<i class="fas fa-check"></i> Added!';
                setTimeout(() => {
                    this.addFavoriteButton.innerHTML = originalText;
                }, 2000);
            } catch (error) {
                console.error('Error adding to favorites:', error);
            }
        }
    }

    async handleAddToHomeScreen() {
        if (bridge && bridge.social && bridge.social.isAddToHomeScreenSupported) {
            try {
                await bridge.social.addToHomeScreen();
                // Show success message
                const originalText = this.addHomeButton.innerHTML;
                this.addHomeButton.innerHTML = '<i class="fas fa-check"></i> Added!';
                setTimeout(() => {
                    this.addHomeButton.innerHTML = originalText;
                }, 2000);
            } catch (error) {
                console.error('Error adding to home screen:', error);
            }
        }
    }

    createLetterTiles() {
        this.wordContainer.innerHTML = '';
        
        this.scrambledWord.split('').forEach((letter, index) => {
            const tile = document.createElement('div');
            tile.className = 'letter-tile';
            tile.textContent = letter;
            tile.dataset.index = index;
            tile.style.touchAction = 'none'; // Prevent scrolling while dragging on mobile
            this.wordContainer.appendChild(tile);
        });
    }

    handleDragStart(e) {
        const target = e.target.closest('.letter-tile');
        if (!target || this.isGameOver) return;

        e.preventDefault(); // Prevent text selection
        
        const touch = e.touches ? e.touches[0] : e;
        const index = parseInt(target.dataset.index);
        
        this.dragState = {
            isDragging: true,
            startX: touch.clientX,
            currentTile: target,
            originalIndex: index,
            moveDirection: null // Will be set to 'left' or 'right' based on drag
        };

        target.classList.add('dragging');
    }

    handleDragMove(e) {
        if (!this.dragState.isDragging) return;
        e.preventDefault();

        const touch = e.touches ? e.touches[0] : e;
        const deltaX = touch.clientX - this.dragState.startX;
        const tile = this.dragState.currentTile;
        const index = this.dragState.originalIndex;
        
        // Determine direction based on drag
        if (Math.abs(deltaX) > 10) { // Small threshold to determine intent
            if (deltaX < 0 && index > 0) {
                // Moving left
                if (this.dragState.moveDirection !== 'left') {
                    this.dragState.moveDirection = 'left';
                    tile.style.transform = 'translateX(-100%)';
                    // Show target position
                    const prevTile = this.wordContainer.children[index - 1];
                    prevTile.classList.add('potential-swap');
                }
            } else if (deltaX > 0 && index < this.scrambledWord.length - 1) {
                // Moving right
                if (this.dragState.moveDirection !== 'right') {
                    this.dragState.moveDirection = 'right';
                    tile.style.transform = 'translateX(100%)';
                    // Show target position
                    const nextTile = this.wordContainer.children[index + 1];
                    nextTile.classList.add('potential-swap');
                }
            }
        } else {
            // Reset if movement is too small
            this.dragState.moveDirection = null;
            tile.style.transform = '';
            Array.from(this.wordContainer.children).forEach(t => t.classList.remove('potential-swap'));
        }
    }

    handleDragEnd(e) {
        if (!this.dragState.isDragging) return;
        
        const tile = this.dragState.currentTile;
        const index = this.dragState.originalIndex;
        
        // Remove visual states
        tile.classList.remove('dragging');
        tile.style.transform = '';
        Array.from(this.wordContainer.children).forEach(t => t.classList.remove('potential-swap'));
        
        // Perform swap if we have a direction
        if (this.dragState.moveDirection === 'left' && index > 0) {
            this.swapTiles(index, index - 1);
        } else if (this.dragState.moveDirection === 'right' && index < this.scrambledWord.length - 1) {
            this.swapTiles(index, index + 1);
        }
        
        // Reset drag state
        this.dragState = {
            isDragging: false,
            startX: 0,
            currentTile: null,
            originalIndex: -1,
            moveDirection: null
        };
    }

    swapTiles(fromIndex, toIndex) {
        // Update the scrambled word
        const letters = this.scrambledWord.split('');
        [letters[fromIndex], letters[toIndex]] = [letters[toIndex], letters[fromIndex]];
        this.scrambledWord = letters.join('');
        
        // Play move sound
        this.audio.play('move');
        
        // Increment moves counter
        this.moves++;
        this.updateDisplay();
        
        // Update tiles
        const tiles = this.wordContainer.children;
        const fromTile = tiles[fromIndex];
        const toTile = tiles[toIndex];
        
        // Swap content
        const tempText = fromTile.textContent;
        fromTile.textContent = toTile.textContent;
        toTile.textContent = tempText;
        
        // Update colors
        this.updateTileColors();
        
        // Check if word is complete
        if (this.scrambledWord === this.currentWord) {
            setTimeout(() => this.handleLevelComplete(), 500);
        }
    }

    startTimer() {
        // Clear any existing timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // Start new timer
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            // Check for game over
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    startNewGame() {
        // Hide game over modal
        this.hideModals();
        
        // Initialize game state
        this.initializeGameState();
        
        // Reset display
        this.updateDisplay();
        
        // Select first word
        this.selectNewWord();
        
        // Show banner if supported
        if (this.bannerSupported && bridge && bridge.advertisement) {
            this.showBanner();
        }
    }

    async submitScore() {
        if (!this.leaderboardSupport.isSetScoreSupported) return;

        try {
            let options = {};
            const score = this.level * 1000 + Math.max(0, 1000 - this.moves);

            switch (bridge.platform.id) {
                case 'yandex':
                    options = {
                        leaderboardName: 'word_shift_scores',
                        score: score
                    };
                    break;
                case 'facebook':
                    options = {
                        leaderboardName: 'word_shift_scores',
                        score: score
                    };
                    break;
                case 'msn':
                    options = {
                        score: score
                    };
                    break;
                case 'lagged':
                    options = {
                        boardId: 'word_shift_scores',
                        score: score
                    };
                    break;
                case 'y8':
                    options = {
                        table: 'word_shift_scores',
                        points: score
                    };
                    break;
            }

            await bridge.leaderboard.setScore(options);
            console.log('Score submitted successfully:', score);
        } catch (error) {
            console.error('Error submitting score:', error);
        }
    }

    async showLeaderboard() {
        if (!this.leaderboardSupport.isSupported) return;

        try {
            // Try native popup first if supported
            if (this.leaderboardSupport.isNativePopupSupported) {
                let options = {};
                if (bridge.platform.id === 'y8') {
                    options = {
                        table: 'word_shift_scores'
                    };
                }
                await bridge.leaderboard.showNativePopup(options);
                return;
            }

            // Fallback to getting entries and showing custom leaderboard
            if (this.leaderboardSupport.isGetEntriesSupported) {
                let options = {};
                switch (bridge.platform.id) {
                    case 'yandex':
                        options = {
                            leaderboardName: 'word_shift_scores',
                            includeUser: true,
                            quantityAround: 10,
                            quantityTop: 10
                        };
                        break;
                    case 'facebook':
                        options = {
                            leaderboardName: 'word_shift_scores',
                            count: 10,
                            offset: 0
                        };
                        break;
                    case 'y8':
                        options = {
                            table: 'word_shift_scores',
                            perPage: 10,
                            page: 1,
                            mode: 'alltime'
                        };
                        break;
                }

                const entries = await bridge.leaderboard.getEntries(options);
                this.displayLeaderboard(entries);
            }
        } catch (error) {
            console.error('Error showing leaderboard:', error);
        }
    }

    displayLeaderboard(entries) {
        // Create leaderboard modal if it doesn't exist
        let leaderboardModal = document.getElementById('leaderboard-modal');
        if (!leaderboardModal) {
            leaderboardModal = document.createElement('div');
            leaderboardModal.id = 'leaderboard-modal';
            leaderboardModal.className = 'modal';
            document.body.appendChild(leaderboardModal);
        }

        // Build leaderboard HTML
        let html = `
            <div class="modal-content">
                <h2>Leaderboard</h2>
                <div class="leaderboard-entries">
                    <table>
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Player</th>
                                <th>Score</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        entries.forEach(entry => {
            const playerName = entry.name || entry.playerName || entry.playername || 'Anonymous';
            const score = entry.score || entry.points || 0;
            const rank = entry.rank || '#';

            html += `
                <tr${entry.isCurrentPlayer ? ' class="current-player"' : ''}>
                    <td>${rank}</td>
                    <td>${playerName}</td>
                    <td>${score}</td>
                </tr>
            `;
        });

        html += `
                        </tbody>
                    </table>
                </div>
                <button class="btn close-btn">Close</button>
            </div>
        `;

        leaderboardModal.innerHTML = html;
        leaderboardModal.classList.remove('hidden');

        // Add close button handler
        const closeBtn = leaderboardModal.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            leaderboardModal.classList.add('hidden');
        });
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize Playgama SDK first and wait for it
        const sdkInitialized = await initializePlaygama();
        console.log('SDK initialization result:', sdkInitialized);
        
        // Then initialize the game
        window.game = new WordShiftGame();
    } catch (error) {
        console.error('Error during initialization:', error);
        // Still try to initialize the game even if SDK fails
        window.game = new WordShiftGame();
    }
});