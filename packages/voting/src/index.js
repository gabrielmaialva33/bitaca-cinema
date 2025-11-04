// Bitaca Voting System - Shared Package
// Re-exports all voting modules

export { default as AuthManager } from './voting/auth-manager.js';
export { default as VoteManager } from './voting/vote-manager.js';
export { default as QuizManager } from './voting/quiz-manager.js';
export { VotingSystem } from './voting/voting-system.js';

// UI Components
export * from './voting/auth-ui.js';
export * from './voting/vote-ui.js';
export * from './voting/quiz-ui.js';

// Utilities
export * from './voting/d3-visualizations.js';
export * from './voting/voting-stats-dashboard.js';
