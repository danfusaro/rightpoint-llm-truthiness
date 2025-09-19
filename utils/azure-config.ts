// Azure OpenAI configuration helper

// Parse URL format
export function parseAzureOpenAIUrl(fullUrl: string) {
  // The URL format is https://oai-sds-dev1.openai.azure.com/openai/deployments/gpt-4o/chat/completions
  try {
    const urlObj = new URL(fullUrl);
    
    // Extract base URL - e.g., https://oai-sds-dev1.openai.azure.com
    const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;

    // Extract deployment name if present in path
    // The path format is /openai/deployments/{deployment_name}/chat/completions
    const pathParts = urlObj.pathname.split('/');
    const deploymentIndex = pathParts.findIndex(part => part === 'deployments') + 1;
    const deploymentName = deploymentIndex > 0 && deploymentIndex < pathParts.length 
      ? pathParts[deploymentIndex] 
      : null;
      
    return {
      baseUrl,
      deploymentName,
      fullUrl,
      isValid: !!baseUrl
    };
  } catch (error) {
    console.error('Error parsing Azure OpenAI URL:', error);
    return {
      baseUrl: null,
      deploymentName: null,
      fullUrl,
      isValid: false
    };
  }
}
