import { gql, testkit } from 'graphql-modules';
import { testModule } from '../../test-module';
import { SocialNetworkModule } from './social-network.module';

type GraphQLUser = {
  foo: string;
  friends: GraphQLUser[];
};

type GraphQLRes = {
  user: GraphQLUser;
};

// These tests will fail because we have to fragment on an implementing type
// but CommonUser does not implement User from the view of the module. Is it
// up to the tester to rekindle that relationship via testModules's typeDefs?
// This feels a bit odd because that is implicit knowledge coming from the User
// module.
describe('User', () => {
  const app = testModule(SocialNetworkModule, {
    typeDefs: gql`
      type Query {
        user: User!
      }
    `,
    resolvers: {
      Query: {
        user: jest
          .fn()
          .mockReturnValue({ foo: 'bar', friends: [{ friends: [] }] }),
      },
      User: {
        __resolveType: () => 'CommonUser',
      },
    },
    replaceExtensions: true,
  });

  test('Returns foo', async () => {
    const { data, errors } = await testkit.execute<GraphQLRes>(app, {
      document: gql`
        query {
          user {
            # You don't implement me in test without pulling in User module
            ... on CommonUser {
              foo
            }
          }
        }
      `,
    });

    expect(errors).toBeUndefined();
    expect(data?.user.foo).toBe('bar');
  });

  test('Returns friends', async () => {
    const { data, errors } = await testkit.execute<GraphQLRes>(app, {
      document: gql`
        query {
          user {
            friends
          }
        }
      `,
    });

    expect(errors).toBeUndefined();
    expect(data?.user.friends).toHaveLength(1);
  });
});

describe('CommonUser', () => {
  const app = testModule(SocialNetworkModule, {
    typeDefs: gql`
      type Query {
        user: CommonUser!
      }
    `,
    resolvers: {
      Query: {
        user: jest
          .fn()
          .mockReturnValue({ foo: 'bar', friends: [{ friends: [] }] }),
      },
    },
    replaceExtensions: true,
  });

  // Scalars are easily tested on types
  test('Returns foo', async () => {
    const { data, errors } = await testkit.execute<GraphQLRes>(app, {
      document: gql`
        query {
          user {
            foo
          }
        }
      `,
    });

    expect(errors).toBeUndefined();
    expect(data?.user.foo).toBe('bar');
  });

  // This test will fail because friends points to [User!]! and CommonUser does
  // not implement User in these tests. Is it up to the tester to rekindle that
  // relationship?
  test('Returns friends', async () => {
    const { data, errors } = await testkit.execute<GraphQLRes>(app, {
      document: gql`
        query {
          user {
            friends
          }
        }
      `,
    });

    expect(errors).toBeUndefined();
    expect(data?.user.friends).toHaveLength(1);
  });
});
