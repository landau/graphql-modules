---
id: lifecycles
title: Lifecycles
---

## Lifecycle hooks

There are two life cycle hooks in GraphQL Modules, one represents an incoming request and the other is called when the execution is done. Hooks are only available in Operation scoped Injector.

Every Operation scoped service is created for each incoing GraphQL operation, which means you can use the constructor as the initial hook.

After Operation is resolved and the context about to be destroyed, GraphQL Modules call the `onDestroy` method on all operation-scoped services.

```typescript
import { Injectable, Scope, OnDestroy } from 'graphql-modules'

@Injectable({
  scope: Scope.Operation
})
export class Data implements OnDestroy {
  constructor() {
    // incoming operation, here you can do your setup and preparation
  }

  onDestroy() {
    // Operation is resolved
    // Execution context is about to be disposed
  }
}
```

## Manual control of operation cycle

As you know, GraphQL operation represents an incoming request with GraphQL query and variables meaning it ends when GraphQL API resolves data and sends back the response. An operation is created when GraphQL execution starts (`execute` function call). With operation comes Operation-scoped Dependency Injection.

In some cases you wish to:

- access operation-scoped services before the execution phase happens
- destroy a session and operation-scoped injectors some time after execution phase

This is why `OperationController` exists - it allows to fully control the life of the operation-scoped injectors.

Here's an example:

```typescript
@Injectable({ scope: Scope.Operation })
class Status {
  enabled = true
  enable() {
    this.enabled = true
  }
  disable() {
    this.enabled = false
  }
}

const mod = createModule({
  id: 'status',
  providers: [Status]
})

const app = createApplication({
  modules: [mod],
  providers: [Data]
})

server.use('/graphql', (req, res) => {
  const controller = app.createOperationController({
    /*
      It's important to pass a correct context value here.
      This value represents a context object available in Dependency Injection.
      Keep in mind, it doesn't have to be the same context object as your resolvers get.
    */
    context: {}
  })

  const status = controller.injector.get(Status)

  if (process.env.NODE_ENV === 'production') {
    status.disable()
  }

  // < graphql execution here >

  controller.destroy()
})
```

### autoDestroy

Using `OperationController` means you're in charge of the operation flow and you need to destroy the session manually by default.

To improve the developer experience, we decided to introduce `autoDestroy` flag that automatically destroys the session right after GraphQL execution phase ends, exactly like without an OperationController.

```typescript
const controller = app.createOperationController({
  context: {},
  autoDestroy: true
})

// no need to call `controller.destroy()` now
```

> Keep on mind that using `autoDestroy` means the controller completes its job immediately after execution phase and everything is cleaned up.
