# LLM Truthiness Evaluator

A proof-of-concept application for evaluating the truthfulness of Large Language Model (LLM) responses against authoritative sources.

## Overview

This application assesses how truthful LLM responses are by:

1. First querying the LLM without an authoritative source
2. Then querying it again with the source provided
3. Comparing the two responses to identify differences, alignment with the source, error admissions, and generating a "truthiness" score

## Features

- Input questions and authoritative sources for evaluation
- Query OpenAI's GPT models with and without the source information
- Automatic comparison and difference detection between responses
- Measurement of source alignment and error admission
- Generation of a truthiness score based on multiple factors
- Persistence of all inputs, outputs, and evaluation metrics for future analysis

## Getting Started

### Prerequisites

- Node.js 16.x or later
- npm 7.x or later
- OpenAI API key

### Installation

1. Clone the repository:
```
git clone https://github.com/your-username/llm-truthiness.git
cd llm-truthiness
```

2. Install dependencies:
```
npm install
```

3. Create a `.env.local` file in the project root with your OpenAI API key:
```
OPENAI_API_KEY=your_api_key_here
```

4. Start the development server:
```
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Navigate to the evaluation page
2. Enter a question that you want to evaluate
3. Provide an authoritative source text that contains factual information
4. Submit for evaluation
5. View the comparison results and truthiness score

## Technical Details

- Built with Next.js 14 and TypeScript
- Uses React for the frontend components
- Tailwind CSS for styling
- OpenAI API for LLM queries
- File-based JSON storage for persistence (for simplicity in this POC)

## Future Improvements

- More sophisticated NLP techniques for response comparison
- Support for multiple LLM providers
- User authentication and evaluation history
- Batch processing of multiple evaluations
- Visualization of truthiness trends across different topics
- Integration with vector databases for more efficient source retrieval
