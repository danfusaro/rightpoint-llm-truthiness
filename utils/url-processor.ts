import { queryLLM } from './openai';

interface UrlProcessingResult {
  content: string;
  captureDate: string;
  isSuccess: boolean;
  error?: string;
}

/**
 * Regular expression to validate a URL
 */
export function isValidUrl(url: string): boolean {
  try {
    // Check if the string can be parsed as a URL
    new URL(url);
    
    // Additional check for common protocols
    const urlRegex = /^(https?):\/\/[^\s/$.?#].[^\s]*$/i;
    return urlRegex.test(url);
  } catch (e) {
    return false;
  }
}

/**
 * Fetch content from a URL and return it
 */
async function fetchUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TruthinessEvaluator/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error('Error fetching URL:', error);
    throw new Error(`Failed to access URL: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Clean HTML content using LLM with enhanced extraction
 */
async function cleanHtmlContent(htmlContent: string): Promise<string> {
  try {
    // First, use a more advanced HTML parsing to extract key elements
    const parsedContent = advancedHtmlParsing(htmlContent);
    
    const prompt = `
The following is content from a webpage. Extract ALL the meaningful text content that would be useful for analysis and fact-checking.

IMPORTANT INSTRUCTIONS:
- Preserve ALL text that appears to be part of the main content, including headlines, paragraphs, lists, and descriptive text.
- Include headlines, taglines, and key messaging exactly as they appear.
- Keep ALL factual information, product descriptions, and important details.
- Maintain the original structure with proper line breaks between sections.
- Do not summarize or omit information - we need the COMPLETE content for accurate fact-checking.
- Remove only navigation elements, repetitive footers, and clearly irrelevant content.

Content to extract:
${parsedContent}
`;

    const cleanedContent = await queryLLM(prompt);
    
    // If LLM response is too short compared to parsed content, it might have filtered too much
    if (cleanedContent.length < parsedContent.length / 10 && parsedContent.length > 1000) {
      console.log('LLM response seems too short, falling back to parsed content');
      return parsedContent;
    }
    
    return cleanedContent;
  } catch (error) {
    console.error('Error cleaning HTML content with LLM:', error);
    // Fall back to advanced parsing if LLM fails
    return advancedHtmlParsing(htmlContent);
  }
}

/**
 * Advanced HTML parsing to extract meaningful content
 */
function advancedHtmlParsing(htmlContent: string): string {
  try {
    // Step 1: Remove all script and style elements
    let content = htmlContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Step 2: Extract content from key elements that likely contain important information
    const mainContentPatterns = [
      /<h1[^>]*>([\s\S]*?)<\/h1>/gi,
      /<h2[^>]*>([\s\S]*?)<\/h2>/gi,
      /<h3[^>]*>([\s\S]*?)<\/h3>/gi,
      /<p[^>]*>([\s\S]*?)<\/p>/gi,
      /<article[^>]*>([\s\S]*?)<\/article>/gi,
      /<section[^>]*>([\s\S]*?)<\/section>/gi,
      /<div[^>]*?(?:class|id)[^>]*?(?:content|main|article|body)[^>]*>([\s\S]*?)<\/div>/gi,
      /<main[^>]*>([\s\S]*?)<\/main>/gi,
      /<li[^>]*>([\s\S]*?)<\/li>/gi,
      /<span[^>]*>([\s\S]*?)<\/span>/gi,
    ];
    
    // Extract text from all matched patterns
    let extractedContent = '';
    mainContentPatterns.forEach(pattern => {
      let matches = content.match(pattern);
      if (matches) {
        extractedContent += matches.join('\n') + '\n';
      }
    });
    
    // If we've extracted some content, use it. Otherwise, use the whole body
    if (extractedContent.trim().length > 0) {
      content = extractedContent;
    } else {
      // Try to extract just the body
      const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch && bodyMatch[1]) {
        content = bodyMatch[1];
      }
    }
    
    // Step 3: Clean the remaining HTML tags but preserve structure
    content = content
      .replace(/<br\s*\/?>/gi, '\n') // Replace <br> with newlines
      .replace(/<\/p>|<\/div>|<\/h\d>|<\/li>/gi, '\n') // Add newlines after key closing tags
      .replace(/<[^>]*>/g, '') // Remove all remaining HTML tags
      .replace(/&nbsp;/g, ' ') // Replace HTML entities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
    
    // Step 4: Clean up whitespace while preserving structure
    content = content
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines to max 2
      .replace(/\s{2,}/g, ' ') // Reduce multiple spaces to one
      .split('\n') // Split by lines
      .map(line => line.trim()) // Trim each line
      .filter(line => line.length > 0) // Remove empty lines
      .join('\n'); // Join back with newlines
    
    return content;
  } catch (error) {
    console.error('Error in advanced HTML parsing:', error);
    return basicHtmlCleaning(htmlContent);
  }
}

/**
 * Basic HTML cleaning as fallback
 */
function basicHtmlCleaning(htmlContent: string): string {
  // More robust basic cleaning
  try {
    // Remove all script, style, svg, nav, header, and footer elements
    let cleanText = htmlContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '');
      
    // Replace common break elements with newlines
    cleanText = cleanText
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>|<\/div>|<\/h\d>|<\/li>/gi, '\n');
      
    // Remove all remaining HTML tags
    cleanText = cleanText
      .replace(/<[^>]*>/g, '');
      
    // Replace common HTML entities
    cleanText = cleanText
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
      
    // Clean up whitespace
    cleanText = cleanText
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n')
      .trim();

    return cleanText;
  } catch (error) {
    console.error('Error in basic HTML cleaning:', error);
    // Ultra-simple fallback
    return htmlContent
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

/**
 * Fetch, validate and process URL content
 */
export async function processUrl(url: string): Promise<UrlProcessingResult> {
  const result: UrlProcessingResult = {
    content: '',
    captureDate: new Date().toISOString(),
    isSuccess: false
  };

  try {
    // Validate URL format
    if (!isValidUrl(url)) {
      result.error = 'Invalid URL format';
      return result;
    }

    // Fetch HTML content from URL
    console.log(`Fetching content from URL: ${url}`);
    const htmlContent = await fetchUrl(url);
    console.log(`Fetched ${htmlContent.length} bytes of HTML content`);
    
    // Process the content - first try with LLM-enhanced extraction
    console.log('Processing HTML content...');
    const startTime = Date.now();
    result.content = await cleanHtmlContent(htmlContent);
    console.log(`Content processing completed in ${(Date.now() - startTime)/1000} seconds`);
    
    // Quality check - if result is too short, try advanced parsing directly
    if (result.content.length < 200 && htmlContent.length > 5000) {
      console.log('Content extraction seems incomplete, trying advanced parsing directly');
      result.content = advancedHtmlParsing(htmlContent);
    }
    
    // Final check - if we still don't have much content, do basic cleaning
    if (result.content.length < 100 && htmlContent.length > 1000) {
      console.log('Still insufficient content, falling back to basic cleaning');
      result.content = basicHtmlCleaning(htmlContent);
    }
    
    console.log(`Final extracted content length: ${result.content.length} characters`);
    result.isSuccess = true;
    
    return result;
  } catch (error) {
    console.error('Error in processUrl:', error);
    result.error = error instanceof Error ? error.message : 'Unknown error processing URL';
    return result;
  }
}
