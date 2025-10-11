# Testes - Bitaca Cinema

## Setup

```bash
pnpm install
pnpm playwright:install
```

## Executar

### Testes E2E Local

```bash
pnpm serve  # Terminal 1
pnpm test:e2e  # Terminal 2
```

### Testes E2E Produção (GitHub Pages)

```bash
pnpm test:e2e:production
```

### Testes com UI

```bash
pnpm test:e2e:ui
```

## Cobertura

- Responsividade (Desktop, Tablet, Mobile)
- Funcionalidade do Video Recorder
- Performance (carregamento < 3s)
- Screenshots automáticos em `tests/screenshots/`

## Tecnologias

- Playwright - E2E testing
- Jest - Unit testing (futuro)
