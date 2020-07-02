# Mutex Server
## 1. Outline
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/samchon/mutex-server/blob/master/LICENSE)
[![npm version](https://badge.fury.io/js/mutex-server.svg)](https://www.npmjs.com/package/mutex-server)
[![Downloads](https://img.shields.io/npm/dm/mutex-server.svg)](https://www.npmjs.com/package/mutex-server)
[![Build Status](https://github.com/samchon/mutex-server/workflows/build/badge.svg)](https://github.com/samchon/mutex-server/actions?query=workflow%3Abuild)

Critical sections in the network level.

The `mutex-server` is an npm module that can be used for building a mutex server. When you need to control a critical section on the entire system level, like distributed processing system using the network communications, this `mutex-server` can be a good solution.

Opens a `mutex-server` and let clients to connect to the `mutex-server`. When sharing network level critical sections through the `mutex-server`, you don't need to worry about any accident like sudden network disconnection by power outage. If a client has been disconnected, all of the locks had been acquired by the client would be automatically cancelled.




## 2. Features
### 2.1. Network
To open a `mutex-server`, utilize the [`MutexServer`](https://mutex.dev/api/classes/msv.mutexserver.html) class and accept or reject connections from the remote clients by using the [`MutexServer.Acceptor`](https://mutex.dev/api/classes/msv.mutexserver.acceptor.html) class. Otherwise, you want to connect to a remote `mutex-server` as a client, utilize the [`MutexConnector`](https://mutex.dev/api/classes/msv.mutexserver.html) class.

  - [`MutexServer`](https://mutex.dev/api/classes/msv.mutexserver.html)
  - [`MutexServer.Acceptor`](https://mutex.dev/api/classes/msv.mutexserver.acceptor.html)
  - [`MutexConnector`](https://mutex.dev/api/classes/msv.mutexserver.html)

### 2.2. Critical Section Components
If you succeeded to connect to a `mutex-server`, as a client through the [`MutexConnector`](https://mutex.dev/api/classes/msv.mutexserver.html) class, you can utilize lots of remote critical section components like below. For reference, all of those critical section components are following the STL (Standard Template Library) design.

Also, [`std.UniqueLock`](https://mutex.dev/api/modules/std.uniquelock.html) and [`std.SharedLock`](https://mutex.dev/api/modules/std.sharedlock.html) can be a good solution for safe development. They always ensure that acquired lock to be automatically unlocked, in any circumstance, even if an error occurs in your business code.

  - Solid Components
    - [`RemoteConditionVariable`](https://mutex.dev/api/classes/msv.remoteconditionvariable.html)
    - [`RemoteMutex`](https://mutex.dev/api/classes/msv.remotemutex.html)
    - [`RemoteSemaphore`](https://mutex.dev/api/classes/msv.remotesemaphore.html)
  - Adaptor Components
    - [`RemoteBarrier`](https://mutex.dev/api/classes/msv.remotebarrier.html)
    - [`RemoteLatch`](https://mutex.dev/api/classes/msv.remotelatch.html)
  - Safety Helpers
    - [`std.UniqueLock`](https://mutex.dev/api/modules/std.uniquelock.html)
    - [`std.SharedLock`](https://mutex.dev/api/modules/std.sharedlock.html)




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

async function client(character: string): Promise<void>
{
    // CONNECT TO THE SERVER
    let connector: msv.MutexConnector<string, null> = new msv.MutexConnector(PASSWORD, null);
    await connector.connect(`ws://127.0.0.1:${PORT}`);
    
    // GET LOCK
    let mutex: msv.RemoteMutex = await connector.getMutex("printer");
    await mutex.lock();

    // PRINTS A LINE VERY SLOWLY MONOPOLYING THE MUTEX
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
        promises.push( client(character) );
    }

    // WAIT THE CLIENTS TO BE DISCONNCTED AND CLOSE SERVER
    await Promise.all(promises);
    await server.close();
}
main();
```




## 4. Appendix
### 4.1. Repositories
  - Github: https://github.com/samchon/mutex-server
  - NPM: https://www.npmjs.com/package/mutex-server

### 4.2. Documents
  - API Docs: https://mutex.dev/api
  - Guide Documents: *not yet, but would come in someday >o<*

### 4.3. Dependencies
#### 4.3.1. [TypeScript](https://github.com/microsoft/typescript)
I've developed this `mutex-server` with the [TypeScript](https://github.com/microsoft/typescript).

Also, I want all users of this `mutex-server` to use the [TypeScript](https://github.com/microsoft/typescript) too, for the safe development. As this `mutex-server` is designed to handling critical section in the network level, a tiny mistake like mis-typing can be a critical damage on the entire network system. It's the reason why I recommend you to use the [TypeScript](https://github.com/microsoft/typescript) when utilizing this `mutex-server`.

#### 4.3.2. [TSTL](https://github.com/samchon/tstl)
This `mutex-server` is an extension module for the [TSTL](https://github.com/samchon/tstl).

#### 4.3.3. [TGrid](https://github.com/samchon/tgrid)
The `mutex-server` has realized its remote, network level critical section, components by utilizing [RFC](https://github.com/samchon/tgrid#13-remote-function-call) (Remote Function Call) concepts invented by the [TGrid](https://github.com/samchon/tgrid).