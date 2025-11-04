# Voting System - Quick Start Guide

Get the Bitaca Cinema voting system up and running in 5 minutes.

## 1. Deploy Security Rules

First, deploy the Firestore security rules:

```bash
cd /Users/gabrielmaia/Documents/projects/bitaca-cinema
firebase deploy --only firestore:rules
```

## 2. Basic HTML Integration

Add this to your HTML page:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Bitaca Cinema - Votação</title>
</head>
<body>
<!-- Auth Button -->
<button id="login-btn">Entrar para Votar</button>
<div id="user-info" style="display: none;">
    <span id="user-name"></span>
    <button id="logout-btn">Sair</button>
</div>

<!-- Quiz Section -->
<div id="quiz-section" style="display: none;">
    <h2>Complete o Quiz para Votar</h2>
    <div id="quiz-container"></div>
    <button id="submit-quiz-btn">Enviar Respostas</button>
</div>

<!-- Voting Section -->
<div id="voting-section" style="display: none;">
    <h2>Vote nos Filmes</h2>
    <div id="films-list"></div>
</div>

<!-- Import Voting System -->
<script type="module">
    import votingSystem from './assets/js/voting/voting-system.js';

    // Initialize
    await votingSystem.initialize();

    // Setup event listeners
    setupUI();

    function setupUI() {
        // Auth state
        votingSystem.on('onAuthStateChange', (user) => {
            if (user) {
                document.getElementById('login-btn').style.display = 'none';
                document.getElementById('user-info').style.display = 'block';
                document.getElementById('user-name').textContent = user.email;
            } else {
                document.getElementById('login-btn').style.display = 'block';
                document.getElementById('user-info').style.display = 'none';
            }
        });

        // Quiz status
        votingSystem.on('onQuizStatusChange', (passed) => {
            if (passed) {
                document.getElementById('quiz-section').style.display = 'none';
                document.getElementById('voting-section').style.display = 'block';
                loadFilms();
            } else {
                document.getElementById('quiz-section').style.display = 'block';
                showQuiz();
            }
        });

        // Login button
        document.getElementById('login-btn').addEventListener('click', async () => {
            try {
                await votingSystem.signInWithGoogle();
            } catch (error) {
                alert(error.message);
            }
        });

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', async () => {
            await votingSystem.logout();
        });

        // Submit quiz button
        document.getElementById('submit-quiz-btn').addEventListener('click', submitQuiz);
    }

    // Quiz functions
    let currentQuiz = null;
    let userAnswers = [];

    function showQuiz() {
        currentQuiz = votingSystem.generateQuiz();
        const container = document.getElementById('quiz-container');

        container.innerHTML = currentQuiz.map((q, qIndex) => `
                <div class="quiz-question">
                    <h3>${qIndex + 1}. ${q.question}</h3>
                    ${q.options.map((option, oIndex) => `
                        <label>
                            <input type="radio" name="q${qIndex}" value="${oIndex}">
                            ${option}
                        </label><br>
                    `).join('')}
                </div>
            `).join('');
    }

    async function submitQuiz() {
        userAnswers = currentQuiz.map((q, i) => {
            const selected = document.querySelector(`input[name="q${i}"]:checked`);
            return selected ? parseInt(selected.value) : -1;
        });

        try {
            const result = await votingSystem.submitQuiz(currentQuiz, userAnswers);
            if (result.passed) {
                alert(`Parabéns! Você acertou ${result.score}/${result.total} questões!`);
            } else {
                alert(`Você acertou ${result.score}/${result.total}. Tente novamente!`);
                showQuiz();
            }
        } catch (error) {
            alert(error.message);
        }
    }

    // Voting functions
    async function loadFilms() {
        const films = window.filmesData || [];
        const statsMap = await votingSystem.getAllFilmStats();
        const container = document.getElementById('films-list');

        container.innerHTML = films.map(film => {
            const stats = statsMap.get(film.id) || {voteCount: 0, averageRating: 0};
            return `
                    <div class="film-card" data-film-id="${film.id}">
                        <h3>${film.titulo}</h3>
                        <p>${film.diretor}</p>
                        <p>⭐ ${stats.averageRating.toFixed(1)} (${stats.voteCount} votos)</p>
                        <div class="rating-stars">
                            ${[1, 2, 3, 4, 5].map(star =>
                    `<button class="star-btn" data-rating="${star}">⭐</button>`
            ).join('')}
                        </div>
                    </div>
                `;
        }).join('');

        // Add vote handlers
        document.querySelectorAll('.star-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const rating = parseInt(e.target.dataset.rating);
                const filmId = parseInt(e.target.closest('.film-card').dataset.filmId);

                try {
                    await votingSystem.submitVote(filmId, rating);
                    alert('Voto registrado com sucesso!');
                    loadFilms(); // Reload to show updated stats
                } catch (error) {
                    alert(error.message);
                }
            });
        });
    }
</script>
</body>
</html>
```

## 3. Common Operations

### Check if user can vote

```javascript
const eligibility = votingSystem.canVote();
if (eligibility.canVote) {
    // User can vote
} else {
    console.log(eligibility.reason); // Why they can't vote
}
```

### Get film statistics

```javascript
const stats = await votingSystem.getFilmStats(filmId);
console.log(`Votes: ${stats.voteCount}`);
console.log(`Rating: ${stats.averageRating}`);
```

### Check if user already voted

```javascript
const hasVoted = await votingSystem.hasVotedForFilm(filmId);
if (hasVoted) {
    const vote = await votingSystem.getUserVoteForFilm(filmId);
    console.log(`You voted ${vote.rating} stars`);
}
```

### Real-time updates

```javascript
const unsubscribe = votingSystem.listenToFilmVotes(filmId, (stats) => {
    updateUI(stats);
});

// Clean up when done
unsubscribe();
```

### Get top rated films

```javascript
const topFilms = await votingSystem.getTopRatedFilms(10);
topFilms.forEach(film => {
    console.log(`${film.titulo}: ${film.rating} ⭐`);
});
```

## 4. Event System

Listen to system events:

```javascript
// Auth changes
votingSystem.on('onAuthStateChange', (user) => {
    console.log('User:', user);
});

// Quiz completion
votingSystem.on('onQuizStatusChange', (passed) => {
    console.log('Quiz passed:', passed);
});

// Vote submitted
votingSystem.on('onVoteSubmitted', ({filmId, rating}) => {
    console.log(`Voted ${rating} for film ${filmId}`);
});

// Errors
votingSystem.on('onError', (error) => {
    console.error('Error:', error);
});

// Loading state
votingSystem.on('onLoadingChange', (isLoading) => {
    showSpinner(isLoading);
});
```

## 5. Testing

Test the system in browser console:

```javascript
// 1. Sign in
await votingSystem.signInWithGoogle();

// 2. Check state
console.log(votingSystem.getState());

// 3. Generate quiz
const quiz = votingSystem.generateQuiz();
console.log(quiz);

// 4. Submit quiz (all correct answers)
const answers = quiz.map(q => q.correctAnswer);
const result = await votingSystem.submitQuiz(quiz, answers);
console.log(result);

// 5. Vote
await votingSystem.submitVote(1, 5);

// 6. Get stats
const stats = await votingSystem.getFilmStats(1);
console.log(stats);
```

## 6. Troubleshooting

### "Você precisa completar o quiz antes de votar"

User needs to pass the quiz first. Show quiz UI.

### "Você já votou neste filme"

User already voted for this film. Show their existing vote.

### "Usuário não autenticado"

User needs to sign in first. Show login UI.

### Pop-up blocked error

Ask user to allow pop-ups for Google Sign-In.

### Security rules error

Deploy the Firestore security rules:

```bash
firebase deploy --only firestore:rules
```

## 7. Production Checklist

- [ ] Deploy Firestore security rules
- [ ] Test Google Sign-In in production
- [ ] Test email/password auth in production
- [ ] Verify quiz generation works
- [ ] Test vote submission
- [ ] Check real-time updates
- [ ] Monitor Firebase quota usage
- [ ] Set up error monitoring
- [ ] Configure Firebase App Check (optional but recommended)

## 8. Monitoring

Check Firebase Console:

- **Authentication**: https://console.firebase.google.com/project/abitaca-8451c/authentication
- **Firestore**: https://console.firebase.google.com/project/abitaca-8451c/firestore
- **Analytics**: https://console.firebase.google.com/project/abitaca-8451c/analytics

## 9. Support

See full documentation:

- `/assets/js/voting/README.md` - Complete API documentation
- `/assets/js/voting/example-integration.js` - Full integration example
- `/VOTING_SYSTEM_IMPLEMENTATION.md` - Technical implementation details

## 10. Next Steps

1. Customize the UI to match your design
2. Add loading indicators
3. Improve error messages
4. Add animations
5. Implement toast notifications
6. Add user profile page
7. Show voting history
8. Display leaderboard

That's it! Your voting system is ready to use.
