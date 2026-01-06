import { gql } from '@apollo/client';

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      name
      role
      studentId
      picture
    }
  }
`;

export const SYNC_USER_MUTATION = gql`
  mutation SyncUser($email: String!, $name: String!, $googleId: String!, $picture: String) {
    syncUser(email: $email, name: $name, googleId: $googleId, picture: $picture) {
      id
      email
      name
      role
    }
  }
`;
