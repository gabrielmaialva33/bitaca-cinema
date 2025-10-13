# Voting System Architecture

Complete technical architecture of the Bitaca Cinema voting system.

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     VOTING SYSTEM                            │
│                   (voting-system.js)                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │  State Management & Event Orchestration            │     │
│  │  - isAuthenticated, hasPassedQuiz, currentUser     │     │
│  │  - Event System (5 events)                         │     │
│  └────────────────────────────────────────────────────┘     │
└──────────┬──────────────┬────────────────┬──────────────────┘
           │              │                │
           ▼              ▼                ▼
    ┌──────────┐   ┌──────────┐    ┌──────────┐
    │   AUTH   │   │   QUIZ   │    │   VOTE   │
    │ MANAGER  │   │ MANAGER  │    │ MANAGER  │
    └────┬─────┘   └────┬─────┘    └────┬─────┘
         │              │                │
         ▼              ▼                ▼
    ┌──────────────────────────────────────┐
    │         FIREBASE SERVICES             │
    │  ┌────────┐  ┌────────┐  ┌────────┐  │
    │  │  Auth  │  │Firestore│ │Analytics│ │
    │  └────────┘  └────────┘  └────────┘  │
    └──────────────────────────────────────┘
```

## Module Breakdown

### 1. Authentication Manager (auth-manager.js)

```
┌──────────────────────────────────────┐
│      Authentication Manager          │
├──────────────────────────────────────┤
│ Public API:                          │
│  • signInWithGoogle()                │
│  • signInWithEmail(email, password)  │
│  • createAccount(email, password)    │
│  • logout()                          │
│  • onAuthStateChange(callback)       │
│  • isAuthenticated()                 │
│  • getCurrentUser()                  │
│  • getUserId()                       │
│  • waitForAuth()                     │
├──────────────────────────────────────┤
│ Firebase Auth Methods:               │
│  • signInWithPopup                   │
│  • signInWithEmailAndPassword        │
│  • createUserWithEmailAndPassword    │
│  • signOut                           │
│  • onAuthStateChanged                │
│  • setPersistence                    │
├──────────────────────────────────────┤
│ State:                               │
│  • currentUser: User | null          │
│  • authStateCallbacks: Function[]    │
└──────────────────────────────────────┘
```

**Flow Diagram:**
```
User Action
    │
    ▼
signInWithGoogle/Email
    │
    ▼
Firebase Auth
    │
    ▼
onAuthStateChanged
    │
    ▼
Update currentUser
    │
    ▼
Notify callbacks
    │
    ▼
UI Update
```

### 2. Quiz Manager (quiz-manager.js)

```
┌──────────────────────────────────────┐
│         Quiz Manager                 │
├──────────────────────────────────────┤
│ Public API:                          │
│  • generateQuiz()                    │
│  • validateAnswers(q, a)             │
│  • hasPassedQuiz(userId)             │
│  • saveQuizResult(userId, result)    │
│  • getUserQuizData(userId)           │
│  • getQuizStats()                    │
├──────────────────────────────────────┤
│ Question Generation:                 │
│  • _buildQuestionPool()              │
│  • _generateDirectorOptions()        │
│  • _generateGenreOptions()           │
│  • _generateThemeOptions()           │
│  • _generateSynopsisOptions()        │
│  • _shuffleArray() [Fisher-Yates]    │
├──────────────────────────────────────┤
│ State:                               │
│  • questionPool: Question[] (~92)    │
│  • questionsPerQuiz: 3               │
│  • passingScore: 2                   │
└──────────────────────────────────────┘
```

**Question Generation Flow:**
```
filmesData (23 films)
    │
    ▼
Build Question Pool
    ├─► Director Questions (23)
    ├─► Genre Questions (23)
    ├─► Theme Questions (23)
    └─► Synopsis Questions (23)
    │
    ▼
~92 Total Questions
    │
    ▼
Shuffle & Select 3
    │
    ▼
Return Quiz
```

**Quiz Validation Flow:**
```
User Answers
    │
    ▼
validateAnswers()
    │
    ├─► Compare with correct answers
    ├─► Count correct (score)
    └─► Check if score >= 2
    │
    ▼
QuizResult {passed, score, total}
    │
    ▼
saveQuizResult()
    │
    ▼
Firestore: users/{userId}
```

### 3. Vote Manager (vote-manager.js)

```
┌──────────────────────────────────────┐
│          Vote Manager                │
├──────────────────────────────────────┤
│ Public API:                          │
│  • submitVote(filmId, rating)        │
│  • hasUserVoted(userId, filmId)      │
│  • getUserVote(userId, filmId)       │
│  • getUserVotes(userId)              │
│  • getFilmStats(filmId)              │
│  • getAllFilmStats()                 │
│  • listenToFilmVotes(id, callback)   │
│  • getTopRatedFilms(limit)           │
│  • getRatingDistribution(filmId)     │
│  • cleanupListeners()                │
├──────────────────────────────────────┤
│ Firestore Operations:                │
│  • runTransaction (atomic votes)     │
│  • getDoc, setDoc (CRUD)             │
│  • query, where (filtering)          │
│  • onSnapshot (real-time)            │
├──────────────────────────────────────┤
│ State:                               │
│  • voteListeners: Map<id, unsub>     │
│  • MIN_RATING: 1                     │
│  • MAX_RATING: 5                     │
└──────────────────────────────────────┘
```

**Vote Submission Flow (Transaction):**
```
submitVote(filmId, rating)
    │
    ├─► Validate auth
    ├─► Validate inputs (1-5 stars)
    └─► Check not already voted
    │
    ▼
runTransaction {
    │
    ├─► Get current film stats
    │   (voteCount, totalStars, avgRating)
    │
    ├─► Calculate new stats
    │   newVoteCount = old + 1
    │   newTotalStars = old + rating
    │   newAvgRating = total / count
    │
    ├─► Create vote document
    │   votes/{userId}_{filmId}
    │
    └─► Update film document
        films/{filmId}
}
    │
    ▼
Success / Error
```

**Real-time Updates:**
```
listenToFilmVotes(filmId, callback)
    │
    ▼
onSnapshot(films/{filmId})
    │
    ▼
Document Changed
    │
    ▼
callback(newStats)
    │
    ▼
UI Updated Automatically
```

### 4. Voting System (voting-system.js)

```
┌──────────────────────────────────────────────────┐
│            Voting System Orchestrator            │
├──────────────────────────────────────────────────┤
│ Responsibilities:                                │
│  • Initialize all managers                       │
│  • Coordinate auth, quiz, vote flows             │
│  • Manage global state                           │
│  • Handle events & callbacks                     │
│  • Track analytics                               │
│  • Error handling & loading states               │
├──────────────────────────────────────────────────┤
│ State:                                           │
│  {                                               │
│    isAuthenticated: boolean                      │
│    hasPassedQuiz: boolean                        │
│    currentUser: UserProfile | null               │
│    isLoading: boolean                            │
│    error: string | null                          │
│  }                                               │
├──────────────────────────────────────────────────┤
│ Event System:                                    │
│  • onAuthStateChange                             │
│  • onQuizStatusChange                            │
│  • onVoteSubmitted                               │
│  • onError                                       │
│  • onLoadingChange                               │
└──────────────────────────────────────────────────┘
```

## Data Flow

### Complete User Journey

```
1. PAGE LOAD
   └─► votingSystem.initialize()
       └─► Wait for auth state
           └─► Update UI

2. USER CLICKS "LOGIN"
   └─► votingSystem.signInWithGoogle()
       └─► authManager.signInWithGoogle()
           └─► Firebase Auth popup
               └─► onAuthStateChange fires
                   └─► currentUser updated
                       └─► Check quiz status
                           ├─► Passed → Show voting UI
                           └─► Not passed → Show quiz UI

3. USER TAKES QUIZ
   └─► votingSystem.generateQuiz()
       └─► quizManager.generateQuiz()
           └─► Returns 3 random questions
               └─► User answers questions
                   └─► votingSystem.submitQuiz()
                       └─► quizManager.validateAnswers()
                           └─► quizManager.saveQuizResult()
                               └─► Firestore: users/{userId}
                                   └─► onQuizStatusChange fires
                                       ├─► Passed → Show voting UI
                                       └─► Failed → Show retry option

4. USER VOTES
   └─► votingSystem.submitVote(filmId, rating)
       ├─► Check canVote() eligibility
       └─► voteManager.submitVote()
           └─► Check not already voted
               └─► runTransaction {
                       create vote
                       update stats
                   }
                   └─► onVoteSubmitted fires
                       └─► UI updates
                           └─► Real-time listener updates stats
```

## Firestore Schema

```
firestore
│
├── users (collection)
│   └── {userId} (document)
│       ├── quizPassed: boolean
│       ├── quizAttempts: number
│       ├── lastAttempt: Timestamp
│       ├── bestScore: number
│       └── passedAt: Timestamp | null
│
├── votes (collection)
│   └── {userId}_{filmId} (document)
│       ├── userId: string
│       ├── filmId: number
│       ├── rating: number (1-5)
│       └── timestamp: Timestamp
│
└── films (collection)
    └── {filmId} (document)
        ├── voteCount: number
        ├── totalStars: number
        ├── averageRating: number
        └── lastUpdate: Timestamp
```

## Security Architecture

### Firestore Security Rules

```
┌─────────────────────────────────────────┐
│     Security Rules (firestore.rules)    │
├─────────────────────────────────────────┤
│ users/{userId}                          │
│  ├─ Read: if authenticated              │
│  ├─ Create: if own data                 │
│  ├─ Update: if own data + valid         │
│  └─ Delete: DENY                        │
│                                         │
│ votes/{voteId}                          │
│  ├─ Read: if authenticated              │
│  ├─ Create: if authenticated            │
│  │           + voteId matches user      │
│  │           + rating 1-5               │
│  │           + no duplicate             │
│  ├─ Update: DENY (immutable)            │
│  └─ Delete: DENY                        │
│                                         │
│ films/{filmId}                          │
│  ├─ Read: PUBLIC                        │
│  ├─ Create/Update: if authenticated     │
│  │                  + valid math        │
│  └─ Delete: DENY                        │
└─────────────────────────────────────────┘
```

### Authentication Flow

```
Browser                Firebase Auth         Voting System
   │                        │                      │
   │──signInWithGoogle()──>│                      │
   │                        │                      │
   │<──Open OAuth Popup────│                      │
   │                        │                      │
   │──User Authorizes─────>│                      │
   │                        │                      │
   │<──Auth Token──────────│                      │
   │                        │                      │
   │                        │──onAuthStateChanged─>│
   │                        │                      │
   │<─────────────────Update UI─────────────────<│
```

## Performance Considerations

### Caching Strategy

```
Client-Side Cache:
├── filmesData (static, in memory)
├── questionPool (generated once)
└── currentUser (persisted in localStorage)

Firebase Cache:
├── Firestore: automatic offline cache
├── Auth: session tokens cached
└── Analytics: batched event sending
```

### Optimization Techniques

1. **Singleton Pattern**: Single instance of each manager
2. **Lazy Loading**: Quiz questions generated on demand
3. **Transaction Batching**: Vote + stats update atomic
4. **Real-time Selective**: Listeners only for viewed films
5. **Index Optimization**: Security rules use indexed fields

### Scalability

```
Concurrent Users: 1,000+
├── Auth: Firebase scales automatically
├── Firestore:
│   ├── Reads: 50K/day (free tier)
│   ├── Writes: 20K/day (free tier)
│   └── Transactions prevent race conditions
└── Analytics: Unlimited events
```

## Error Handling Strategy

```
Layer 1: Input Validation
    ├─► Type checking
    ├─► Range validation (1-5 stars)
    └─► Required field checks

Layer 2: Firebase Errors
    ├─► Network errors
    ├─► Permission errors
    └─► Quota errors

Layer 3: Business Logic Errors
    ├─► Already voted
    ├─► Quiz not passed
    └─► Not authenticated

Error Propagation:
    Manager → VotingSystem → Event → UI
```

## Testing Strategy

### Unit Tests (Recommended)

```
auth-manager.test.js
├── signInWithGoogle success/failure
├── signInWithEmail validation
├── createAccount validation
├── logout functionality
└── auth state observer

quiz-manager.test.js
├── generateQuiz returns 3 questions
├── validateAnswers correctness
├── passingScore calculation
├── saveQuizResult persistence
└── question pool generation

vote-manager.test.js
├── submitVote transaction
├── hasUserVoted check
├── getFilmStats calculation
├── listenToFilmVotes real-time
└── getTopRatedFilms sorting

voting-system.test.js
├── initialize flow
├── canVote eligibility
├── event emission
├── state management
└── error handling
```

### Integration Tests

```
Complete Flow:
1. Initialize system
2. Sign in user
3. Generate quiz
4. Submit quiz (pass)
5. Submit vote
6. Verify stats updated
7. Check real-time updates
8. Logout
```

## Deployment Architecture

```
Production Environment
│
├── Firebase Project (abitaca-8451c)
│   ├── Authentication
│   │   ├── Google OAuth
│   │   └── Email/Password
│   │
│   ├── Firestore Database
│   │   ├── users collection
│   │   ├── votes collection
│   │   └── films collection
│   │
│   ├── Security Rules
│   │   └── firestore.rules
│   │
│   └── Analytics
│       └── Event tracking
│
├── Static Assets
│   └── /assets/js/voting/
│       ├── auth-manager.js
│       ├── quiz-manager.js
│       ├── vote-manager.js
│       └── voting-system.js
│
└── Documentation
    ├── README.md
    ├── QUICK_START.md
    ├── ARCHITECTURE.md (this file)
    └── VOTING_SYSTEM_IMPLEMENTATION.md
```

## Monitoring & Observability

```
Firebase Console
├── Authentication
│   ├── Active users
│   ├── Sign-in methods
│   └── User list
│
├── Firestore
│   ├── Document counts
│   ├── Read/Write operations
│   └── Index performance
│
├── Analytics
│   ├── voting_login
│   ├── voting_quiz_completed
│   └── voting_vote_submitted
│
└── Performance
    ├── API response times
    ├── Transaction success rate
    └── Error rates
```

## Future Architecture Enhancements

1. **Cloud Functions** (optional):
   ```
   functions/
   ├── validateVote.js (server-side validation)
   ├── aggregateStats.js (scheduled stats update)
   └── sendNotifications.js (email on quiz pass)
   ```

2. **Caching Layer**:
   ```
   Redis or Firebase Hosting Cache
   ├── Top rated films (5 min TTL)
   ├── Film statistics (1 min TTL)
   └── User quiz status (10 min TTL)
   ```

3. **Admin Dashboard**:
   ```
   /admin
   ├── User management
   ├── Vote analytics
   ├── Quiz statistics
   └── Content moderation
   ```

## Technical Decisions

### Why Firebase?
- ✅ Real-time updates out of the box
- ✅ Automatic scaling
- ✅ Built-in authentication
- ✅ Generous free tier
- ✅ No server management

### Why Singleton Pattern?
- ✅ Single source of truth
- ✅ Consistent state across app
- ✅ Easy to test and mock
- ✅ Prevents multiple Firebase init

### Why Transactions?
- ✅ Atomic vote + stats update
- ✅ Prevents race conditions
- ✅ Data consistency guaranteed
- ✅ Rollback on failure

### Why Client-Side Quiz?
- ✅ Zero latency
- ✅ No server costs
- ✅ Dynamic from film data
- ✅ Easy to extend

## Summary

The voting system architecture is:
- **Modular**: Clear separation of concerns
- **Scalable**: Firebase handles growth automatically
- **Secure**: Comprehensive security rules
- **Real-time**: Live updates for all users
- **Testable**: Singleton pattern enables easy testing
- **Maintainable**: Well-documented and organized
- **Production-Ready**: Error handling, analytics, monitoring

Total system complexity: **Moderate**
Lines of code: **~1,500** (excluding UI)
Dependencies: **Firebase v10.8.0 only**
Deployment time: **< 5 minutes**
