const express = require('express');
const OpenAI = require('openai');
const { appSettings,formatInputWithInstructions } = require('../utility');

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// POST /api/ai/response
router.post('/ai/response', async (req, res) => {
  console.group('🤖 [POST] /api/ai/response');
  const { input, instructions } = req.body;

  if (!input || !Array.isArray(input)) {
    console.warn('⚠️ Missing or invalid "input" array.');
    return res.status(400).json({ error: 'Input must be an array of {role, content} objects.' });
  }

  if (!appSettings.enableOpenAI) {
    console.log('⚠️ OpenAI disabled — returning default response.');
    return res.status(200).json({ response: 'The AI is currently disabled by the developer. Please try again later.' });
  }

  try {
    const finalInput = formatInputWithInstructions(input, instructions);
    console.log('📥 Received final input:', finalInput);

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: finalInput
    });

    const output = response.choices[0].message.content;
    console.log('📝 AI Response:', output);

    res.status(200).json({ response: output });
  } catch (err) {
    console.error('❌ Error generating AI response:', err.message);
    res.status(500).json({ error: 'Failed to generate AI response.' });
  } finally {
    console.groupEnd();
  }
});



module.exports = router;
