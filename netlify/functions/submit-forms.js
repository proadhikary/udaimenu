// File: netlify/functions/submit-form.js (Improved Version)

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  try {
    const formData = JSON.parse(event.body);
    const formType = formData.formType;

    let accessKey;
    if (formType === 'suggestion') {
      accessKey = process.env.W3FORMS_SUGGESTION_KEY;
    } else if (formType === 'complaint') {
      accessKey = process.env.W3FORMS_COMPLAINT_KEY;
    }

    // Check if the key was found
    if (!accessKey) {
        console.error(`Access key not found for formType: ${formType}`);
        return { statusCode: 500, body: JSON.stringify({ message: 'Server configuration error: Access key not set.' }) };
    }

    formData.access_key = accessKey;
    delete formData.formType;

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const responseText = await response.text(); // Get response as text first

    // If the response from w3forms was not successful
    if (!response.ok) {
      console.error('Error from web3forms API:', responseText);
      // ALWAYS return a valid JSON object, even for errors.
      return {
        statusCode: response.status,
        body: JSON.stringify({ message: 'Failed to submit to form provider.', error: responseText })
      };
    }
    
    // If successful, return the success message from w3forms
    return {
      statusCode: 200,
      body: responseText // w3forms success response is already valid JSON
    };

  } catch (error) {
    console.error('Internal function error:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error', error: error.message }) };
  }
};