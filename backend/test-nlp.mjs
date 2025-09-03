// Test script for NLPService
import 'dotenv/config';
import NLPService from './services/NLPService.js';

async function testNLPService() {
  console.log('Testing NLPService...');
  
  // Check if the client is initialized
  console.log('Client initialized:', !!NLPService.client);
  
  // Test generate method
  try {
    const response = await NLPService.generate(
      "I'm looking for a new smartphone with good battery life",
      { 
        history: [],
        prefs: { budgetMax: 1000 }
      },
      ["iPhone 13 Pro - $999 - 128GB storage, A15 Bionic chip, 12MP camera, 6.1 inch display"]
    );
    
    console.log('NLP Response:', response);
  } catch (error) {
    console.error('Error testing NLPService:', error);
  }
}

testNLPService();
