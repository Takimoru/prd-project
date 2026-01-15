import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:4000/graphql',
    connectionParams: async () => {
      const userEmail = localStorage.getItem('userEmail');
      return {
        authorization: userEmail ? `Bearer ${userEmail}` : "",
      };
    },
  })
);

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

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink as any,
  authLink.concat(httpLink)
);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});
