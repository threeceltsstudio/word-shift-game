// Import word lists
import WORD_LISTS from './wordlist.js';

// Initialize CrazyGames SDK
let sdk = window.CrazyGames?.SDK;

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

export class WordShiftGame {
    constructor() {
        console.log('Starting game initialization...');
        
        // Initialize game configuration first
        this.config = {
            startingTime: 30,
            timeBonus: 10,
            hintPenalty: 15,
            wordsPerLevel: 5,
            startWordLength: 4
        };
        console.log('Game config initialized');

        // Initialize word lists directly
        this.wordLists = WORD_LISTS;
        console.log('Word lists loaded:', Object.keys(this.wordLists).length, 'lengths available');

        // Initialize high score
        this.highScore = {
            level: 1,
            moves: 0
        };
        console.log('High score initialized');

        // Initialize audio manager
        this.audio = new AudioManager();
        console.log('Audio manager initialized');
        
        // Initialize drag state
        this.dragState = {
            isDragging: false,
            startX: 0,
            currentTile: null,
            originalIndex: -1,
            moveDirection: null
        };
        console.log('Drag state initialized');

        // Initialize timer state
        this.isPaused = false;
        this.isLoading = true;
        console.log('Timer state initialized, isLoading:', this.isLoading);
        
        // Cache DOM elements
        this.cacheDOM();
        console.log('DOM elements cached');
        
        // Hide modals initially
        this.hideModals();
        console.log('Modals hidden');

        // Show loading state
        console.log('Attempting to show loading state...');
        console.log('Word container exists:', !!this.wordContainer);
        if (this.wordContainer) {
            this.wordContainer.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Loading game...</div>
                </div>`;
            console.log('Loading state HTML set');
        } else {
            console.error('Word container not found!');
        }
        
        // Disable all interactive elements
        console.log('Attempting to disable buttons...');
        console.log('Hint button exists:', !!this.hintButton);
        console.log('Solve button exists:', !!this.solveButton);
        if (this.hintButton) this.hintButton.disabled = true;
        if (this.solveButton) this.solveButton.disabled = true;
        console.log('Buttons disabled');
        
        // Set up event listeners
        this.setupEventListeners();
        console.log('Event listeners set up');

        // Initialize game state
        this.initializeGameState();
        console.log('Game state initialized');

        // Initialize game
        console.log('Starting game initialization process...');
        this.initializeGame();
    }

    cacheDOM() {
        console.log('Starting DOM caching...');
        this.wordContainer = document.querySelector('.word-container');
        console.log('Word container found:', !!this.wordContainer);
        
        this.levelCounter = document.getElementById('level-counter');
        console.log('Level counter found:', !!this.levelCounter);
        
        this.moveCounter = document.getElementById('move-counter');
        console.log('Move counter found:', !!this.moveCounter);
        
        this.timerDisplay = document.getElementById('timer');
        console.log('Timer display found:', !!this.timerDisplay);
        
        this.hintButton = document.getElementById('hint-btn');
        console.log('Hint button found:', !!this.hintButton);
        
        this.solveButton = document.getElementById('solve-btn');
        console.log('Solve button found:', !!this.solveButton);
        
        this.gameOverModal = document.getElementById('game-over');
        console.log('Game over modal found:', !!this.gameOverModal);
        
        this.levelUpModal = document.getElementById('level-up');
        console.log('Level up modal found:', !!this.levelUpModal);
        
        this.finalLevelDisplay = document.getElementById('final-level');
        console.log('Final level display found:', !!this.finalLevelDisplay);
        
        this.finalMovesDisplay = document.getElementById('final-moves');
        console.log('Final moves display found:', !!this.finalMovesDisplay);
        
        this.highScoreLevelDisplay = document.getElementById('high-score-level');
        console.log('High score level display found:', !!this.highScoreLevelDisplay);
        
        this.highScoreMovesDisplay = document.getElementById('high-score-moves');
        console.log('High score moves display found:', !!this.highScoreMovesDisplay);
        
        this.wordLengthDisplay = document.getElementById('word-length');
        console.log('Word length display found:', !!this.wordLengthDisplay);
        
        this.playAgainButton = document.getElementById('play-again-btn');
        console.log('Play again button found:', !!this.playAgainButton);
        
        this.shareScoreButton = document.getElementById('share-score-btn');
        console.log('Share score button found:', !!this.shareScoreButton);

        // Verify all required elements are found
        if (!this.playAgainButton) {
            console.error('Play again button not found!');
        }
        if (!this.gameOverModal) {
            console.error('Game over modal not found!');
        }
        console.log('DOM caching complete');
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

    async loadGameData() {
        try {
            if (sdk && sdk.data) {
                // Use getItem instead of getData
                const data = await sdk.data.getItem('highScore');
                if (data) {
                    this.highScore = JSON.parse(data);
                }
            } else {
                const savedHighScore = localStorage.getItem('highScore');
                if (savedHighScore) {
                    this.highScore = JSON.parse(savedHighScore);
                }
            }
        } catch (error) {
            console.error('Error loading game data:', error);
            // Fallback to localStorage
            const savedHighScore = localStorage.getItem('highScore');
            if (savedHighScore) {
                this.highScore = JSON.parse(savedHighScore);
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

            if (sdk && sdk.data) {
                // Use setItem instead of setData
                await sdk.data.setItem('highScore', JSON.stringify(gameData));
            } else {
                localStorage.setItem('highScore', JSON.stringify(gameData));
            }
        } catch (error) {
            console.error('Error saving game data:', error);
            localStorage.setItem('highScore', JSON.stringify(this.highScore));
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
        if (this.isLoading || this.isGameOver) return;
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
        if (this.level % 5 === 0 && sdk && sdk.ad) {
            this.pauseTimer();
            sdk.ad.requestAd('midgame').finally(() => {
                this.resumeTimer();
            });
        }
        
        // Update display
        this.updateDisplay();
        
        // Show level up modal
        this.wordLengthDisplay.textContent = this.wordLength;
        this.levelUpModal.classList.remove('hidden');
        
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
        
        // Set game over state
        this.isGameOver = true;

        // Show interstitial at game over (only if not already shown)
        if (sdk && sdk.ad && !this.gameOverAdShown) {
            this.gameOverAdShown = true;
            this.pauseTimer();
            sdk.ad.requestAd('midgame').finally(() => {
                this.resumeTimer();
            });
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

    startNewGame() {
        // Reset game over ad flag
        this.gameOverAdShown = false;
        
        // Hide game over modal
        this.hideModals();
        
        // Initialize game state
        this.initializeGameState();
        
        // Reset display
        this.updateDisplay();
        
        // Select first word
        this.selectNewWord();

        // Refresh banner ad
        this.requestBanner();
    }

    shareScore() {
        const totalWordsCompleted = ((this.level - 1) * this.config.wordsPerLevel);
        const shareText = `🎮 Word Shift Score:\n` +
                         `📊 Level ${this.level}\n` +
                         `📝 Words Completed: ${totalWordsCompleted}\n` +
                         `🎯 Total Moves: ${this.moves}\n` +
                         `🏆 High Score: Level ${this.highScore.level}\n` +
                         `🎮 Play Word Shift now!`;

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
        if (this.isLoading || this.isGameOver) return;
        
        const target = e.target.closest('.letter-tile');
        if (!target) return;

        e.preventDefault(); // Prevent text selection
        
        const touch = e.touches ? e.touches[0] : e;
        const index = parseInt(target.dataset.index);
        
        this.dragState = {
            isDragging: true,
            startX: touch.clientX,
            currentTile: target,
            originalIndex: index,
            moveDirection: null
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
            this.timerInterval = null;
        }
        
        // Start new timer
        this.timerInterval = setInterval(() => {
            if (!this.isPaused) {
                this.timeLeft--;
                this.updateTimerDisplay();
                
                // Check for game over
                if (this.timeLeft <= 0) {
                    this.endGame();
                }
            }
        }, 1000);
    }

    pauseTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.isPaused = true;
        console.log('Timer paused');
    }

    resumeTimer() {
        if (!this.timerInterval) {
            this.startTimer();
        }
        this.isPaused = false;
        console.log('Timer resumed');
    }

    async showSolveAd() {
        if (this.isLoading || this.isGameOver) return;
        if (!sdk || !sdk.ad) {
            // If SDK is not available, just solve the word
            this.solveWord();
            return;
        }

        // Pause timer before showing ad
        this.pauseTimer();
        console.log('Timer paused for solve ad');
        
        try {
            // Show rewarded ad
            await sdk.ad.requestAd('rewarded');
            console.log('Rewarded ad completed');
            
            // If ad was watched successfully, solve the word
            this.solveWord();
        } catch (error) {
            console.error('Error showing rewarded ad:', error);
            // If ad fails, still solve the word as a fallback
            this.solveWord();
        }
    }

    solveWord() {
        // Play level up sound
        this.audio.play('levelUp');
        
        // Increment level
        this.level++;
        
        // Update the scrambled word to the correct word
        this.scrambledWord = this.currentWord;
        this.createLetterTiles();
        this.updateTileColors();
        
        // Add time bonus
        this.timeLeft += this.config.timeBonus;
        
        // Calculate new word length
        this.wordLength = this.config.startWordLength + Math.floor((this.level - 1) / this.config.wordsPerLevel);
        this.wordLength = Math.min(this.wordLength, 8); // Cap at 8 letters
        
        // Show interstitial every 5 levels
        if (this.level % 5 === 0 && sdk && sdk.ad) {
            sdk.ad.requestAd('midgame').finally(() => {
                this.resumeTimer();
            });
        } else {
            // Resume timer after solve animation if no interstitial
            setTimeout(() => {
                this.resumeTimer();
            }, 2000);
        }
        
        // Update display
        this.updateDisplay();
        
        // Show level up modal
        this.wordLengthDisplay.textContent = this.wordLength;
        this.levelUpModal.classList.remove('hidden');
        
        // Hide modal and select new word after delay
        setTimeout(() => {
            this.levelUpModal.classList.add('hidden');
            this.selectNewWord();
        }, 2000);
    }

    async requestBanner() {
        if (!sdk || !sdk.banner) return;

        try {
            // Determine banner size based on screen width
            const isMobile = window.innerWidth <= 768;
            const bannerConfig = {
                id: "banner-container",
                width: isMobile ? 320 : 728,
                height: isMobile ? 50 : 90
            };

            await sdk.banner.requestBanner(bannerConfig);
            console.log('Banner ad requested successfully:', bannerConfig);
        } catch (bannerError) {
            console.error('Error requesting banner ad:', bannerError);
        }
    }

    async initializeGame() {
        console.log('Entering initializeGame...');
        try {
            // Initialize CrazyGames SDK
            if (sdk) {
                console.log('SDK found, attempting initialization...');
                await sdk.init();
                console.log('CrazyGames SDK initialized successfully');
                
                // Request banner ad
                await this.requestBanner();
            } else {
                console.log('No SDK found, continuing without it');
            }
            
            // Load game data
            console.log('Loading game data...');
            await this.loadGameData();
            console.log('Game data loaded');
            
            // Load words
            console.log('Loading words...');
            await this.loadWords();
            console.log('Words loaded');
            
            // Enable interactive elements
            console.log('Enabling interactive elements...');
            if (this.hintButton) this.hintButton.disabled = false;
            if (this.solveButton) this.solveButton.disabled = false;
            this.isLoading = false;
            console.log('Interactive elements enabled, isLoading:', this.isLoading);
            
            // Start game
            console.log('Selecting first word...');
            this.selectNewWord();
            console.log('First word selected, initialization complete');
            
        } catch (error) {
            console.error('Error during initialization:', error);
            if (this.wordContainer) {
                this.wordContainer.innerHTML = `
                    <div class="loading error">
                        <div class="loading-text">Error loading game. Please refresh the page.</div>
                    </div>`;
                console.log('Error state displayed');
            } else {
                console.error('Could not display error state - word container not found');
            }
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize CrazyGames SDK
        if (sdk) {
            await sdk.init();
            console.log('CrazyGames SDK initialized successfully');
        }
        
        // Initialize the game
        window.game = new WordShiftGame();
    } catch (error) {
        console.error('Error during initialization:', error);
        // Still try to initialize the game even if SDK fails
        window.game = new WordShiftGame();
    }
});