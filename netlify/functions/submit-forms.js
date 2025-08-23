// File: netlify/functions/submit-form.js

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const formData = JSON.parse(event.body);
    const formType = formData.formType; // We'll send this from the frontend

    let accessKey;

    // Choose the correct key based on the form type
    if (formType === 'suggestion') {
      accessKey = process.env.W3FORMS_SUGGESTION_KEY;
    } else if (formType === 'complaint') {
      accessKey = process.env.W3FORMS_COMPLAINT_KEY;
    } else {
      return { statusCode: 400, body: 'Bad Request: Missing formType.' };
    }

    // Add the secret key to the form data
    formData.access_key = accessKey;
    delete formData.formType; // Clean up the helper field

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (!data.success) {
      return { statusCode: 400, body: JSON.stringify(data) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Form submitted successfully!" })
    };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};