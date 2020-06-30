import { ConnectionFactory } from "../internal/ConnectionFactory";
import { sleep_for } from "tstl/thread/global";
import { IPointer } from "tstl/functional/IPointer";

async function wait_and_disconnect(factory: ConnectionFactory, ptr: IPointer<number>): Promise<void>
{
    let connector = await factory();
    let cv = await connector.getConditionVariable("test_condition_variable_disconnections");

    cv.wait().then(() => ++ptr.value).catch(() => {});
    await sleep_for(50);
    await connector.close();
}

export async function test_condition_variable_disconnections(factory: ConnectionFactory): Promise<void>
{
    let connector = await factory();
    let cv = await connector.getConditionVariable("test_condition_variable_disconnections");
    let ptr: IPointer<number> = { value: 0 };

    let promises: Promise<void>[] = [];
    for (let i: number = 0; i < 4; ++i)
        promises.push( wait_and_disconnect(factory, ptr) );
    await Promise.all(promises);

    cv.wait().then(() => ++ptr.value);
    await cv.notify_all();
    await sleep_for(50);

    if (ptr.value !== 1)
        throw new Error("Error on RemoteConditionVariable.wait(): disconnection does not cancel the wait.");
}

