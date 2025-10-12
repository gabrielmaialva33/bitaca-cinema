# Bitaca Cinema - Development Guidelines

## Project Overview

Bitaca Cinema is a vanilla HTML/CSS/JavaScript web application showcasing audiovisual productions from Capão Bonito/SP
funded by Lei Paulo Gustavo and PNAB. The project features an AI-powered chatbot using NVIDIA NIM API with RAG (
Retrieval Augmented Generation) capabilities.

**Key Technologies:**

- Vanilla JavaScript (ES6+)
- HTML5 / CSS3
- Chart.js (via CDN)
- NVIDIA NIM API (Qwen model)
- Vector embeddings for RAG search

---

## 1. Build & Configuration

### No Build System Required

This is a **vanilla JavaScript project** with no build tools or package managers. Files are served directly from the
filesystem or via a simple HTTP server.

### Project Structure

```
bitaca-cinema/
├── index.html                 # Main entry point
├── assets/
│   ├── css/
│   │   ├── styles.css        # Main styles
│   │   └── chatbot.css       # Chatbot-specific styles
│   ├── js/
│   │   ├── main.js           # Core application logic
│   │   ├── data.js           # Production data (filmesData array)
│   │   └── chatbot/
│   │       ├── bitaca-ai-chatbot.js    # Main chatbot controller
│   │       ├── intent-detector.js      # Intent classification
│   │       ├── streaming-handler.js    # API streaming
│   │       ├── rag-search.js          # Vector search
│   │       └── main-integration.js     # UI integration
│   ├── data/
│   │   └── embeddings.json   # Vector embeddings for RAG
│   └── vendors/
│       └── keenicons/        # Icon library
├── generate-embeddings.html   # Tool to generate embeddings
└── README.md
```

### Running the Project

**Option 1: Simple HTTP Server (Recommended)**

```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if http-server is installed)
npx http-server -p 8000
```

Then open `http://localhost:8000` in your browser.

**Option 2: Live Server (VS Code)**
Install the "Live Server" extension and right-click `index.html` → "Open with Live Server"

**Important:** CORS restrictions require serving files via HTTP, not opening `index.html` directly in the browser.

---

## 2. API Configuration

### NVIDIA NIM API Setup

The chatbot requires an NVIDIA NIM API key to function.

**API Details:**

- **Endpoint:** `https://integrate.api.nvidia.com/v1/chat/completions`
- **Model:** `qwen/qwen3-next-80b-a3b-thinking`
- **Authentication:** Bearer token

**Configuration Location:**
The API key is passed to the chatbot in `assets/js/chatbot/main-integration.js`:

```javascript
const chatbot = new BitacaAIChatbot('YOUR_API_KEY_HERE');
```

**To set up:**

1. Obtain an API key from [NVIDIA Build](https://build.nvidia.com/)
2. Replace `'YOUR_API_KEY_HERE'` in `main-integration.js`
3. Never commit API keys to version control

### RAG Embeddings Configuration

The chatbot uses vector embeddings for semantic search over production data.

**Embeddings File:** `assets/data/embeddings.json`

**Structure:**

```json
[
  {
    "id": 1,
    "titulo": "Production Title",
    "embedding": [
      0.123,
      -0.456,
      ...
    ],
    "metadata": {
      ...
    }
  }
]
```

**To generate embeddings:**

1. Open `generate-embeddings.html` in a browser
2. Ensure you have a valid NVIDIA API key configured
3. The page will generate embeddings from `filmesData` in `data.js`
4. Download the generated `embeddings.json` to `assets/data/`

**Fallback Behavior:**
If `embeddings.json` is not found, the chatbot will still function but RAG search will be disabled. The chatbot logs a
warning: "Embeddings file not found. RAG disabled."

---

## 3. Testing

### Testing Philosophy

This project uses simple, dependency-free Node.js tests for data validation. No testing framework is required.

### Running Tests

**Prerequisites:**

- Node.js installed (any recent version)

**Execute tests:**

```bash
node test-data.js
```

**Expected output:**

```
🧪 Running Bitaca Cinema Data Tests
==================================================
✅ PASS: filmesData is defined and is an array
✅ PASS: filmesData contains at least one production
✅ PASS: All productions have required fields
✅ PASS: All production IDs are unique
✅ PASS: All productions have valid status values
✅ PASS: All productions have a genre defined
✅ PASS: All productions have a title defined
✅ PASS: All productions have a director defined
==================================================
📊 Test Results:
   ✅ Passed: 8
   ❌ Failed: 0
   📈 Total:  8
   🎯 Success Rate: 100.0%
🎉 All tests passed!
```

### Creating New Tests

Tests follow a simple pattern:

```javascript
// Mock browser environment
global.window = {};

// Load data
const dataFile = fs.readFileSync('./assets/js/data.js', 'utf-8');
eval(dataFile);
const filmesData = global.window.filmesData;

// Test function
function test(description, assertion) {
    try {
        if (assertion()) {
            console.log(`✅ PASS: ${description}`);
            passed++;
        } else {
            console.log(`❌ FAIL: ${description}`);
            failed++;
        }
    } catch (error) {
        console.log(`❌ FAIL: ${description} - ${error.message}`);
        failed++;
    }
}

// Write tests
test('Your test description', () => {
    return /* boolean condition */;
});
```

### Test Coverage

Current tests validate:

- Data structure integrity (array type, non-empty)
- Required field presence (id, titulo, diretor, genero, status)
- Data constraints (unique IDs, valid status values)
- Data quality (non-empty strings for critical fields)

**Recommended additional tests:**

- Chatbot intent detection accuracy
- RAG search relevance
- UI interaction flows (using browser automation tools)
- API integration mocks

---

## 4. Code Style & Architecture

### JavaScript Patterns

**Module Organization:**

- Each feature has its own function scope
- No global namespace pollution
- Event listeners attached in init functions
- DOMContentLoaded initialization pattern

**Example structure:**

```javascript
document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initFilters();
    initChatbot();
});

function initNavigation() {
    // Navigation logic
}
```

**Class-Based Components:**
For complex features (like the chatbot), ES6 classes are used:

```javascript
class BitacaAIChatbot {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.conversationHistory = [];
    }

    async initialize() {
        // Setup logic
    }

    async sendMessage(message) {
        // Message handling
    }
}
```

### Data Management

**Central Data Source:** `assets/js/data.js`

All production data is stored in the `filmesData` array:

```javascript
const filmesData = [
    {
        id: 1,
        titulo: 'Production Title',
        diretor: 'Director Name',
        duracao: '15-20 min',
        genero: 'Documentary',
        status: 'producao',  // lancado, producao, pre-producao, pos-producao
        tema: 'musica',      // musica, patrimonio, identidade
        pontuacaoLPG: 238,
        pontuacaoPNAB: 98,
        sinopse: 'Description...',
        estreia: '2025'
    }
];
```

**Accessing Data:**

- In browser: `window.filmesData`
- In Node tests: Mock `global.window` and eval the file

### Chatbot Architecture

**Component Breakdown:**

1. **BitacaAIChatbot** (main controller)
    - Orchestrates all chatbot components
    - Manages conversation history
    - Coordinates RAG and API calls

2. **IntentDetector**
    - Classifies user intent
    - Determines if RAG search is needed
    - Returns intent type and confidence

3. **StreamingHandler**
    - Manages streaming responses from NVIDIA API
    - Handles SSE (Server-Sent Events) parsing
    - Yields tokens as they arrive

4. **VectorSearch** (in rag-search.js)
    - Performs semantic similarity search
    - Hybrid search (vector + keyword)
    - Cosine similarity calculations

5. **main-integration.js**
    - DOM event handlers
    - UI updates (message rendering, typing indicators)
    - User interaction management

### API Integration Best Practices

**Error Handling:**

```javascript
try {
    const response = await fetch(apiEndpoint, options);
    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }
    // Process response
} catch (error) {
    console.error('API call failed:', error);
    // Graceful degradation
}
```

**Streaming Pattern:**

```javascript
async * streamResponse(messages)
{
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    while (true) {
        const {done, value} = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        // Process chunk
        yield token;
    }
}
```

### CSS Architecture

**Methodology:** Component-based with BEM-like naming

```css
.chatbot-container {
}

.chatbot-header {
}

.chatbot-header__title {
}

.chatbot-messages {
}

.chatbot-input-area {
}
```

**Key CSS Files:**

- `styles.css` - Main site styles (grid, navigation, cards)
- `chatbot.css` - Isolated chatbot styles

### Accessibility Considerations

- ARIA labels on interactive elements
- Keyboard navigation support
- Semantic HTML structure
- Alt text for images (when applicable)

Example:

```html

<button
        class="chatbot-fab"
        id="chatbot-fab"
        aria-label="Abrir assistente Bitaca AI">
```

---

## 5. Common Development Tasks

### Adding a New Production

1. Edit `assets/js/data.js`
2. Add new object to `filmesData` array:
   ```javascript
   {
     id: 99, // Unique ID
     titulo: 'New Production',
     diretor: 'Director Name',
     duracao: '15 min',
     genero: 'Documentary',
     status: 'producao',
     tema: 'identidade',
     pontuacaoLPG: 200,
     pontuacaoPNAB: null,
     sinopse: 'Description',
     estreia: '2025'
   }
   ```
3. Run tests: `node test-data.js`
4. Regenerate embeddings if using RAG (via `generate-embeddings.html`)

### Modifying Chatbot Behavior

**System Prompt:** Located in `bitaca-ai-chatbot.js` → `buildSystemPrompt()` method
**Intent Classification:** Modify rules in `intent-detector.js`
**RAG Parameters:** Adjust in `rag-search.js` → `hybridSearch()` method

### Debugging Tips

**Browser Console:**
The chatbot logs detailed information:

```
🤖 Initializing Bitaca AI Chatbot...
✅ RAG initialized with 23 embeddings
📍 Intent detected: search_productions (confidence: 0.95)
🔍 Performing RAG search...
✅ Found 3 relevant productions
```

**Common Issues:**

1. **Chatbot not responding:**
    - Check API key is valid
    - Verify network tab for API errors
    - Check browser console for JavaScript errors

2. **RAG not working:**
    - Ensure `embeddings.json` exists in `assets/data/`
    - Check file is valid JSON
    - Verify embeddings were generated with correct model

3. **Data not displaying:**
    - Verify `filmesData` is properly defined in `data.js`
    - Check for JavaScript syntax errors
    - Ensure file is loaded before `main.js`

---

## 6. Deployment

### Static Hosting

This project can be deployed to any static hosting service:

- **GitHub Pages:** Commit files and enable Pages in repository settings
- **Netlify:** Drag and drop project folder
- **Vercel:** Connect repository or upload folder
- **AWS S3 + CloudFront:** Upload as static website

**Pre-deployment checklist:**

1. ✅ Remove or obfuscate API keys
2. ✅ Verify all asset paths are relative
3. ✅ Test on local server before deploying
4. ✅ Ensure `embeddings.json` is included if using RAG
5. ✅ Validate HTML/CSS/JS for errors

### Environment-Specific Configuration

For production, consider:

- Moving API key to environment variable or backend proxy
- Implementing rate limiting for API calls
- Minifying CSS/JS files (optional, currently not minified)
- Enabling caching headers for static assets

---

## 7. Future Improvements

**Potential Enhancements:**

1. **Testing:**
    - Add browser automation tests (Playwright/Cypress)
    - API mocking for chatbot tests
    - Visual regression testing

2. **Performance:**
    - Lazy load images
    - Implement service worker for offline support
    - Consider code splitting for chatbot modules

3. **Features:**
    - User authentication for personalized recommendations
    - Production rating/review system
    - Social sharing improvements
    - Multi-language support

4. **Infrastructure:**
    - Backend API for secure key management
    - Database for dynamic production data
    - Admin panel for content management

---

## Contact & Support

For questions about this codebase:

- Review the detailed `README.md` for project context
- Check browser console logs for debugging information
- Examine individual JS files - they contain inline comments
- Test data integrity with `node test-data.js`

**Last Updated:** 2025-10-11
