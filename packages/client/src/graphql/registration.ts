import { gql } from "@apollo/client";

export const SUBMIT_REGISTRATION = gql`
  mutation SubmitRegistration($input: SubmitRegistrationInput!) {
    submitRegistration(input: $input) {
      id
      status
      programId
      fullName
      studentId
      email
      phone
      paymentProofUrl
      submittedAt
      program {
        id
        title
      }
    }
  }
`;



