import { IPointer } from "tstl/functional/IPointer";
import { sleep_for } from "tstl/thread/global";

import { ArrayUtil } from "../internal/ArrayUtil";
import { ConnectionFactory } from "../internal/ConnectionFactory";

async function wait_and_disconnect(
    factory: ConnectionFactory,
    ptr: IPointer<number>,
): Promise<void> {
    const connector = await factory();
    const cv = await connector.getConditionVariable(
        "test_condition_variable_disconnections",
    );

    cv.wait()
        .then(() => ++ptr.value)
        .catch(() => {});
    await sleep_for(50);
    await connector.close();
}

export async function test_condition_variable_disconnections(
    factory: ConnectionFactory,
): Promise<void> {
    const connector = await factory();
    const cv = await connector.getConditionVariable(
        "test_condition_variable_disconnections",
    );
    const ptr: IPointer<number> = { value: 0 };

    await ArrayUtil.asyncRepeat(4, () => wait_and_disconnect(factory, ptr));

    cv.wait().then(() => ++ptr.value);
    await cv.notify_all();
    await sleep_for(50);

    if (ptr.value !== 1)
        throw new Error(
            "Error on RemoteConditionVariable.wait(): disconnection does not cancel the wait.",
        );
}
