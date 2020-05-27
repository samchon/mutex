import { UniqueLock } from "tstl/thread/UniqueLock";
import { sleep_for } from "tstl/thread/global";

import { MutexServer } from "../MutexServer";
import { MutexConnector } from "../MutexConnector";
import { RemoteMutex } from "../remote/RemoteMutex";

const PORT = 44994;
const SLEEP_TIME = 100;
const REPEAT = 5;

function sleep(mutex: RemoteMutex): Promise<void>
{
    return UniqueLock.lock(mutex, () => sleep_for(SLEEP_TIME));
}

async function main(): Promise<void>
{
    // PREPARE SERVER AND CLIENT
    let server: MutexServer = new MutexServer();
    await server.open(PORT);

    let connector: MutexConnector = new MutexConnector();
    await connector.connect(`http://127.0.0.1:${PORT}`);

    // TEST MUTEX WITH SLEEP
    let mutex: RemoteMutex = await connector.getMutex("something");
    let time: number = Date.now();
    let joiners: Promise<void>[] = [];

    for (let i: number = 0 ; i < REPEAT; ++i)
        joiners.push( sleep(mutex) );

    await Promise.all(joiners);
    
    if (Date.now() - time < SLEEP_TIME * REPEAT)
        throw new Error("Error on RemoteMutex~: UniqueLock doesn't work exactly.");

    // CLOSE CONNECTION
    await connector.close();
    await server.close();
}
main();