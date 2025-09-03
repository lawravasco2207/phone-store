// Test script for NLPService with detailed logging
import 'dotenv/config';
import { AzureOpenAI } from 'openai';

async function testAzureOpenAI() {
  console.log('Testing Azure OpenAI...');
  
  // Print environment variables (masking sensitive values)
  console.log('AZURE_OPENAI_ENDPOINT:', process.env.AZURE_OPENAI_ENDPOINT);
  console.log('AZURE_OPENAI_API_KEY:', process.env.AZURE_OPENAI_API_KEY ? '***' : 'not set');
  console.log('AZURE_OPENAI_API_VERSION:', process.env.AZURE_OPENAI_API_VERSION);
  console.log('AZURE_OPENAI_DEPLOYMENT:', process.env.AZURE_OPENAI_DEPLOYMENT);
  
  try {
    // Initialize client
    const client = new AzureOpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      baseURL: process.env.AZURE_OPENAI_ENDPOINT,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview'
    });
    
    console.log('Client initialized successfully');
    
    // Test completion
    const completion = await client.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello, how are you?' }
      ],
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
      temperature: 0.7,
      max_tokens: 100
    });
    
    console.log('Response received:');
    console.log(completion.choices[0].message);
  } catch (error) {
    console.error('Error testing Azure OpenAI:');
    console.error('Message:', error.message);
    console.error('Status:', error.status);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testAzureOpenAI();
