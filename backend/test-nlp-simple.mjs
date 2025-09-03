// Simplified test for NLPService that follows the successful pattern
import 'dotenv/config';
import NLPService from './services/NLPService.js';

// Create a more focused test
async function testNLPService() {
  console.log('Testing NLPService with simplified prompt...');
  
  try {
    // Print configuration for debugging
    console.log('Configuration:');
    console.log('- AZURE_OPENAI_ENDPOINT:', process.env.AZURE_OPENAI_ENDPOINT);
    console.log('- AZURE_OPENAI_API_VERSION:', process.env.AZURE_OPENAI_API_VERSION);
    console.log('- AZURE_OPENAI_DEPLOYMENT:', process.env.AZURE_OPENAI_DEPLOYMENT);
    console.log('- Client initialized:', !!NLPService.client);
    
    // Simplify the messages to reduce potential errors
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello, how are you?' }
    ];
    
    // Call the chat completions directly to test the client
    console.log('\nCalling OpenAI API directly...');
    const completion = await NLPService.client.chat.completions.create({
      messages,
      model: process.env.AZURE_OPENAI_DEPLOYMENT,
      temperature: 0.7,
      max_tokens: 100
    });
    
    console.log('\nSuccess! Response:');
    console.log(completion.choices[0].message);
    
    // Only if direct call succeeds, test the generate method
    console.log('\nTesting NLPService.generate()...');
    const response = await NLPService.generate(
      "I'm looking for a smartphone",
      { history: [], prefs: {} },
      ["iPhone 13 Pro - $999"]
    );
    
    console.log('\nNLP Response:');
    console.log(response);
  } catch (error) {
    console.error('\nError testing NLPService:');
    console.error('- Message:', error.message);
    console.error('- Status:', error.status);
    if (error.error) {
      console.error('- Error details:', error.error);
    }
  }
}

testNLPService();
