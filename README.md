# Mutex Server
## Outloine
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
import { MutexConnector } from "mutex-server";
import { SharedTimedMutex } from "tstl";

async function main(): Promise<void>
{
    // CONNECT TO THE SERVER
    let connector: MutexConnector = new MutexConnector();
    await connector.connect("http://127.0.0.1:44114");

    //----
    // USE MUTEX
    //----
    // GET NAMED MUTEX
    let mutex: SharedTimedMutex = connector.getMutex("someName");

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

If you are aware of mistake to forget realilng the locks, therefore you want to use the remote mutex more safely, you can use those `UniqueLock` and `SharedLock` features instead of calling methods of the `SharedTimedMutex` directly:

```typescript
import { MutexConnector } from "mutex-server";
import { SharedTimedMutex, UniqueLock, SharedLock } from "tstl";

async function main(): Promise<void>
{
    // CONNECT TO THE SERVER
    let connector: MutexConnector = new MutexConnector();
    await connector.connect("http://127.0.0.1:44114");

    //----
    // USE MUTEX
    //----
    // GET NAMED MUTEX
    let mutex: SharedTimedMutex = connector.getMutex("someName");

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

### SharedTimedMutex
As you've seen, the `mutex-server` library is using the `SharedTimeMutex` class as a basic asset.

The `SharedTimeMutex` class is come from another library `tstl` that what I've developed for a long time. If you want to know more about the `SharedTimeMutex`, visit the [API documents](https://tstl.dev/api/classes/std.sharedtimedmutex.html) or read below type definition. If you're interested in my another library `tstl`, visit [the repository](https://github.com/samchon/tstl).

```typescript
declare module "tstl"
{
    export class SharedTimedMutex
    {
        // WRITE LOCKS
        public lock(): Promise<void>;
        public try_lock(): Promise<boolean>;
        public try_lock_for(ms: number): Promise<boolean>;
        public try_lock_until(at: Date): Promise<boolean>;

        public unlock(): Promise<void>;

        // READ LOCKS
        public lock_shared(): Promise<void>;
        public try_lock_shared(): Promise<boolean>;
        public try_lock_shared_for(ms: number): Promise<boolean>;
        public try_lock_shared_until(at: Date): Promise<boolean>;

        public unlock_shared(): Promise<void>;
    }
}
```