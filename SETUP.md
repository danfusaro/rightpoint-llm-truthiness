# Setup Guide for LLM Truthiness Evaluator

This document provides step-by-step instructions for setting up and running the LLM Truthiness Evaluator application.

## Prerequisites

- Node.js 16.x or later
- npm 7.x or later
- An OpenAI API key

## Initial Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/rightpoint-llm-truthiness.git
   cd rightpoint-llm-truthiness
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Copy the example environment file:
     ```bash
     cp .env.example .env.local
     ```
   - Open `.env.local` in a text editor and configure your LLM API access:
   
     **Option 1: Standard OpenAI API** 
     ```
     OPENAI_API_KEY=your_actual_openai_api_key_here
     OPENAI_MODEL=gpt-4
     USE_AZURE_OPENAI=false
     ```
     
     **Option 2: Azure OpenAI API**
     ```
     USE_AZURE_OPENAI=true
     AZURE_OPENAI_API_KEY=your_azure_api_key_here
     AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/openai/deployments/your-deployment-name/chat/completions
     AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
     AZURE_OPENAI_API_VERSION=2025-01-01-preview
     ```

4. **Create data directory**:
   The application stores evaluation data in a `data` directory. Create it if it doesn't exist:
   ```bash
   mkdir -p data
   ```

## Running the Application

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Access the application**:
   Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## Using the Application

1. Click on "Start Evaluation" from the home page
2. Enter a question for the LLM to answer
3. Provide an authoritative source that contains factual information related to the question
4. Submit the form for evaluation
5. View the comparison results on the results page

## Troubleshooting

### API Rate Limits

If you encounter rate limit errors with the OpenAI API:
- The application has built-in retry logic (up to 3 attempts)
- Consider using a different model by setting the `OPENAI_MODEL` variable in your `.env.local` file
- If persistent, try again later when your rate limits reset
- Consider switching to Azure OpenAI which may have different rate limits

### Azure OpenAI Configuration

If you're having issues with Azure OpenAI:
- Ensure your `AZURE_OPENAI_ENDPOINT` is correctly formatted
- Verify that your deployment name (`AZURE_OPENAI_DEPLOYMENT_NAME`) matches exactly what's in your Azure portal
- Make sure the model deployed in Azure is compatible with the application's requirements
- Check that the `AZURE_OPENAI_API_VERSION` is supported by your Azure OpenAI resource

### Data Storage

Evaluation results are stored in `data/evaluations.json`. If you experience issues:
- Ensure the `data` directory exists and is writable
- Check that the JSON file hasn't been corrupted (should be valid JSON)
- If necessary, create an empty data file with:
  ```bash
  echo '{"evaluations":[]}' > data/evaluations.json
  ```

### Missing API Key

If you see errors about missing API keys:
- Double-check your `.env.local` file
- Ensure the application can read the environment variable
- Try restarting the development server

## Production Deployment

For production deployment:

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm start
   ```

Remember to set proper environment variables in your production environment.
