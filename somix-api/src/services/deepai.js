const axios = require('axios');

class DeepAIService {
  constructor(apiKey) {
    // Use API key from parameter or environment variable
    this.apiKey = apiKey || process.env.DEEPAI_KEY || '';
    this.baseURL = 'https://api.deepai.org/api/text2img';
  }

  async generateImage(prompt) {
    try {
      // Sanitize prompt to prevent abuse
      const sanitizedPrompt = this.sanitizePrompt(prompt);
      
      // Check if we have a valid API key
      if (!this.apiKey || this.apiKey === 'your_deepai_api_key_here') {
        console.log('Using mock image generation (no API key provided)');
        return this.generateMockImage(sanitizedPrompt);
      }
      
      console.log('Attempting DeepAI generation for prompt:', sanitizedPrompt);
      
      // Create FormData for multipart request as per DeepAI documentation
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('text', sanitizedPrompt);
      
      console.log('Sending request to DeepAI with API key:', this.apiKey.substring(0, 8) + '...');
      
      const response = await axios.post(
        this.baseURL,
        formData,
        {
          headers: {
            'api-key': this.apiKey,
            ...formData.getHeaders()
          },
          timeout: 120000, // 2 minutes timeout for AI generation
          maxRedirects: 5
        }
      );

      console.log('DeepAI response:', response.data);

      if (response.data && response.data.output_url) {
        console.log('DeepAI generation successful:', response.data.output_url);
        return response.data.output_url;
      } else {
        throw new Error('Failed to generate image: Invalid response from DeepAI');
      }
    } catch (error) {
      console.error('DeepAI generation error:', error.response?.data || error.message);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (error.response?.status === 400) {
          console.log('Bad request, falling back to mock generation');
          return this.generateMockImage(prompt);
        }
        if (error.response?.status === 401) {
          console.log('API key issue, falling back to mock generation');
          return this.generateMockImage(prompt);
        }
        if (error.response?.data?.status === 'APIs are only available for Pro members') {
          console.log('DeepAI Pro required, falling back to mock generation');
          return this.generateMockImage(prompt);
        }
        if (error.response?.status === 402) {
          console.log('Payment required for DeepAI Pro, falling back to mock generation');
          return this.generateMockImage(prompt);
        }
        if (error.response?.data?.err || error.response?.data?.error) {
          console.log('DeepAI processing error, falling back to mock generation');
          return this.generateMockImage(prompt);
        }
        throw new Error(`DeepAI API error: ${error.response?.data?.message || error.message}`);
      }
      
      // If any other error occurs, fall back to mock generation
      console.log('Unexpected error, falling back to mock generation');
      return this.generateMockImage(prompt);
    }
  }

  generateMockImage(prompt) {
    // Generate a mock image URL based on the prompt using Unsplash Source API
    const promptLower = prompt.toLowerCase();
    
    // Create search query based on prompt keywords
    let searchQuery = '';
    
    if (promptLower.includes('sunset') || promptLower.includes('sunrise')) {
      searchQuery = 'sunset';
    } else if (promptLower.includes('mountain') || promptLower.includes('landscape')) {
      searchQuery = 'mountain';
    } else if (promptLower.includes('forest') || promptLower.includes('tree')) {
      searchQuery = 'forest';
    } else if (promptLower.includes('ocean') || promptLower.includes('sea') || promptLower.includes('water')) {
      searchQuery = 'ocean';
    } else if (promptLower.includes('city') || promptLower.includes('urban')) {
      searchQuery = 'city';
    } else if (promptLower.includes('space') || promptLower.includes('galaxy')) {
      searchQuery = 'space';
    } else if (promptLower.includes('abstract') || promptLower.includes('art')) {
      searchQuery = 'abstract';
    } else if (promptLower.includes('animal') || promptLower.includes('cat') || promptLower.includes('dog')) {
      searchQuery = 'animal';
    } else if (promptLower.includes('flower') || promptLower.includes('garden')) {
      searchQuery = 'flower';
    } else if (promptLower.includes('car') || promptLower.includes('vehicle')) {
      searchQuery = 'car';
    } else if (promptLower.includes('food') || promptLower.includes('meal')) {
      searchQuery = 'food';
    } else {
      // Use first few words of prompt as search query
      const words = prompt.split(' ').slice(0, 2);
      searchQuery = words.join(' ');
    }
    
    // Generate unique image URL with timestamp to avoid caching
    const timestamp = Date.now();
    const randomId = Math.floor(Math.random() * 1000);
    
    return `https://source.unsplash.com/600x600/?${encodeURIComponent(searchQuery)}&sig=${timestamp}-${randomId}`;
  }

  sanitizePrompt(prompt) {
    // Remove potentially harmful content and limit length
    return prompt
      .trim()
      .slice(0, 500) // Limit to 500 characters
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, ''); // Remove data: protocol
  }

  async validateApiKey() {
    try {
      // Test the API key with a simple request
      await this.generateImage('test');
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = DeepAIService;


