import { sleep_for } from "tstl/thread/global";

import { MutexConnector } from "../MutexConnector";
import { MutexServer } from "../MutexServer";
import { RemoteMutex } from "../client/RemoteMutex";
import { ConnectionFactory } from "./internal/ConnectionFactory";
import { IActivation } from "./internal/IActivation";

async function test(factory: ConnectionFactory): Promise<void> {
    const connector: MutexConnector<IActivation, null> = await factory();
    const mutex: RemoteMutex = await connector.getMutex("test_destructors");

    await mutex.lock_shared();
    await sleep_for(50);

    // mutex.unlock_shared() would be automatically called
    await connector.close();
}

export async function test_destructors(
    factory: ConnectionFactory,
    server: MutexServer<IActivation, null>,
): Promise<void> {
    const promises: Promise<void>[] = new Array(4)
        .fill("")
        .map(() => test(factory));
    await Promise.all(promises);
    await sleep_for(50);

    if (server["components_"].mutexes["dict_"].has("test_destructors") === true)
        throw new Error("Destructor is not working.");
}
