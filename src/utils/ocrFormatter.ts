/**
 * ocrFormatter.ts — Semantic structuring for OCR extracted text.
 * 
 * This utility takes jumbled text (especially from diagrams) and uses heuristics
 * to re-organize it into a logical, hierarchical structure.
 */

export const arrangeOCRText = (text: string): string => {
    if (!text) return '';

    // Split text into lines
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    // Heuristic: Identify potential headers, steps, and bullet points
    const formattedLines: string[] = [];
    
    // Pattern to detect "Step 1", "Phase A", "1. Title", etc.
    const stepPattern = /^(step|phase|part|section)\s+\d+|^\d+\.\s+\w+/i;
    
    // Pattern to detect labels that look like categories
    const categoryPattern = /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*:/;
    
    lines.forEach((line) => {
        const trimmed = line.trim();
        
        // 1. Check if it's a major Step/Header
        if (stepPattern.test(trimmed)) {
            formattedLines.push(`\n### ${trimmed}`);
        }
        // 2. Check if it looks like a Category/Label (e.g. "Input:", "Result:")
        else if (categoryPattern.test(trimmed)) {
            formattedLines.push(`\n**${trimmed}**`);
        }
        // 3. Check for specific keywords that likely start a new block
        else if (/^(Collection|Pipeline|Processing|Display|Caching|Sync|Persistence)/i.test(trimmed)) {
            formattedLines.push(`\n#### ${trimmed}`);
        }
        // 4. Otherwise, treat as a bullet point or detail
        else {
            // If the line is short or part of a list
            if (trimmed.length < 50 || trimmed.startsWith('•') || trimmed.startsWith('-')) {
                const cleanPoint = trimmed.replace(/^[•\-\*]\s*/, '');
                formattedLines.push(`- ${cleanPoint}`);
            } else {
                formattedLines.push(trimmed);
            }
        }
    });

    // Final clean up: Remove leading newlines and join
    return formattedLines.join('\n').trim();
};
