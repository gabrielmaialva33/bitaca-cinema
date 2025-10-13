# 🧪 Bitaca Cinema - Test Suite

## Quick Start

### Run Core Avatar Tests (Fast - 18s)
```bash
pnpm playwright test tests/e2e/avatar.spec.js --project="Desktop Chrome" \
  --grep="should show avatar toggle button|should toggle avatar on and off|should create 3D scene"
```

### Run All Avatar Tests
```bash
pnpm playwright test tests/e2e/avatar.spec.js
```

### Run Backend TTS Tests
```bash
cd backend && pytest tests/test_tts.py -v
```

## Test Results

✅ **Core Tests**: 3/3 passing (17.6s)
- Avatar toggle button appears
- Avatar enables/disables correctly  
- 3D scene renders successfully

📊 **Full Suite**: 15/21 passing
- Desktop: 100% passing
- Mobile: Some timeouts (under investigation)

## Files

- `e2e/avatar.spec.js` - Avatar E2E tests (12 scenarios)
- `backend/tests/test_tts.py` - TTS API tests (20 scenarios)
- `TEST_RESULTS.md` - Detailed test report

## Documentation

See [TEST_RESULTS.md](../TEST_RESULTS.md) for complete test results and analysis.
