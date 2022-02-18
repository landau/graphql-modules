import { createModule, gql } from 'graphql-modules';

export const SocialNetworkModule = createModule({
  id: 'social-network',
  dirname: __dirname,
  typeDefs: gql`
    # Extend interfaces with common fields so users don't need to fragment "...on CommonUser"
    # or other types that implement User.
    extend interface User {
      foo: String!
      friends: [User!]!
    }

    # In test and by default, CommonUser will not implement the User interface as
    # specified in user/user.module.ts
    # This is problematic for testing that the interface has expected fields
    extend type CommonUser {
      # Adding this field to exemplify that it is possible to directly test a scalar
      foo: String!
      friends: [User!]!
    }
  `,
  resolvers: {
    User: {
      friends: (user: any) => user.friends,
    },
  },
});
