"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processVideoTitle = processVideoTitle;
exports.preserveExactTitle = preserveExactTitle;
exports.isValidTitle = isValidTitle;
exports.generateFilenameFromTitle = generateFilenameFromTitle;
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
function generateFilenameFromTitle(title) {
    if (!title || typeof title !== 'string') {
        return 'Unknown_Video';
    }
    try {
        // Process the title first
        let filename = processVideoTitle(title);
        // Remove or replace characters that are not safe for filenames
        filename = filename
            .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
            .replace(/[^\x20-\x7E]/g, '') // Remove non-ASCII characters
            .replace(/\s+/g, '_') // Replace spaces with underscores
            .replace(/_{2,}/g, '_') // Replace multiple underscores with single
            .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
            .trim();
        // Limit filename length (Windows has 255 char limit, we'll use 100 for safety)
        if (filename.length > 100) {
            filename = filename.substring(0, 100).replace(/_+$/, '');
        }
        // Ensure filename is not empty
        if (!filename || filename.length === 0) {
            return 'Unknown_Video';
        }
        return filename;
    }
    catch (error) {
        console.warn('Error generating filename from title:', error);
        return 'Unknown_Video';
    }
}
//# sourceMappingURL=titleProcessor.js.map