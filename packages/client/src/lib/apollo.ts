import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
});

const authLink = setContext(async (_, { headers }) => {
  // Get the user email from local storage
  // This is set by AuthContext after Google OAuth login
  const userEmail = localStorage.getItem('userEmail');
  
  return {
    headers: {
      ...headers,
      authorization: userEmail ? `Bearer ${userEmail}` : "",
    }
  }
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink) as any,
  cache: new InMemoryCache(),
});
