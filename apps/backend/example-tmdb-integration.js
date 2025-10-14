/**
 * Example: TMDB + AnimeZey Integration
 * Shows how to use the complete AI-powered content discovery system
 */

import { TMDBService } from './tmdb-service.js';
import { ContentMatcherService } from './content-matcher-service.js';
import { AnimeZeyAPI } from '../play/assets/js/animezey-api.js';
import { AITaggingService } from './ai-tagging-service.js';
import { FirebaseStorageService } from './firebase-storage-service.js';

/**
 * Example 1: Get personalized recommendations based on user preferences
 */
async function examplePersonalizedRecommendations() {
    console.log('\n🎯 EXAMPLE 1: Personalized Recommendations\n');

    // Simulate user preferences from onboarding
    const userPreferences = {
        favoriteGenres: ['action', 'sci-fi', 'adventure'],
        favoriteMoods: ['intense', 'inspiring'],
        targetAudience: ['teen', 'adult']
    };

    console.log('User Preferences:', userPreferences);

    // Initialize services
    const tmdb = new TMDBService();
    const animezey = new AnimeZeyAPI();
    const matcher = new ContentMatcherService(tmdb, animezey);

    // Get personalized matches
    const matches = await matcher.getPersonalizedMatches(userPreferences.favoriteGenres, 5);

    console.log('\n📊 Results:');
    console.log(`- Movies found: ${matches.movies.length}`);
    console.log(`- TV shows found: ${matches.tv.length}`);
    console.log(`- Anime found: ${matches.anime.length}`);
    console.log(`- Total: ${matches.total}\n`);

    // Show examples
    if (matches.movies.length > 0) {
        console.log('🎬 Example Movie Match:');
        const movie = matches.movies[0];
        console.log(`  Title: ${movie.title}`);
        console.log(`  TMDB Rating: ${movie.vote_average}/10`);
        console.log(`  Match Score: ${(movie.matchScore * 100).toFixed(1)}%`);
        console.log(`  Streaming URL: ${movie.streamingUrl}`);
    }

    return matches;
}

/**
 * Example 2: Enrich AnimeZey content with TMDB metadata
 */
async function exampleContentEnrichment() {
    console.log('\n🌟 EXAMPLE 2: Content Enrichment\n');

    const tmdb = new TMDBService();
    const animezey = new AnimeZeyAPI();
    const matcher = new ContentMatcherService(tmdb, animezey);

    // Search for a popular movie
    const searchQuery = 'Spider-Man';
    console.log(`Searching for: "${searchQuery}"\n`);

    // Get enriched results (TMDB metadata + AnimeZey streaming)
    const enrichedResults = await matcher.searchWithEnrichment(searchQuery, 1);

    console.log(`Found ${enrichedResults.length} enriched results\n`);

    enrichedResults.slice(0, 3).forEach((result, i) => {
        console.log(`${i + 1}. ${result.title}`);
        console.log(`   Overview: ${result.overview?.substring(0, 100)}...`);
        console.log(`   Rating: ${result.vote_average}/10`);
        console.log(`   Has streaming: ${result.hasStreamingUrl ? 'Yes' : 'No'}`);
        console.log(`   Match score: ${(result.matchScore * 100).toFixed(1)}%\n`);
    });

    return enrichedResults;
}

/**
 * Example 3: Complete workflow with AI tagging and storage
 */
async function exampleCompleteWorkflow() {
    console.log('\n🚀 EXAMPLE 3: Complete AI Workflow\n');

    // Initialize all services
    const tmdb = new TMDBService();
    const animezey = new AnimeZeyAPI();
    const matcher = new ContentMatcherService(tmdb, animezey);
    const aiTagger = new AITaggingService();
    const firebaseStorage = new FirebaseStorageService();

    // User completes onboarding
    const userGenres = ['action', 'sci-fi'];
    console.log('1️⃣ User selects genres:', userGenres, '\n');

    // Get TMDB recommendations
    console.log('2️⃣ Getting TMDB recommendations...');
    const tmdbContent = await tmdb.getRecommendationsByPreferences(userGenres, 3);
    console.log(`   Found ${tmdbContent.movies.length} movies\n`);

    // Match with AnimeZey
    console.log('3️⃣ Matching with AnimeZey content...');
    const matches = await matcher.findMatches(tmdbContent.movies, 1);
    console.log(`   Found ${matches.length} matches\n`);

    if (matches.length > 0) {
        const firstMatch = matches[0];

        // Generate AI tags and embeddings
        console.log('4️⃣ Generating AI tags and embeddings...');
        const enriched = await aiTagger.enrichContent({
            name: firstMatch.title,
            url: firstMatch.streamingUrl,
            ...firstMatch
        });
        console.log(`   Genres: ${enriched.smartTags.genres.join(', ')}`);
        console.log(`   Embedding dimensions: ${enriched.embeddingDimensions}\n`);

        // Store in Firebase
        console.log('5️⃣ Storing in Firebase...');
        await firebaseStorage.storeContent(enriched);
        console.log('   ✅ Stored successfully\n');

        // Now content is ready for:
        // - Vector search
        // - Personalized recommendations
        // - Similar content discovery

        console.log('6️⃣ Content is now available for:');
        console.log('   ✓ Vector similarity search');
        console.log('   ✓ Personalized recommendations');
        console.log('   ✓ Smart content discovery\n');
    }
}

/**
 * Example 4: Trending content discovery
 */
async function exampleTrendingContent() {
    console.log('\n📈 EXAMPLE 4: Trending Content\n');

    const tmdb = new TMDBService();
    const animezey = new AnimeZeyAPI();
    const matcher = new ContentMatcherService(tmdb, animezey);

    // Get trending movies this week
    console.log('Getting trending movies this week...\n');
    const trending = await tmdb.getTrending('movie', 'week');

    console.log(`Found ${trending.length} trending movies\n`);

    // Try to match first 5 with AnimeZey
    const matches = await matcher.findMatches(trending.slice(0, 5), 1);

    console.log(`Matched ${matches.length} trending movies with streaming URLs\n`);

    matches.forEach((match, i) => {
        console.log(`${i + 1}. ${match.title} (${match.vote_average}/10)`);
        console.log(`   Popularity: ${match.popularity}`);
        console.log(`   Match: ${(match.matchScore * 100).toFixed(1)}%\n`);
    });

    return matches;
}

/**
 * Run all examples
 */
async function runAllExamples() {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║   TMDB + AnimeZey AI Integration Examples         ║');
    console.log('╚════════════════════════════════════════════════════╝');

    try {
        await examplePersonalizedRecommendations();
        await new Promise(resolve => setTimeout(resolve, 2000));

        await exampleContentEnrichment();
        await new Promise(resolve => setTimeout(resolve, 2000));

        await exampleTrendingContent();
        await new Promise(resolve => setTimeout(resolve, 2000));

        await exampleCompleteWorkflow();

        console.log('\n✅ All examples completed successfully!\n');
    } catch (error) {
        console.error('\n❌ Error running examples:', error);
    }
}

// Export for use in other modules
export {
    examplePersonalizedRecommendations,
    exampleContentEnrichment,
    exampleCompleteWorkflow,
    exampleTrendingContent,
    runAllExamples
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllExamples();
}
