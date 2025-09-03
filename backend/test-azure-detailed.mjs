// More detailed test script for Azure OpenAI with proper URL construction
import 'dotenv/config';
import { AzureOpenAI } from 'openai';

async function testAzureOpenAI() {
  console.log('Testing Azure OpenAI with detailed debugging...');
  
  // Get environment variables
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2023-05-15'; // Use a known stable version
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';
  
  console.log('Configuration:');
  console.log('- Endpoint:', endpoint);
  console.log('- API Version:', apiVersion);
  console.log('- Deployment:', deploymentName);
  
  try {
    // Initialize Azure OpenAI client
    const client = new AzureOpenAI({
      apiKey,
      endpoint, // Using endpoint instead of baseURL for clarity
      apiVersion,
    });
    
    console.log('\nTrying to call Azure OpenAI API...');
    
    // Test completion with explicit URL construction
    const completion = await client.chat.completions.create({
      deployment_id: deploymentName, // Use deployment_id parameter
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello, how are you?' }
      ],
      temperature: 0.7,
      max_tokens: 100
    });
    
    console.log('\nSuccess! Response received:');
    console.log(completion.choices[0].message);
  } catch (error) {
    console.error('\nError testing Azure OpenAI:');
    console.error('- Message:', error.message);
    console.error('- Status:', error.status);
    
    // Print more detailed error information
    if (error.response) {
      console.error('- Response data:', error.response.data);
    }
    
    console.log('\nTrying alternative API version and parameters...');
    try {
      // Try with different parameter structure
      const client2 = new AzureOpenAI({
        apiKey,
        endpoint,
        apiVersion: '2023-05-15', // Use a known stable version
      });
      
      const completion = await client2.chat.completions.create({
        model: deploymentName, // Try with model parameter instead
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello, how are you?' }
        ],
        temperature: 0.7,
        max_tokens: 100
      });
      
      console.log('\nSuccess with alternative approach! Response:');
      console.log(completion.choices[0].message);
    } catch (error2) {
      console.error('\nAlternative approach also failed:');
      console.error('- Message:', error2.message);
      console.error('- Status:', error2.status);
    }
  }
}

testAzureOpenAI();
