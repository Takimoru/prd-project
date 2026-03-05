// Quick test script to check registration mutation
const fetch = require('node-fetch');

async function testRegistration() {
  const mutation = `
    mutation SubmitRegistration($input: SubmitRegistrationInput!) {
      submitRegistration(input: $input) {
        id
        status
        email
      }
    }
  `;

  const variables = {
    input: {
      programId: "test-program-id",
      fullName: "Test User",
      studentId: "123456",
      phone: "08123456789",
      email: "test@example.com",
      major: "Informatika",
      paymentProofUrl: "http://localhost:4000/uploads/test.jpg"
    }
  };

  try {
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: mutation, variables })
    });

    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRegistration();
