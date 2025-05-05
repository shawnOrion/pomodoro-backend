const { appSettings } = require('../utility');

const sendSms = async ({ to, message }) => {
  if (!to || !message) {
    throw new Error('Missing "to" or "message"');
  }

  const payload = {
    phone: to,
    message,
    key: appSettings.getSmsApiKey()  // Make sure your .env has the correct Textbelt key!
  };

  console.log('📦 Sending payload to Textbelt API:', payload);

  const smsRes = await fetch('https://textbelt.com/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const resultText = await smsRes.text();
  console.log('📝 Raw response body:', resultText);

  let result;
  try {
    result = JSON.parse(resultText);
  } catch (err) {
    throw new Error('Invalid JSON response from Textbelt');
  }

  if (!result.success) {
    console.error('❌ SMS sending failed with error:', result.error);
    throw new Error(result.error || 'Unknown error from SMS API');
  }

  console.log(`✅ SMS sent successfully. Text ID: ${result.textId || 'N/A'}`);
  return result.textId;
};

module.exports = {
  sendSms
};
