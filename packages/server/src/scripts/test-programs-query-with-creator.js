const query = `
  query GetPrograms($includeArchived: Boolean) {
    programs(includeArchived: $includeArchived) {
      id
      title
      archived
      creator {
        id
        name
      }
    }
  }
`;

fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query,
    variables: { includeArchived: false },
  }),
})
.then(res => res.json())
.then(result => {
  console.log('Query result:', JSON.stringify(result, null, 2));
})
.catch(err => {
  console.error('Fetch error:', err.message);
});
