# Mutex Server
## 1. Outline
```bash
npm install --save mutex-server
```

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/samchon/mutex-server/blob/master/LICENSE)
[![npm version](https://badge.fury.io/js/mutex-server.svg)](https://www.npmjs.com/package/mutex-server)
[![Downloads](https://img.shields.io/npm/dm/mutex-server.svg)](https://www.npmjs.com/package/mutex-server)
[![Build Status](https://github.com/samchon/mutex-server/workflows/build/badge.svg)](https://github.com/samchon/mutex-server/actions?query=workflow%3Abuild)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fsamchon%2Fmutex-server.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fsamchon%2Fmutex-server?ref=badge_shield)

Critical sections in the network level.

The `mutex-server` is an npm module that can be used for building a mutex server. When you need to control a critical section on the entire system level, like distributed processing system using the network communications, this `mutex-server` can be a good solution.

Installs and opens a `mutex-server` and let clients to connect to the server. The clients who're connecting to the `mutex-server` can utilize remote critical section components like [mutex](https://mutex.dev/api/classes/msv.remotemutex.html) or [semaphore](https://mutex.dev/api/classes/msv.remotesemaphore.html).

Also, `mutex-server` has a safety device for network disconnections. When a client has been suddenly disconnected, all of the locks had acquired or tried by the client would be automatically unlocked or cancelled. Therefore, you don't worry about any network disconnection accident and just enjoy the `mutex-server` with confidence.




## 2. Features
### 2.1. Network Level
When you want to open a `mutex-server`, utilize the [`MutexServer`](https://mutex.dev/api/classes/msv.mutexserver.html) class and accept or reject connections from the remote clients by using the [`MutexAcceptor`](https://mutex.dev/api/classes/msv.mutexacceptor.html) class. Otherwise, you want to connect to a remote `mutex-server` as a client, utilize the [`MutexConnector`](https://mutex.dev/api/classes/msv.mutexconnector.html) class.

  - [`MutexServer`](https://mutex.dev/api/classes/msv.mutexserver.html)
  - [`MutexAcceptor`](https://mutex.dev/api/classes/msv.mutexacceptor.html)
  - [`MutexConnector`](https://mutex.dev/api/classes/msv.mutexconnector.html)

### 2.2. Critical Section Components
If you succeeded to connect to a `mutex-server`, as a client through the [`MutexConnector`](https://mutex.dev/api/classes/msv.mutexconnector.html) class, you can utilize lots of remote critical section components like below. For reference, all of those critical section components are following the STL (Standard Template Library) design.

Also, [`std.UniqueLock`](https://mutex.dev/api/classes/std.uniquelock.html) and [`std.SharedLock`](https://mutex.dev/api/classes/std.sharedlock.html) can be a good choice for safe development. They always ensure that acquired lock to be automatically unlocked, in any circumstance, even if an error occurs in your business code.

  - Solid Components
    - [`RemoteConditionVariable`](https://mutex.dev/api/classes/msv.remoteconditionvariable.html)
    - [`RemoteMutex`](https://mutex.dev/api/classes/msv.remotemutex.html)
    - [`RemoteSemaphore`](https://mutex.dev/api/classes/msv.remotesemaphore.html)
  - Adaptor Components
    - [`RemoteBarrier`](https://mutex.dev/api/classes/msv.remotebarrier.html)
    - [`RemoteLatch`](https://mutex.dev/api/classes/msv.remotelatch.html)
  - Safety Helpers
    - [`std.UniqueLock`](https://mutex.dev/api/classes/std.uniquelock.html)
    - [`std.SharedLock`](https://mutex.dev/api/classes/std.sharedlock.html)




## 3. Usage
![mutex-server](https://user-images.githubusercontent.com/13158709/86332593-b285b200-bc85-11ea-8a2e-cbe30284d053.gif)

Let's learn how to use the `mutex-server` through a sample project. I'll [open a server](https://mutex.dev/api/classes/msv.mutexserver.html#open) and let
4 clients to [connect to the server](https://mutex.dev/api/classes/msv.mutexconnector.html#connect). After those 4 clients' connections, they'll monopoly a critical section through [`RemoteMutex.lock()`](https://mutex.dev/api/classes/msv.remotemutex.html#lock) method and start printing a line very slowly.

After printing has been completed, each client will act one of them randomly: [unlock the mutex](https://mutex.dev/api/classes/msv.remotemutex.html#unlock) or [close the connection](https://mutex.dev/api/classes/msv.mutexconnector.html#close) without the unlock. As you know and as I've mentioned, if a client has been disconnected without returning locks that it had been acquired, the `mutex-server` will automatically release them. 

Therefore, two random actions would be confirmed to the same result: [`RemoteMutex.unlock()`](https://mutex.dev/api/classes/msv.remotemutex.html#unlock).

```typescript
import msv from "mutex-server";
import std from "tstl";

const PASSWORD = "qweqwe123!";
const PORT = 37119;

async function client(index: number, character: string): Promise<void>
{
    // CONNECT TO THE SERVER
    let connector: msv.MutexConnector<string, null> = new msv.MutexConnector(PASSWORD, null);
    await connector.connect(`ws://127.0.0.1:${PORT}`);
    
    // GET LOCK
    let mutex: msv.RemoteMutex = await connector.getMutex("printer");
    await mutex.lock();

    // PRINTS A LINE VERY SLOWLY MONOPOLYING THE MUTEX
    process.stdout.write(`Connector #${index} is monopolying a mutex: `);
    for (let i: number = 0; i < 20; ++i)
    {
        process.stdout.write(character);
        await std.sleep_for(50);
    }
    process.stdout.write("\n");

    // ALTHOUGH THE CLIENT DOES NOT RELEASE THE LOCK
    if (Math.random() < 0.5)
        await mutex.unlock();
    else // SERVER WILL UNLOCK IT AUTOMATICALLY AFTER THE DISCONNECTION
        await connector.close();
}

async function main(): Promise<void>
{
    // OPEN SERVER
    let server: msv.MutexServer<string, null> = new msv.MutexServer();
    await server.open(PORT, async acceptor =>
    {
        if (acceptor.header === PASSWORD)
            await acceptor.accept(null);
        else
            await acceptor.reject();
    });

    // CREATE 10 CLIENTS LOCKING MUTEX
    let promises: Promise<void>[] = [];
    for (let i: number = 0; i < 4; ++i)
    {
        let character: string = std.randint(0, 9).toString();
        promises.push( client(i + 1, character) );
    }

    // WAIT THE CLIENTS TO BE DISCONNCTED AND CLOSE SERVER
    await Promise.all(promises);
    await server.close();
}
main();
```




## 4. Appendix
### 4.1. Repositories
`mutex-server` is an open source project following the [MIT license](https://github.com/samchon/mutex-server/blob/master/LICENSE).

  - Github: https://github.com/samchon/mutex-server
  - NPM: https://www.npmjs.com/package/mutex-server

### 4.2. Documents
Someone who wants to know more about this `mutex-server`, I've prepared the [API documents](https://mutex.dev/api). Through the [API documents](https://mutex.dev/api), you can travel all of the [features](#2-features) defined in this `mutex-server`.

Also, I'm planning to write the guide documents providing detailed learning course and lots of example projects handling network level critical sections. When the guide documents has been published, its URL address would be https://mutex.dev and it would form like the [TGrid's](https://tgrid.com).

  - API Documents: https://mutex.dev/api
  - Guide Documents: not yet, but soon.

### 4.3. Dependencies
#### 4.3.1. [TypeScript](https://github.com/microsoft/typescript)
I've developed this `mutex-server` with the [TypeScript](https://github.com/microsoft/typescript).

Also, I hope all users of this `mutex-server` to use the [TypeScript](https://github.com/microsoft/typescript) too, for the safe development. As this `mutex-server` is designed to handling critical section in the network level, a tiny mistake like mis-typing can be a critical damage on the entire network system. 

It's the reason why I recommend you to use the [TypeScript](https://github.com/microsoft/typescript) when using this `mutex-server`.

#### 4.3.2. [TSTL](https://github.com/samchon/tstl)
This `mutex-server` is an extension module of the [TSTL](https://github.com/samchon/tstl).

[TSTL](https://github.com/samchon/tstl) is an open source project migrating C++ STL (Standrad Template Library) to the TypeScript. Therefore, [TSTL](https://github.com/samchon/tstl) is following designs from the C++ standard committee and providing many modules like *containers*, *iterators*, *algorithms* and *functors* following the standard.

However, TypeScript is not C++ and it's development environment is different with the C++, either. Therefore, there're some STL features that are not suitable for the TypeScript development. Also, there can be a feature not supported by STL, but it's an important one in the TypeScript development environment, too.

To resolve such problems, [TSTL](https://github.com/samchon/tstl) is providing extension modules. This `mutex-server` is one of those extension module from the [TSTL](https://github.com/samchon/tstl), designed to support the network level critical sections: [tstl#74](https://github.com/samchon/tstl/issues/74).

#### 4.3.3. [TGrid](https://github.com/samchon/tgrid)
[TGrid](https://github.com/samchon/tgrid) is also an extension module of the [TSTL](https://github.com/samchon/tstl), designed to support the thread and network, too.

The TGrid has implemented thread and network by inventing a new concept; [RFC](https://github.com/samchon/tgrid#13-remote-function-call) (Remote Function Call). Also, this `mutex-server` has realized its remote, network level critical section, components by utilizing the [RFC](https://github.com/samchon/tgrid#13-remote-function-call) concepts invented by the [TGrid](https://github.com/samchon/tgrid).