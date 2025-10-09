"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processVideoTitle = processVideoTitle;
exports.preserveExactTitle = preserveExactTitle;
exports.isValidTitle = isValidTitle;
const html_entities_1 = require("html-entities");
function processVideoTitle(rawTitle) {
    if (!rawTitle || typeof rawTitle !== 'string') {
        return 'Unknown Video';
    }
    try {
        let processedTitle = rawTitle;
        // Decode HTML entities
        if (/&[a-zA-Z0-9#]+;/.test(processedTitle)) {
            processedTitle = (0, html_entities_1.decode)(processedTitle, { level: 'html5' });
        }
        // Remove control characters
        processedTitle = processedTitle.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        // Trim whitespace
        if (processedTitle.startsWith('  ') || processedTitle.endsWith('  ')) {
            processedTitle = processedTitle.trim();
        }
        if (!processedTitle || processedTitle.length === 0) {
            return 'Unknown Video';
        }
        return processedTitle;
    }
    catch (error) {
        console.warn('Error processing video title:', error);
        return rawTitle || 'Unknown Video';
    }
}
function preserveExactTitle(rawTitle) {
    if (!rawTitle || typeof rawTitle !== 'string') {
        return 'Unknown Video';
    }
    if (rawTitle.trim().length === 0) {
        return 'Unknown Video';
    }
    return rawTitle;
}
function isValidTitle(title) {
    if (!title || typeof title !== 'string') {
        return false;
    }
    if (title.trim().length === 0) {
        return false;
    }
    try {
        const encoded = encodeURIComponent(title);
        const decoded = decodeURIComponent(encoded);
        return decoded === title;
    }
    catch (error) {
        return false;
    }
}
//# sourceMappingURL=titleProcessor.js.map