# Voice-Enabled Shopping Assistant Documentation

This document outlines the implementation of the voice-enabled shopping assistant that extends the existing chatbot functionality in the Phone Store application.

## Overview

The voice-enabled shopping assistant allows users to interact with the e-commerce site using voice commands and receive both voice and text responses. The assistant can control the UI to search for products, show product details, manage the cart, and initiate checkout.

## Architecture

The implementation follows a two-pane layout:
- **Left Panel**: Chat and voice conversation interface
- **Right Panel**: AI-driven shopping panel (products, product details, cart, checkout)

### Components

1. **VoiceChatBot.tsx**: Main component that integrates speech recognition, speech synthesis, and the chat interface
2. **ShoppingPanel.tsx**: Renders the appropriate view based on the AI assistant's actions
3. **Backend Chat Endpoint**: Enhanced to support tool calls that control the UI

### Web Speech API Integration

The implementation uses two key browser APIs:
- **SpeechRecognition**: For converting user's speech to text
- **SpeechSynthesis**: For converting the assistant's text responses to speech

## Security Features

1. **Automatic Voice Deactivation**: Voice input is automatically disabled during checkout to prevent sensitive information capture
2. **Secure Mode Indicator**: A clear "Secure Mode" banner is displayed during checkout
3. **Iframe Isolation**: Checkout is loaded in a sandboxed iframe
4. **No PII Handling**: The assistant is instructed never to request or store sensitive data

## Tool Calls

The assistant can invoke the following functions to control the UI:

1. **searchProducts(query: string)**: Displays search results in the shopping panel
2. **showProduct(id: string)**: Shows detailed information about a specific product
3. **addToCart(id: string)**: Adds a product to the cart
4. **removeFromCart(id: string)**: Removes a product from the cart
5. **openCheckout()**: Opens the checkout process and activates secure mode

## Usage Flow

1. User opens the chat by clicking the chat button
2. User can interact by typing or clicking the microphone button to speak
3. Assistant responds with text and voice (if supported by the browser)
4. As the conversation progresses, the shopping panel updates based on the context
5. When the user is ready to checkout, the assistant guides them to a secure checkout process

## Browser Compatibility

The voice features require:
- Web Speech API support (most modern browsers)
- Speech Recognition API (Chrome, Edge, Safari 14.1+)
- Speech Synthesis API (widely supported)

The application gracefully degrades when these APIs are not available.

## Maintenance Notes

### Adding New Tool Calls

To add new tool calls:

1. Define the function signature in the backend chat endpoint
2. Add the handler in the `handleToolCalls` function in VoiceChatBot.tsx
3. Update the system prompt to instruct the AI about the new capability

### Modifying Voice Behavior

Voice settings can be adjusted in the VoiceChatBot component:
- Speech recognition language
- Voice synthesis rate and pitch
- Listening timeout

### Customizing the Shopping Panel

Each view in the shopping panel is rendered by a dedicated function in ShoppingPanel.tsx:
- `renderProductsList`
- `renderProductDetail`
- `renderCart`
- `renderCheckout`

## Future Enhancements

Potential improvements to consider:
- Voice customization options (speed, voice selection)
- Conversation history persistence
- Improved error handling for voice recognition
- Accessibility enhancements
- Support for additional languages
