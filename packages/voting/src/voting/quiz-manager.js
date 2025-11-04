// ===============================================
// QUIZ MANAGER
// Quiz system for voting eligibility
// ===============================================

import {
    doc,
    getDoc,
    getFirestore,
    serverTimestamp,
    setDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import {app} from '../firebase-config.js';

/**
 * @typedef {Object} QuizQuestion
 * @property {string} question - Question text
 * @property {string[]} options - Array of answer options
 * @property {number} correctAnswer - Index of correct answer
 * @property {number} filmId - Associated film ID
 * @property {string} filmTitle - Associated film title
 */

/**
 * @typedef {Object} QuizResult
 * @property {boolean} passed - Whether user passed the quiz
 * @property {number} score - Number of correct answers
 * @property {number} total - Total number of questions
 * @property {number} attempts - Number of quiz attempts
 */

class QuizManager {
    constructor() {
        this.db = getFirestore(app);
        this.questionsPerQuiz = 3;
        this.passingScore = 2; // Need 2/3 correct to pass
        this.questionPool = this._buildQuestionPool();
    }

    /**
     * Build question pool from film data
     * @private
     * @returns {QuizQuestion[]} Array of quiz questions
     */
    _buildQuestionPool() {
        // Get film data from global scope
        const films = window.filmesData || [];

        if (films.length === 0) {
            console.warn('No film data available for quiz');
            return [];
        }

        const questions = [];

        // Generate multiple question types for each film
        films.forEach(film => {
            // Question type 1: Director
            questions.push({
                question: `Quem dirige o filme "${film.titulo}"?`,
                options: this._generateDirectorOptions(film, films),
                correctAnswer: 0,
                filmId: film.id,
                filmTitle: film.titulo
            });

            // Question type 2: Genre
            questions.push({
                question: `Qual é o gênero de "${film.titulo}"?`,
                options: this._generateGenreOptions(film, films),
                correctAnswer: 0,
                filmId: film.id,
                filmTitle: film.titulo
            });

            // Question type 3: Theme
            if (film.tema) {
                questions.push({
                    question: `Qual é o tema principal de "${film.titulo}"?`,
                    options: this._generateThemeOptions(film, films),
                    correctAnswer: 0,
                    filmId: film.id,
                    filmTitle: film.titulo
                });
            }

            // Question type 4: Synopsis-based
            if (film.sinopse && film.sinopse.length > 30) {
                const keywords = this._extractKeywords(film.sinopse);
                if (keywords.length > 0) {
                    questions.push({
                        question: `"${film.titulo}" é sobre:`,
                        options: this._generateSynopsisOptions(film, films, keywords[0]),
                        correctAnswer: 0,
                        filmId: film.id,
                        filmTitle: film.titulo
                    });
                }
            }
        });

        console.log(`Generated ${questions.length} questions from ${films.length} films`);
        return questions;
    }

    /**
     * Generate director options (correct + distractors)
     * @private
     */
    _generateDirectorOptions(film, allFilms) {
        const directors = allFilms
            .filter(f => f.id !== film.id)
            .map(f => f.diretor)
            .filter((v, i, a) => a.indexOf(v) === i); // Unique

        const distractors = this._shuffleArray(directors).slice(0, 3);
        const options = [film.diretor, ...distractors];

        return this._shuffleArray(options);
    }

    /**
     * Generate genre options (correct + distractors)
     * @private
     */
    _generateGenreOptions(film, allFilms) {
        const genres = allFilms
            .filter(f => f.id !== film.id && f.genero !== film.genero)
            .map(f => f.genero)
            .filter((v, i, a) => a.indexOf(v) === i); // Unique

        const distractors = this._shuffleArray(genres).slice(0, 3);
        const options = [film.genero, ...distractors];

        return this._shuffleArray(options);
    }

    /**
     * Generate theme options (correct + distractors)
     * @private
     */
    _generateThemeOptions(film, allFilms) {
        const themeLabels = {
            'musica': 'Música',
            'patrimonio': 'Patrimônio Cultural',
            'ambiente': 'Meio Ambiente'
        };

        const themes = ['musica', 'patrimonio', 'ambiente'];
        const distractors = themes
            .filter(t => t !== film.tema)
            .map(t => themeLabels[t]);

        const options = [themeLabels[film.tema], ...distractors];

        return this._shuffleArray(options);
    }

    /**
     * Generate synopsis-based options
     * @private
     */
    _generateSynopsisOptions(film, allFilms, keyword) {
        const otherFilms = allFilms.filter(f => f.id !== film.id && f.sinopse);
        const distractors = this._shuffleArray(otherFilms).slice(0, 3)
            .map(f => {
                const words = f.sinopse.split(' ');
                return words.slice(0, 8).join(' ') + '...';
            });

        const correctSnippet = film.sinopse.split(' ').slice(0, 8).join(' ') + '...';
        const options = [correctSnippet, ...distractors];

        return this._shuffleArray(options);
    }

    /**
     * Extract keywords from synopsis
     * @private
     */
    _extractKeywords(synopsis) {
        const stopWords = ['de', 'da', 'do', 'em', 'o', 'a', 'as', 'os', 'e', 'para', 'com', 'sobre'];
        return synopsis
            .toLowerCase()
            .split(' ')
            .filter(word => word.length > 4 && !stopWords.includes(word))
            .slice(0, 3);
    }

    /**
     * Shuffle array using Fisher-Yates algorithm
     * @private
     */
    _shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Generate random quiz questions
     * @returns {QuizQuestion[]} Array of quiz questions
     */
    generateQuiz() {
        if (this.questionPool.length === 0) {
            throw new Error('No questions available');
        }

        // Select random questions
        const shuffled = this._shuffleArray(this.questionPool);
        const selected = shuffled.slice(0, Math.min(this.questionsPerQuiz, shuffled.length));

        // Store correct answer indices before shuffling options
        return selected.map(q => {
            const correctOption = q.options[q.correctAnswer];
            const shuffledOptions = this._shuffleArray(q.options);
            const newCorrectIndex = shuffledOptions.indexOf(correctOption);

            return {
                ...q,
                options: shuffledOptions,
                correctAnswer: newCorrectIndex
            };
        });
    }

    /**
     * Validate quiz answers
     * @param {QuizQuestion[]} questions - Quiz questions
     * @param {number[]} userAnswers - User's answer indices
     * @returns {QuizResult} Quiz result
     */
    validateAnswers(questions, userAnswers) {
        if (questions.length !== userAnswers.length) {
            throw new Error('Number of answers does not match number of questions');
        }

        let correctCount = 0;

        questions.forEach((question, index) => {
            if (userAnswers[index] === question.correctAnswer) {
                correctCount++;
            }
        });

        const passed = correctCount >= this.passingScore;

        return {
            passed,
            score: correctCount,
            total: questions.length,
            attempts: 0 // Will be updated when saving
        };
    }

    /**
     * Check if user has passed quiz
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} True if user passed
     */
    async hasPassedQuiz(userId) {
        try {
            if (!userId) {
                throw new Error('User ID required');
            }

            const userDoc = await getDoc(doc(this.db, 'users', userId));

            if (!userDoc.exists()) {
                return false;
            }

            const data = userDoc.data();
            return data.quizPassed === true;
        } catch (error) {
            console.error('Error checking quiz status:', error);
            throw new Error('Erro ao verificar status do quiz');
        }
    }

    /**
     * Get user quiz data
     * @param {string} userId - User ID
     * @returns {Promise<Object|null>} User quiz data or null
     */
    async getUserQuizData(userId) {
        try {
            if (!userId) {
                throw new Error('User ID required');
            }

            const userDoc = await getDoc(doc(this.db, 'users', userId));

            if (!userDoc.exists()) {
                return null;
            }

            return userDoc.data();
        } catch (error) {
            console.error('Error getting quiz data:', error);
            throw new Error('Erro ao buscar dados do quiz');
        }
    }

    /**
     * Save quiz completion result
     * @param {string} userId - User ID
     * @param {QuizResult} result - Quiz result
     * @returns {Promise<void>}
     */
    async saveQuizResult(userId, result) {
        try {
            if (!userId) {
                throw new Error('User ID required');
            }

            const userRef = doc(this.db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                // Create new user document
                await setDoc(userRef, {
                    quizPassed: result.passed,
                    quizAttempts: 1,
                    lastAttempt: serverTimestamp(),
                    bestScore: result.score,
                    passedAt: result.passed ? serverTimestamp() : null
                });
            } else {
                // Update existing document
                const currentData = userDoc.data();
                const attempts = (currentData.quizAttempts || 0) + 1;
                const bestScore = Math.max(currentData.bestScore || 0, result.score);

                await updateDoc(userRef, {
                    quizPassed: result.passed || currentData.quizPassed,
                    quizAttempts: attempts,
                    lastAttempt: serverTimestamp(),
                    bestScore: bestScore,
                    passedAt: result.passed && !currentData.quizPassed ? serverTimestamp() : currentData.passedAt
                });
            }

            console.log('Quiz result saved:', result);
        } catch (error) {
            console.error('Error saving quiz result:', error);
            throw new Error('Erro ao salvar resultado do quiz');
        }
    }

    /**
     * Get quiz statistics
     * @returns {Object} Quiz statistics
     */
    getQuizStats() {
        return {
            totalQuestions: this.questionPool.length,
            questionsPerQuiz: this.questionsPerQuiz,
            passingScore: this.passingScore
        };
    }
}

// Create and export singleton instance
const quizManager = new QuizManager();

export default quizManager;
