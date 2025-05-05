require('dotenv').config();

const appSettings = {
  testMode: false, // You can change this with ENV later

  showDebugLogs: true,

  port: process.env.PORT || 3000,

  enableOpenAI: true, // 🔥 Add this toggle

  getSmsApiKey() {
    return this.testMode
      ? `textbelt`
      : process.env.SMS_API_KEY;
  }
};
function formatInputWithInstructions(input, instructions) {
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error('Input must be a non-empty array of messages.');
  }

  // Find the most recent user message
  const latestUserMessage = [...input].reverse().find(msg => msg.role === 'user');

  if (!latestUserMessage) {
    throw new Error('No user message found in the input array.');
  }

  // Build the new content combining instructions + user message
  const newContent = `Instructions:\n${instructions || 'No specific instructions.'}\n\nUser Message:\n${latestUserMessage.content}`;

  // Replace the latest user message's content
  const updatedInput = input.map(msg => {
    if (msg === latestUserMessage) {
      return { ...msg, content: newContent };
    }
    return msg;
  });

  return updatedInput;
}

module.exports = {
  appSettings,
  formatInputWithInstructions
};
