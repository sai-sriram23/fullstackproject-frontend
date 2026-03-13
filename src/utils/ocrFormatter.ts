/**
 * ocrFormatter.ts — Semantic structuring for OCR extracted text.
 * 
 * This utility takes jumbled text (especially from diagrams) and uses heuristics
 * to re-organize it into a logical, hierarchical structure.
 */

export const arrangeOCRText = (text: string): string => {
    if (!text) return '';

    // Step 1: Normalize whitespace and handle potential missing newlines before keywords
    // Many OCR engines bunch text together. Let's add newlines before common keywords.
    let processed = text
        .replace(/\s+/g, ' ')
        .replace(/(Step\s+\d+|Phase\s+\d+|[A-Z][a-z]+(\s+[A-Z][a-z]+)*:)/g, '\n$1')
        .replace(/(Pipeline|Workflow|Input|Output|Processing|Storage|Caching|Security|Display)/g, '\n$1');

    // Split into lines and clean
    const lines = processed.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    const formattedLines: string[] = [];
    
    // Patterns
    const headerPattern = /^(step|phase|part|section|workflow)\s+\d+|^(introduction|overview|architecture|conclusion|summary|background)$/i;
    const categoryPattern = /^[A-Z][a-z0-9]+(\s+[A-Z][a-z0-9]+)*:$/; // Ends with colon
    const itemPattern = /^\s*[\-\•\*]\s*/;

    lines.forEach((line) => {
        // 1. Check for Major Headers (Step 1, Workflow, etc.)
        if (headerPattern.test(line)) {
            formattedLines.push(`\n# ${line.replace(/^#+\s*/, '')}`);
        }
        // 2. Check for Section Labels (Category: )
        else if (categoryPattern.test(line) || /^(Pipeline|Processing|Storage|Caching|Security|Display)$/i.test(line)) {
            formattedLines.push(`\n## ${line}`);
        }
        // 3. Handle Lists
        else if (itemPattern.test(line)) {
            formattedLines.push(`- ${line.replace(itemPattern, '')}`);
        }
        // 4. Detailed content (if line is short and looks like a list item but has no bullet)
        else if (line.length < 60 && !line.includes('.')) {
            formattedLines.push(`- ${line}`);
        }
        // 5. Default Paragraph
        else {
            formattedLines.push(line);
        }
    });

    // Post-formatting: ensure clear separation between groups
    return formattedLines.join('\n')
        .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
        .trim();
};
