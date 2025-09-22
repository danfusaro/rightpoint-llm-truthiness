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
 * Clean HTML content using LLM
 */
async function cleanHtmlContent(htmlContent: string): Promise<string> {
  try {
    const prompt = `
The following is HTML content from a webpage. Extract and return ONLY the main text content that would be useful for analysis.
Remove all HTML tags, scripts, styles, navigation elements, ads, and other non-content elements.
Format the text as plain, readable content preserving only the meaningful information.
Keep paragraphs separated with line breaks for readability.
Do not include any formatting, HTML tags, or commentary in your response.
If the content is very long, prioritize what seems most relevant and informative.

HTML Content:
${htmlContent.substring(0, 20000)} // Limit size to avoid token issues
`;

    const cleanedContent = await queryLLM(prompt);
    return cleanedContent;
  } catch (error) {
    console.error('Error cleaning HTML content with LLM:', error);
    // Fall back to a basic cleaning if LLM fails
    return basicHtmlCleaning(htmlContent);
  }
}

/**
 * Basic HTML cleaning as fallback
 */
function basicHtmlCleaning(htmlContent: string): string {
  // Remove scripts, styles, and HTML tags with a simple regex approach
  let cleanText = htmlContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleanText;
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
    const htmlContent = await fetchUrl(url);
    
    // Clean HTML content
    result.content = await cleanHtmlContent(htmlContent);
    result.isSuccess = true;
    
    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error processing URL';
    return result;
  }
}
