// ===============================================
// BITACA CINEMA - QUIZ UI
// Knowledge Quiz for Voting Access
// ===============================================

import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { app } from '../firebase-config.js';
import { getCurrentUser } from './auth-ui.js';

const db = getFirestore(app);

// Quiz Questions - Based on Bitaca Cinema films data
const QUIZ_QUESTIONS = [
    {
        id: 1,
        question: 'Qual projeto conquistou a maior pontuação combinada (LPG + PNAB) em Capão Bonito?',
        options: [
            'Ponteia Viola',
            'Os Cascatinhas',
            'Reconstruction',
            'A Crônica'
        ],
        correct: 0,
        explanation: 'Ponteia Viola, dirigido por Margarida Chaves, alcançou 238 pontos na LPG e 98 no PNAB, totalizando 336 pontos!'
    },
    {
        id: 2,
        question: 'Quantos projetos foram aprovados focados em Música e Cultura Musical?',
        options: [
            '5 projetos',
            '8 projetos',
            '6 projetos',
            '10 projetos'
        ],
        correct: 1,
        explanation: 'São 8 projetos dedicados à música: Ponteia Viola, Os Cascatinhas, Grupo Êre, Versos Vivos, Vídeo Clipe, Arte Urbana, Cypher do Campeão e Batalha do Capão.'
    },
    {
        id: 3,
        question: 'Qual é o tema principal do documentário "Pelas Ruas de Capão"?',
        options: [
            'Preservação ambiental',
            'Skate e espaços públicos',
            'História do rock local',
            'Gastronomia caipira'
        ],
        correct: 1,
        explanation: 'O documentário dirigido por Valdir dos Reis Junior explora a cultura do skate e a relação dos jovens com os espaços públicos de Capão Bonito.'
    }
];

const PASSING_SCORE = 2; // 2 out of 3 correct

// ===== INIT QUIZ UI =====
export function initQuizUI() {
    renderQuizModal();
    setupQuizListeners();
}

// ===== RENDER QUIZ MODAL =====
function renderQuizModal() {
    const modalHTML = `
        <div id="quiz-modal" class="voting-modal" role="dialog" aria-labelledby="quiz-modal-title" aria-modal="true">
            <div class="voting-modal__overlay" aria-hidden="true"></div>
            <div class="voting-modal__content voting-modal__content--large">
                <button class="voting-modal__close" aria-label="Fechar quiz">
                    <i class="ki-filled ki-cross"></i>
                </button>

                <!-- Quiz Start Screen -->
                <div id="quiz-start-screen" class="quiz-screen">
                    <div class="quiz-header">
                        <i class="ki-filled ki-questionnaire-tablet" aria-hidden="true"></i>
                        <h2 id="quiz-modal-title" class="quiz-title">Quiz Bitaca Cinema</h2>
                        <p class="quiz-subtitle">Teste seus conhecimentos sobre os filmes de Capão Bonito para liberar sua votação!</p>
                    </div>

                    <div class="quiz-info">
                        <div class="quiz-info-card">
                            <i class="ki-filled ki-question-2" aria-hidden="true"></i>
                            <span>3 Perguntas</span>
                        </div>
                        <div class="quiz-info-card">
                            <i class="ki-filled ki-check-circle" aria-hidden="true"></i>
                            <span>2 acertos mínimos</span>
                        </div>
                        <div class="quiz-info-card">
                            <i class="ki-filled ki-star" aria-hidden="true"></i>
                            <span>Libere os votos</span>
                        </div>
                    </div>

                    <button id="start-quiz-btn" class="quiz-btn quiz-btn--primary">
                        <i class="ki-filled ki-play-circle" aria-hidden="true"></i>
                        Iniciar Quiz
                    </button>
                </div>

                <!-- Quiz Question Screen -->
                <div id="quiz-question-screen" class="quiz-screen" style="display: none;">
                    <div class="quiz-progress">
                        <div class="quiz-progress-bar">
                            <div id="quiz-progress-fill" class="quiz-progress-fill"></div>
                        </div>
                        <span id="quiz-progress-text" class="quiz-progress-text">Pergunta 1 de 3</span>
                    </div>

                    <div class="quiz-question-container">
                        <h3 id="quiz-question-text" class="quiz-question">Pergunta aparecerá aqui</h3>

                        <div id="quiz-options" class="quiz-options" role="radiogroup" aria-labelledby="quiz-question-text">
                            <!-- Options will be inserted here -->
                        </div>
                    </div>

                    <div class="quiz-actions">
                        <button id="quiz-next-btn" class="quiz-btn quiz-btn--primary" disabled>
                            Próxima
                            <i class="ki-filled ki-arrow-right" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>

                <!-- Quiz Result Screen -->
                <div id="quiz-result-screen" class="quiz-screen" style="display: none;">
                    <div class="quiz-result-icon" id="quiz-result-icon">
                        <i class="ki-filled ki-shield-tick" aria-hidden="true"></i>
                    </div>

                    <h2 id="quiz-result-title" class="quiz-result-title">Parabéns!</h2>
                    <p id="quiz-result-message" class="quiz-result-message">Você passou no quiz!</p>

                    <div class="quiz-score">
                        <div class="quiz-score-circle">
                            <span id="quiz-score-text">0/3</span>
                        </div>
                        <p class="quiz-score-label">Pontuação Final</p>
                    </div>

                    <div id="quiz-result-actions" class="quiz-result-actions">
                        <button id="quiz-vote-btn" class="quiz-btn quiz-btn--primary">
                            <i class="ki-filled ki-star" aria-hidden="true"></i>
                            Começar a Votar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ===== SETUP QUIZ LISTENERS =====
function setupQuizListeners() {
    const modal = document.getElementById('quiz-modal');
    const closeBtn = modal.querySelector('.voting-modal__close');
    const overlay = modal.querySelector('.voting-modal__overlay');

    // Close modal
    closeBtn.addEventListener('click', closeQuizModal);
    overlay.addEventListener('click', closeQuizModal);

    // Start quiz
    document.getElementById('start-quiz-btn').addEventListener('click', startQuiz);

    // Next question
    document.getElementById('quiz-next-btn').addEventListener('click', nextQuestion);

    // Vote button
    document.getElementById('quiz-vote-btn').addEventListener('click', () => {
        closeQuizModal();
        // Trigger voting UI
        const voteEvent = new CustomEvent('quizPassed');
        document.dispatchEvent(voteEvent);
    });

    // ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeQuizModal();
        }
    });
}

// ===== QUIZ STATE =====
let currentQuestionIndex = 0;
let selectedAnswer = null;
let score = 0;
let answers = [];

// ===== QUIZ FLOW =====
function startQuiz() {
    currentQuestionIndex = 0;
    selectedAnswer = null;
    score = 0;
    answers = [];

    showScreen('quiz-question-screen');
    showQuestion(0);
}

function showQuestion(index) {
    const question = QUIZ_QUESTIONS[index];

    // Update progress
    const progress = ((index + 1) / QUIZ_QUESTIONS.length) * 100;
    document.getElementById('quiz-progress-fill').style.width = `${progress}%`;
    document.getElementById('quiz-progress-text').textContent = `Pergunta ${index + 1} de ${QUIZ_QUESTIONS.length}`;

    // Update question text
    document.getElementById('quiz-question-text').textContent = question.question;

    // Render options
    const optionsContainer = document.getElementById('quiz-options');
    optionsContainer.innerHTML = question.options.map((option, i) => `
        <button
            class="quiz-option"
            data-index="${i}"
            role="radio"
            aria-checked="false"
        >
            <span class="quiz-option-label">${String.fromCharCode(65 + i)}</span>
            <span class="quiz-option-text">${option}</span>
            <i class="quiz-option-icon ki-filled ki-check-circle" aria-hidden="true"></i>
        </button>
    `).join('');

    // Add option click listeners
    optionsContainer.querySelectorAll('.quiz-option').forEach(btn => {
        btn.addEventListener('click', () => selectOption(btn));
    });

    // Reset next button
    document.getElementById('quiz-next-btn').disabled = true;
    selectedAnswer = null;
}

function selectOption(button) {
    // Remove previous selection
    document.querySelectorAll('.quiz-option').forEach(btn => {
        btn.classList.remove('selected');
        btn.setAttribute('aria-checked', 'false');
    });

    // Select current
    button.classList.add('selected');
    button.setAttribute('aria-checked', 'true');
    selectedAnswer = parseInt(button.dataset.index);

    // Enable next button
    document.getElementById('quiz-next-btn').disabled = false;
}

function nextQuestion() {
    if (selectedAnswer === null) return;

    const question = QUIZ_QUESTIONS[currentQuestionIndex];
    const isCorrect = selectedAnswer === question.correct;

    // Store answer
    answers.push({
        questionId: question.id,
        selected: selectedAnswer,
        correct: question.correct,
        isCorrect
    });

    if (isCorrect) {
        score++;
    }

    // Show feedback
    showAnswerFeedback(isCorrect, question);

    // Move to next question or show results
    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < QUIZ_QUESTIONS.length) {
            showQuestion(currentQuestionIndex);
        } else {
            showResults();
        }
    }, 2000);
}

function showAnswerFeedback(isCorrect, question) {
    const options = document.querySelectorAll('.quiz-option');
    const selectedOption = options[selectedAnswer];
    const correctOption = options[question.correct];

    // Disable all options
    options.forEach(opt => {
        opt.disabled = true;
        opt.style.pointerEvents = 'none';
    });

    // Show correct/incorrect
    if (isCorrect) {
        selectedOption.classList.add('correct');
    } else {
        selectedOption.classList.add('incorrect');
        correctOption.classList.add('correct');
    }

    // Show explanation (could be enhanced with a tooltip)
    console.log('Explanation:', question.explanation);
}

async function showResults() {
    const user = getCurrentUser();
    const passed = score >= PASSING_SCORE;

    // Save quiz result to Firestore
    if (user) {
        try {
            await setDoc(doc(db, 'quizResults', user.uid), {
                userId: user.uid,
                score: score,
                totalQuestions: QUIZ_QUESTIONS.length,
                passed: passed,
                answers: answers,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error saving quiz result:', error);
        }
    }

    // Update UI
    showScreen('quiz-result-screen');

    const icon = document.getElementById('quiz-result-icon');
    const title = document.getElementById('quiz-result-title');
    const message = document.getElementById('quiz-result-message');
    const scoreText = document.getElementById('quiz-score-text');
    const voteBtn = document.getElementById('quiz-vote-btn');

    scoreText.textContent = `${score}/${QUIZ_QUESTIONS.length}`;

    if (passed) {
        icon.innerHTML = '<i class="ki-filled ki-shield-tick" aria-hidden="true"></i>';
        icon.className = 'quiz-result-icon quiz-result-icon--success';
        title.textContent = 'Parabéns!';
        message.textContent = 'Você passou no quiz e agora pode votar nos filmes!';
        voteBtn.style.display = 'flex';
    } else {
        icon.innerHTML = '<i class="ki-filled ki-information" aria-hidden="true"></i>';
        icon.className = 'quiz-result-icon quiz-result-icon--fail';
        title.textContent = 'Quase lá!';
        message.textContent = 'Você precisa de pelo menos 2 acertos. Tente novamente!';
        voteBtn.style.display = 'none';
    }
}

// ===== SCREEN MANAGEMENT =====
function showScreen(screenId) {
    const screens = ['quiz-start-screen', 'quiz-question-screen', 'quiz-result-screen'];
    screens.forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
    document.getElementById(screenId).style.display = 'block';
}

// ===== MODAL CONTROLS =====
export async function openQuizModal() {
    const user = getCurrentUser();

    if (!user) {
        alert('Você precisa estar logado para fazer o quiz!');
        return;
    }

    // Check if user already passed quiz
    const hasPassedQuiz = await checkQuizStatus(user.uid);

    if (hasPassedQuiz) {
        // User already passed, open voting directly
        const voteEvent = new CustomEvent('quizPassed');
        document.dispatchEvent(voteEvent);
        return;
    }

    const modal = document.getElementById('quiz-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    showScreen('quiz-start-screen');
}

function closeQuizModal() {
    const modal = document.getElementById('quiz-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// ===== QUIZ STATUS CHECK =====
export async function checkQuizStatus(userId) {
    try {
        const quizDoc = await getDoc(doc(db, 'quizResults', userId));
        if (quizDoc.exists()) {
            const data = quizDoc.data();
            return data.passed === true;
        }
        return false;
    } catch (error) {
        console.error('Error checking quiz status:', error);
        return false;
    }
}
