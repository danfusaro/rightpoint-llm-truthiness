import OpenAI from "openai";
import { parseAzureOpenAIUrl } from "./azure-config";

// Get environment variables for API configuration
const useAzureOpenAI = process.env.USE_AZURE_OPENAI === "true";
const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
const azureDeploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o";
const azureApiVersion = process.env.AZURE_OPENAI_API_VERSION || "2025-01-01-preview";
const openaiApiKey = process.env.OPENAI_API_KEY;

// Check if we're in a vercel build environment with dummy keys
const isDummyKey = openaiApiKey === "dummy-key-for-build-only" || 
                  (useAzureOpenAI && azureApiKey === "dummy-key-for-build-only");

// Check if we're in a production environment
const isProduction = process.env.NODE_ENV === "production";

// Configure OpenAI client based on environment settings
let openai: OpenAI;

// In production with dummy keys, initialize with placeholder config
if (isProduction && isDummyKey) {
  console.log("Production build with dummy keys - initializing placeholder client");
  openai = new OpenAI({
    apiKey: "dummy-placeholder-key",
    baseURL: "https://api.openai.com/v1"
  });
} else if (useAzureOpenAI && azureApiKey && azureEndpoint) {
  // For Azure OpenAI, we should use the specific configuration
  // Parse the base domain from the endpoint URL - we just want the hostname part
  const domain = new URL(azureEndpoint).hostname;
  
  // We'll use the deployment name directly from the config
  console.log("Setting up Azure OpenAI client with:", {
    apiVersion: azureApiVersion,
    azureDeployment: azureDeploymentName,
    domain
  });
  
  // Use OpenAI client with Azure configuration
  // The baseURL needs to include the path to the deployments for Azure OpenAI
  const azureOpenAIUrl = `${azureEndpoint}/openai/deployments/${azureDeploymentName}`;
  console.log('Constructed Azure OpenAI URL:', azureOpenAIUrl);
  
  openai = new OpenAI({
    apiKey: azureApiKey,
    baseURL: azureOpenAIUrl,
    defaultQuery: { "api-version": azureApiVersion },
    defaultHeaders: { "api-key": azureApiKey }
  });
} else {
  // Initialize standard OpenAI client
  console.log("Setting up standard OpenAI client");
  openai = new OpenAI({
    apiKey: openaiApiKey,
  });
}

// Configuration for retries
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const RATE_LIMIT_RETRY_DELAY_MS = 2000;

/**
 * Sleep for the specified duration
 * @param ms - Time to sleep in milliseconds
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Query the LLM with a question and retry on failures
 * @param question - The question to ask
 * @param source - Optional authoritative source to include in the query
 * @returns The LLM's response
 */
export async function queryLLM(question: string, source?: string) {
  // Debug information about configuration
  console.log('LLM Config:', { 
    useAzureOpenAI, 
    hasAzureKey: !!azureApiKey,
    hasAzureEndpoint: !!azureEndpoint,
    azureEndpoint,
    azureDeploymentName,
    isProduction,
    isDummyKey
  });
  
  // If we're in production with dummy keys, use the fallback response
  if (isProduction && isDummyKey) {
    console.log('Using fallback response due to dummy keys in production');
    return getOfflineResponse(question, !!source);
  }
  
  let retries = 0;

  while (true) {
    try {
      let prompt = question;

      // If source is provided, include it in the prompt
      if (source) {
        prompt = `
Given the following authoritative source: 

${source}

Please answer this question based on the provided source: ${question}
`;
      }

      // Configure parameters
      const temperature = parseFloat(process.env.TEMPERATURE || "0.3");
      const maxTokens = parseInt(process.env.MAX_TOKENS || "500", 10);
      
      // For Azure OpenAI, we use the deployment name already configured in the client
      const model = useAzureOpenAI 
        ? azureDeploymentName
        : (process.env.OPENAI_MODEL || "gpt-4");
        
      console.log('Attempting LLM query with:', {
        provider: useAzureOpenAI ? 'Azure OpenAI' : 'OpenAI',
        model: model
      });
      
      try {
        // Log detailed information about the request we're about to make
        console.log('OpenAI client configuration:', {
          baseURL: openai.baseURL,
          provider: useAzureOpenAI ? 'Azure OpenAI' : 'OpenAI',
          model: model
        });
        
        // Create request parameters
        let requestParams: any = {
          messages: [
            { role: "system", content: "You are a helpful assistant. Provide accurate information and cite your sources when applicable." },
            { role: "user", content: prompt }
          ],
          temperature: temperature,
          max_tokens: maxTokens,
        };
        
        // Add model parameter (for both Azure and standard OpenAI)
        requestParams.model = model;
        
        console.log('Sending request with options:', JSON.stringify(requestParams, null, 2));
        
        // Make the API call
        const response = await openai.chat.completions.create(requestParams);
        
        console.log('LLM response received successfully');
        return response.choices[0].message.content || "No response generated";
      } catch (apiError) {
        console.error('Error in OpenAI API call:', apiError);
        throw apiError; // Rethrow to be caught by the retry logic
      }
    } catch (error: any) {
      retries++;
      
      // Log detailed error information
      console.error('LLM API Error Details:', {
        message: error.message,
        status: error.status,
        errorType: error.error?.type,
        errorCode: error.error?.code,
        errorMessage: error.error?.message,
      });

      // Check if we've hit the maximum number of retries
      if (retries >= MAX_RETRIES) {
        console.error(`Failed after ${MAX_RETRIES} retries:`, error);
        throw new Error(
          `Failed to get response from LLM after ${MAX_RETRIES} attempts: ${error.message}`
        );
      }

      // Handle rate limiting errors specially
      if (error.status === 429 || error.error?.type === "rate_limit_exceeded") {
        console.warn(
          `Rate limit exceeded, retrying in ${RATE_LIMIT_RETRY_DELAY_MS}ms... (Attempt ${retries} of ${MAX_RETRIES})`
        );
        await sleep(RATE_LIMIT_RETRY_DELAY_MS * retries); // Exponential backoff
      } else {
        console.warn(
          `Error occurred, retrying in ${RETRY_DELAY_MS}ms... (Attempt ${retries} of ${MAX_RETRIES})`
        );
        await sleep(RETRY_DELAY_MS);
      }

      // Continue to next iteration for retry
    }
  }
}

/**
 * Fallback function that returns a mock response when the API is completely unavailable
 * @param question - The question that was asked
 * @param withSource - Whether this is a response with source context
 * @returns A mock response
 */
export function getOfflineResponse(
  question: string,
  withSource = false
): string {
  if (withSource) {
    return `[MOCK RESPONSE WITH SOURCE] This is a simulated response to your question: "${question}". In a real implementation, this would be an answer based on the provided authoritative source.`;
  } else {
    return `[MOCK RESPONSE WITHOUT SOURCE] This is a simulated response to your question: "${question}". In a real implementation, this would be an answer based on the model's training data.`;
  }
}
