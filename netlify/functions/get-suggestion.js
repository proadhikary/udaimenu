// File: netlify/functions/get-suggestion.js

exports.handler = async function (event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Get the secret API key from the Netlify environment variable
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  // Model can be overridden via the GEMINI_MODEL env var when Google retires this one
  const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  try {
    // Get the prompt sent from the frontend
    const { prompt } = JSON.parse(event.body);

    if (!prompt) {
      return { statusCode: 400, body: 'Bad Request: Missing prompt.' };
    }

    // Call the Gemini API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      // Forward the error from the Gemini API
      const errorBody = await response.text();
      return { statusCode: response.status, body: errorBody };
    }

    const data = await response.json();
    // Newer models may split output into multiple parts (incl. thought parts)
    const parts = data.candidates?.[0]?.content?.parts || [];
    const aiText = parts.filter(p => p.text && !p.thought).map(p => p.text).join('');

    if (!aiText) {
      return { statusCode: 502, body: JSON.stringify({ error: 'Empty response from model' }) };
    }

    // Send the AI's response back to the frontend
    return {
      statusCode: 200,
      body: JSON.stringify({ suggestion: aiText }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};