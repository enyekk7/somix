import axios from 'axios'

// Get API key from environment variable
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''

// Gemini API endpoint function (using the latest recommended model)
const getGeminiUrl = () => {
  // Use the recommended gemini-2.5-flash model
  return `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
}

/**
 * Gemini AI Service
 * Handles chat interactions with Google's Gemini AI
 */

/**
 * Send a chat message to Gemini AI
 * @param {string} message - The user's message
 * @param {Array} chatHistory - Previous chat history (optional)
 * @returns {Promise<Object>} Response from Gemini AI
 */
export const geminiService = {
  async sendMessage(message, chatHistory = []) {
    try {
      // System instruction untuk AI
      const systemInstruction = {
        parts: [{ text: `You are Somix, an AI assistant specialized in the Somnia blockchain and crypto world. Your name is Mix.

IMPORTANT RULES:
- ALWAYS respond in ENGLISH as the primary language
- Keep responses SHORT and CASUAL
- When greeted with "hi", "hello", or "hai", respond simply: "Hi! I'm Mix, what can I help you with?"
- Keep all responses brief and friendly
- Only use Indonesian if the user specifically asks in Indonesian

Key Information:
- Platform: Somix is a Web3 social media platform built on the Somnia blockchain
- Focus: You specialize in crypto world, especially Somnia blockchain
- When asked about Somix, explain briefly about the platform

Be helpful but keep responses concise and natural. Always prioritize English language.` }]
      }

      // Prepare the request payload for Gemini API
      const contents = []
      
      // Add chat history if available
      if (chatHistory.length > 0) {
        chatHistory.forEach(chat => {
          contents.push({
            role: chat.role === 'model' ? 'model' : 'user',
            parts: [{ text: chat.text }]
          })
        })
      }
      
      // Add current message
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      })

      const requestData = {
        contents: contents,
        systemInstruction: systemInstruction
      }

      console.log('📤 Sending message to Gemini AI...')
      console.log('🔗 API URL:', getGeminiUrl())

      // Use header-based authentication as per Gemini API documentation
      const response = await axios.post(getGeminiUrl(), requestData, {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY  // API key in header
        }
      })

      console.log('✅ Gemini AI response received')

      // Extract the response text
      const responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.'

      return {
        success: true,
        message: responseText,
        fullResponse: response.data
      }

    } catch (error) {
      console.error('❌ Gemini AI Error:', error.response?.data || error.message)
      
      // Fallback to mock response if API fails
      const fallbackMessages = [
        "Hello! I'm Somix, your AI assistant for Somnia blockchain and crypto! How can I help you today?",
        "Hi there! I'm Mix, ready to help with anything about crypto and Somnia!",
        "Hey! I'm Somix, specialized in blockchain technology. What would you like to know?",
        "Hello! I'm here to help you understand Somnia blockchain and the crypto world!"
      ]
      const randomMessage = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)]
      
      console.log('⚠️ Using fallback response due to API error')
      
      return {
        success: true,
        message: `${randomMessage}`,
        fullResponse: { isFallback: true }
      }
    }
  },

  /**
   * Get a quick AI response for common queries
   * @param {string} query - The user's query
   * @returns {Promise<string>} AI response
   */
  async quickResponse(query) {
    const result = await this.sendMessage(query)
    return result.message
  }
}

export default geminiService
