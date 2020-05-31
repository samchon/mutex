# Mutex Server
## Outline
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/samchon/mutex-server/blob/master/LICENSE)
[![npm version](https://badge.fury.io/js/mutex-server.svg)](https://www.npmjs.com/package/mutex-server)
[![Downloads](https://img.shields.io/npm/dm/mutex-server.svg)](https://www.npmjs.com/package/mutex-server)
[![Build Status](https://github.com/samchon/mutex-server/workflows/build/badge.svg)](https://github.com/samchon/mutex-server/actions?query=workflow%3Abuild)

The `mutex-server` is an npm module that can be used for building a mutex server. When you need to controll a critical section on the entire system level, like distributed processing system using network communications, this `mutex-server` can be a good solution.




## Usage
### Installation
```bash
npm install --save mutex-server
```

### Server
Building a mutex server is very simple like below:

```typescript
import { MutexServer } from "mutex-server";

async function main(): Promise<void>
{
    let server: MutexServer = new MutexServer();
    await server.open(44114);
}
```




### Client
Using the mutex server is also easy too. However, be careful when using the remote mutex. If you forget unlocking the remote-mutex, other clients will be suffered by your mistake.

```typescript
import { MutexConnector, RemoteMutex } from "mutex-server";

async function main(): Promise<void>
{
    // CONNECT TO THE SERVER
    let connector: MutexConnector = new MutexConnector();
    await connector.connect("http://127.0.0.1:44114");

    //----
    // USE MUTEX
    //----
    // GET NAMED MUTEX
    let mutex: RemoteMutex = connector.getMutex("someName");

    // WRITE-LOCK
    await mutex.lock();
    {
        // ...
        // DO SOMETHING
        // ...
    }
    await mutex.unlock();

    // READ-LOCK
    await mutex.lock_shared();
    {
        // ...
        // DOM SOMETHING
        // ...
    }
    await mutex.unlock_shared();

    await connector.close();
}
```

If you are aware of mistake to forget realilng the locks, therefore you want to use the remote mutex more safely, you can use those `UniqueLock` and `SharedLock` features instead of calling methods of the `RemoteMutex` directly:

```typescript
import { MutexConnector, RemoteMutex } from "mutex-server";
import { UniqueLock, SharedLock } from "tstl";

async function main(): Promise<void>
{
    // CONNECT TO THE SERVER
    let connector: MutexConnector = new MutexConnector();
    await connector.connect("http://127.0.0.1:44114");

    //----
    // USE MUTEX
    //----
    // GET NAMED MUTEX
    let mutex: RemoteMutex = connector.getMutex("someName");

    // WRITE-LOCK
    await UniqueLock.lock(mutex, async () =>
    {
        // mutex.lock() and mutex.unlock() would be automatically called
        // even this closure throws an error
    });

    // READ-LOCK
    await SharedLock.lock(mutex, async () =>
    {
        // mutex.lock_shared() and mutex.unlock_shared() would be automatically called
        // even this closure throws an error
    });

    await connector.close();
}
```