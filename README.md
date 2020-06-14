# Mutex Server
## 1. Outline
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/samchon/mutex-server/blob/master/LICENSE)
[![npm version](https://badge.fury.io/js/mutex-server.svg)](https://www.npmjs.com/package/mutex-server)
[![Downloads](https://img.shields.io/npm/dm/mutex-server.svg)](https://www.npmjs.com/package/mutex-server)
[![Build Status](https://github.com/samchon/mutex-server/workflows/build/badge.svg)](https://github.com/samchon/mutex-server/actions?query=workflow%3Abuild)

The `mutex-server` is an npm module that can be used for building a mutex server. When you need to controll a critical section on the entire system level, like distributed processing system using network communications, this `mutex-server` can be a good solution.




## 2. Features
### 2.1. Server Side
```typescript
export class MutexServer<Headers extends object>
{
    public state: MutexServer.State;

    public constructor();
    public constructor(key: string, cert: string);

    public open
        (
            port: number, 
            predicator: MutexServer.Predicator<Headers>
        ): Promise<void>;
    public close(): Promise<void>;
}
export namespace MutexServer
{
    export interface Predicator<Headers extends object>
    {
        (info: ConnectionInfo<Headers>): boolean | Promise<boolean>;
    }

    export interface ConnectionInfo<Headers extends object>
    {
        ip: string;
        path: string;
        headers: Headers;
    }
}
```

### 2.2. Client Side
#### 2.2.1. `MutexConnector`
```typescript
export class MutexConnector<Headers extends object>
{
    public url?: string;
    public state: MutexConnector.State;

    public constructor();
    public connect(url: string, headers: Headers): Promise<void>;
    public close(): Promise<void>;

    public getBarrier(name: string, count: number): Promise<RemoteBarrier>;
    public getConditionVariable(name: string): Promise<RemoteConditionVariable>;
    public getLatch(name: string, count: number): Promise<RemoteLatch>;
    public getMutex(name: string): Promise<RemoteMutex>;
    public getSemaphore(name: string, count: number): Promise<RemoteSemaphore>;
}
```



#### 2.2.1. `RemoteBarrier`
```typescript
export class RemoteBarrier
{
    public arrive(n: number = 1): Promise<void>;
    public arrive_and_drop(): Promise<void>;
    public arrive_and_wait(): Promise<void>;
    public wait(): Promise<void>;
}
```

#### 2.2.2. `RemoteConditionVariable`
```typescript
export class RemoteConditionVariable
{
    public wait(): Promise<void>;
    public wait_for(ms: number): Promise<boolean>;
    public wait_until(at: Date): Promise<boolean>;

    public notify_one(): Promise<void>;
    public notify_all(): Promise<void>;
}
```

#### 2.2.3. `RemoteLatch`
```typescript
export class RemoteLatch
{
    public count_down(n: number = 1): Promise<void>;
    public arrive_and_wait(): Promise<void>;

    public wait(): Promise<void>;
    public try_wait(): Promise<boolean>;
    public wait_for(ms: number): Promise<boolean>;
    public wait_until(at: Date): Promise<boolean>;
}
```

#### 2.2.4. `RemoteMutex`
```typescript
export class RemoteMutex
{
    public lock(): Promise<void>;
    public try_lock(): Promise<boolean>;
    public try_lock_for(ms: number): Promise<boolean>;
    public try_lock_until(at: Date): Promise<boolean>;
    public unlock(): Promise<void>;

    public lock_shared(): Promise<void>;
    public try_lock_shared(): Promise<boolean>;
    public try_lock_shared_for(ms: number): Promise<boolean>;
    public try_lock_shared_until(at: Date): Promise<boolean>;
    public unlock_shared(): Promise<void>;
}
```

### 2.2.5. `RemoteSemahore`
```typescript
export class RemoteSemaphore
{
    public max(): Promise<number>;

    public acquire(): Promise<void>;
    public try_acquire(): Promise<boolean>;
    public try_acquire_for(ms: number): Promise<boolean>;
    public try_acquire_until(at: Date): Promise<boolean>;
    public release(count: number = 1): Promise<void>;
}
```




## 3. Usage
### 3.1. Installation
```bash
npm install --save mutex-server
```

### 3.2. Server
Building a mutex server is very simple like below:

```typescript
import { MutexServer } from "mutex-server";
import { IActivation } from "./IActivation";

async function main(): Promise<void>
{
    let server: MutexServer<IActivation> = new MutexServer();
    await server.open(44114, info => info.headers.password === "qweqwe123!");
}
```




### 3.3. Client
Using the mutex server is also easy too. However, be careful when using the remote mutex. If you forget unlocking the remote-mutex, other clients will be suffered by your mistake.

```typescript
import { MutexConnector, RemoteMutex } from "mutex-server";
import { IActivation } from "./IActivation";

async function main(): Promise<void>
{
    // CONNECT TO THE SERVER
    let connector: MutexConnector = new MutexConnector();
    await connector.connect("http://127.0.0.1:44114", { password: "qweqwe123!" });

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