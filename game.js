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
async function initializePlaygama() {
    try {
        await bridge.initialize();
        // Send mandatory game_ready message
        await bridge.platform.sendMessage("game_ready");
        console.log('Playgama SDK initialized successfully');

        // Set up banner ad state listener
        bridge.advertisement.on(bridge.EVENT_NAME.BANNER_STATE_CHANGED, state => {
            console.log('Banner state:', state);
        });

    } catch (error) {
        console.error('Error initializing Playgama SDK:', error);
    }
}

class WordShiftGame {
    constructor() {
        // Initialize game configuration first
        this.config = {
            startingTime: 60,
            timeBonus: 10,
            hintPenalty: 15,
            wordsPerLevel: 5,
            startWordLength: 4
        };

        // Initialize empty word lists
        this.wordLists = {
            4: [],
            5: [],
            6: [],
            7: [],
            8: []
        };

        // Initialize high score
        this.highScore = {
            level: 1,
            moves: 0
        };

        // Initialize audio manager
        this.audio = new AudioManager();
        
        // Cache DOM elements
        this.cacheDOM();
        
        // Hide modals initially
        this.hideModals();
        
        // Set up event listeners
        this.setupEventListeners();

        // Initialize game state
        this.isGameOver = false;

        // Initialize game
        this.initializeGame();
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
            this.wordContainer.innerHTML = '<div class="loading">Loading words...</div>';
            
            // Fetch the large word list
            const response = await fetch('https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt');
            const text = await response.text();
            const allWords = text.split('\n').map(word => word.trim().toUpperCase());
            
            // Filter and categorize words
            this.wordLists = {
                4: [],
                5: [],
                6: [],
                7: [],
                8: []
            };

            // Helper function to check if a word is appropriate for the game
            const isAppropriateWord = word => {
                // Only include words with standard letters
                if (!/^[A-Z]+$/.test(word)) return false;
                
                // Exclude very uncommon words (you might want to add more rules)
                const commonPrefixes = ['UN', 'RE', 'IN', 'IM', 'DIS', 'EN', 'EM', 'PRE'];
                const commonSuffixes = ['ING', 'ED', 'LY', 'TION', 'ABLE', 'IBLE', 'FUL', 'NESS'];
                
                // Check if word has common affixes
                const hasCommonAffix = commonPrefixes.some(prefix => word.startsWith(prefix)) ||
                                     commonSuffixes.some(suffix => word.endsWith(suffix));
                
                return hasCommonAffix;
            };

            // Categorize words by length
            allWords.forEach(word => {
                const length = word.length;
                if (length >= 4 && length <= 8 && isAppropriateWord(word)) {
                    this.wordLists[length].push(word);
                }
            });

            // Limit each category to 1000 words
            for (let length in this.wordLists) {
                if (this.wordLists[length].length > 1000) {
                    // Shuffle and take first 1000
                    this.wordLists[length] = this.shuffleArray(this.wordLists[length]).slice(0, 1000);
                }
            }

            // Log word counts for verification
            console.log('Word counts by length:', Object.fromEntries(
                Object.entries(this.wordLists).map(([length, words]) => [length, words.length])
            ));

        } catch (error) {
            console.error('Error loading words:', error);
            // Fallback to basic word list if fetch fails
            this.wordLists = {
                4: ['PLAY', 'GAME', 'WORD', 'TIME', 'HINT', 'JUMP', 'QUIZ', 'WORK', 'LOVE', 'LIFE', 'HOME', 'BOOK', 'MIND', 'HELP', 'TEAM'],
                5: ['SHIFT', 'LEVEL', 'GAMES', 'SCORE', 'BONUS', 'TIMER', 'HAPPY', 'WORLD', 'MUSIC', 'DANCE', 'LEARN', 'DREAM', 'SMILE', 'PEACE'],
                6: ['PLAYER', 'PUZZLE', 'GAMING', 'POINTS', 'LETTER', 'WONDER', 'SIMPLE', 'FRIEND', 'FAMILY', 'NATURE', 'WISDOM', 'CHANGE'],
                7: ['PLAYING', 'GAMING', 'SHUFFLE', 'CORRECT', 'PRESENT', 'JOURNEY', 'HARMONY', 'EXPLORE', 'ACHIEVE', 'INSPIRE', 'IMAGINE'],
                8: ['COMPLETE', 'SCRAMBLE', 'KEYBOARD', 'POSITION', 'DISCOVER', 'PROGRESS', 'LEARNING', 'CREATIVE', 'TOGETHER', 'ADVENTURE']
            };
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
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

        // Verify all required elements are found
        if (!this.playAgainButton) {
            console.error('Play again button not found!');
        }
        if (!this.gameOverModal) {
            console.error('Game over modal not found!');
        }
    }

    setupEventListeners() {
        // Handle letter tile interactions
        this.wordContainer.addEventListener('click', (e) => {
            if (!this.isGameOver && e.target.classList.contains('letter-tile')) {
                const direction = e.shiftKey ? -1 : 1;
                this.moveLetter(parseInt(e.target.dataset.index), direction);
            }
        });

        // Touch support
        let touchStartX = 0;
        this.wordContainer.addEventListener('touchstart', (e) => {
            if (e.target.classList.contains('letter-tile')) {
                touchStartX = e.touches[0].clientX;
            }
        });

        this.wordContainer.addEventListener('touchend', (e) => {
            if (!this.isGameOver && e.target.classList.contains('letter-tile')) {
                const touchEndX = e.changedTouches[0].clientX;
                const direction = touchEndX < touchStartX ? -1 : 1;
                this.moveLetter(parseInt(e.target.dataset.index), direction);
            }
        });

        // Button handlers
        this.hintButton.addEventListener('click', () => this.useHint());
        this.solveButton.addEventListener('click', () => this.showSolveAd());
        this.playAgainButton.addEventListener('click', () => this.startNewGame());
        this.shareScoreButton.addEventListener('click', () => this.shareScore());
    }

    startNewGame() {
        // Clear any existing game state
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        this.initializeGameState();
        this.updateDisplay();
        this.selectNewWord();
        this.startTimer();
        
        // Ensure modals are hidden
        this.hideModals();
        
        // Signal gameplay started
        if (bridge && bridge.platform) {
            bridge.platform.sendMessage("gameplay_started");
        }
        
        // Show banner at game start
        if (this.bannerSupported && bridge && bridge.advertisement) {
            this.showBanner();
        }
    }

    startTimer() {
        console.log('Starting timer with time:', this.timeLeft);
        
        // Clear any existing timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Start new timer
        this.timerInterval = setInterval(() => {
            console.log('Timer tick, time left:', this.timeLeft);
            
            if (this.isGameOver) {
                console.log('Game is over, clearing timer');
                clearInterval(this.timerInterval);
                this.timerInterval = null;
                return;
            }

            this.timeLeft--;
            this.updateTimerDisplay();
            
            // Check if time is up
            if (this.timeLeft <= 0) {
                console.log('Time is up, ending game');
                // Force time to 0 and update display
                this.timeLeft = 0;
                this.updateTimerDisplay();
                
                // Clear interval before ending game
                clearInterval(this.timerInterval);
                this.timerInterval = null;
                
                // End the game
                this.endGame();
            }
        }, 1000);
    }

    selectNewWord() {
        // Select random word from appropriate list
        const wordList = this.wordLists[this.wordLength];
        if (!wordList || wordList.length === 0) {
            // Fallback if no words available
            this.currentWord = 'FALLBACK'.slice(0, this.wordLength);
        } else {
            // Make sure we don't get the same word twice in a row
            let newWord;
            do {
                newWord = wordList[Math.floor(Math.random() * wordList.length)];
            } while (newWord === this.currentWord && wordList.length > 1);
            this.currentWord = newWord;
        }
        
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

    createLetterTiles() {
        this.wordContainer.innerHTML = '';
        
        this.scrambledWord.split('').forEach((letter, index) => {
            const tile = document.createElement('div');
            tile.className = 'letter-tile';
            tile.textContent = letter;
            tile.dataset.index = index;
            this.wordContainer.appendChild(tile);
        });
    }

    moveLetter(index, direction) {
        const letters = this.scrambledWord.split('');
        const newIndex = (index + direction + letters.length) % letters.length;
        
        // Play move sound
        this.audio.play('move');
        
        [letters[index], letters[newIndex]] = [letters[newIndex], letters[index]];
        this.scrambledWord = letters.join('');
        
        this.moves++;
        this.updateDisplay();
        this.createLetterTiles();
        this.updateTileColors();
        
        // Check if word is complete
        if (this.scrambledWord === this.currentWord) {
            setTimeout(() => this.handleLevelComplete(), 500);
        }
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
            // Show rewarded ad
            await bridge.advertisement.showRewarded();
        } catch (error) {
            console.error('Error showing rewarded ad:', error);
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

    hideModals() {
        // Ensure both modals are properly hidden
        this.gameOverModal.classList.add('hidden');
        this.levelUpModal.classList.add('hidden');
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

        try {
            // Try native share first
            if (navigator.share) {
                await navigator.share({
                    title: 'Word Shift Score',
                    text: shareText
                });
                return;
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }

        // Fallback to clipboard
        try {
            await navigator.clipboard.writeText(shareText);
            
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
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new WordShiftGame();
}); 