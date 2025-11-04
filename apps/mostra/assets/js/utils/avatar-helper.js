// ===============================================
// AVATAR HELPER
// Utility functions for avatar generation
// ===============================================

/**
 * Generate avatar URL based on username
 * @param {string} name - Full name or username
 * @returns {string} Avatar URL
 */
function getAvatarUrl(name) {
    if (!name) {
        return 'https://avatar.iran.liara.run/public';
    }

    // Clean and format name
    const cleanName = name.trim().replace(/\s+/g, '+');
    return `https://avatar.iran.liara.run/username?username=${cleanName}`;
}

/**
 * Generate avatar HTML img tag
 * @param {string} name - Full name or username
 * @param {string} altText - Alt text for image
 * @param {string} cssClass - CSS class for styling
 * @returns {string} HTML img tag
 */
function getAvatarHtml(name, altText = '', cssClass = 'avatar') {
    const url = getAvatarUrl(name);
    const alt = altText || name || 'Avatar';
    return `<img src="${url}" alt="${alt}" class="${cssClass}" />`;
}

/**
 * Get bot avatar (fixed avatar for consistency)
 * @returns {string} Bot avatar URL
 */
function getBotAvatarUrl() {
    return 'https://avatar.iran.liara.run/username?username=Bitaca+Cinema';
}

/**
 * Get user avatar (generic user)
 * @returns {string} User avatar URL
 */
function getUserAvatarUrl() {
    return 'https://avatar.iran.liara.run/public/boy';
}

/**
 * Get director avatar with fallback
 * @param {string} directorName - Director full name
 * @returns {string} Director avatar URL
 */
function getDirectorAvatarUrl(directorName) {
    return getAvatarUrl(directorName);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getAvatarUrl,
        getAvatarHtml,
        getBotAvatarUrl,
        getUserAvatarUrl,
        getDirectorAvatarUrl
    };
}
