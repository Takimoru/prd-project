async function testQuery() {
  const query = `
    query GetPrograms($includeArchived: Boolean) {
      programs(includeArchived: $includeArchived) {
        id
        title
        archived
      }
    }
  `;

  try {
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { includeArchived: false },
      }),
    });

    const result = await response.json();
    console.log('Query result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Fetch error:', err instanceof Error ? err.message : String(err));
  }
}

testQuery();
