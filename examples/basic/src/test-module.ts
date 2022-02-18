import { DocumentNode, Kind, visit } from 'graphql';
import { createModule, Module, testkit } from 'graphql-modules';

// Based off graphql-modules replaceExtensions which lacks support for interfaces
// https://github.com/Urigo/graphql-modules/blob/75552e6775202a8c8a69d3aa587033d9c0987da2/packages/graphql-modules/src/testing/test-module.ts#L142
function transformInterfaceExtensions(
  typeDefs: DocumentNode[]
): DocumentNode[] {
  const interfaces: string[] = [];

  // Track interfaces so that, if the local module has the interfaced defined or has the interface defined and extended,
  // we can ensure avoid transforming extensions.
  typeDefs.forEach((doc) => {
    visit(doc, {
      InterfaceTypeDefinition(node) {
        interfaces.push(node.name.value);
      },
    });
  });

  // Transform interface extensions into plain interfaces
  return typeDefs.map((doc) => {
    return visit(doc, {
      InterfaceTypeExtension(node) {
        // If the interface exists, then don't transform.
        if (interfaces.includes(node.name.value)) {
          return node;
        }

        return { ...node, kind: Kind.INTERFACE_TYPE_DEFINITION };
      },
    });
  });
}

type TestModuleConfig = NonNullable<Parameters<typeof testkit.testModule>['1']>;

export const testModule = (
  module: Module,
  config?: Readonly<TestModuleConfig>
): ReturnType<typeof testkit.testModule> => {
  const transformedModule = createModule({
    ...module.config,
    typeDefs: transformInterfaceExtensions(module.typeDefs),
  });

  return testkit.testModule(transformedModule, config);
};
