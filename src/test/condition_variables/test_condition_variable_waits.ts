import { ConnectionFactory } from "../internal/ConnectionFactory";
import { sleep_for } from "tstl/thread/global";

const SLEEP_TIME: number = 100;
const WAIT_COUNT: number = 10;

export async function test_condition_variable_waits(factory: ConnectionFactory): Promise<void>
{
    let connector = await factory();
    let cv = await connector.getConditionVariable("test_condition_variable_waits");
    let wait_count: number = 0;

    //----
    // WAIT & NOTIFY
    //----
    // THERE'RE 10 WAITERS; HOLDERS
    for (let i: number = 0; i < WAIT_COUNT; ++i)
    {
        cv.wait().then(() =>
        {
            --wait_count;
        });
        ++wait_count;
    }

    // NOTIFY ONE
    cv.notify_one();
    await sleep_for(SLEEP_TIME);

    if (wait_count !== WAIT_COUNT - 1)
        throw new Error("Bug on ConditionVariable.notify_one().");

    // NOTIFY ALL
    cv.notify_all();
    await sleep_for(SLEEP_TIME);

    if (wait_count !== 0)
        throw new Error("Bug on ConditionVariable.notify_all().");

    //----
    // WAIT FOR & NOTIFY
    //----
    let success_count: number = 0;

    // THERE'RE 10 WAITERS, HOLDERS, WITH DIFFERENT TIMES
    for (let i: number = 0; i < WAIT_COUNT; ++i)
    {
        cv.wait_for(i * SLEEP_TIME).then(ret =>
        {
            if (ret === true)
                ++success_count;
        });
    }

    // NOTIFY ONE
    await cv.notify_one();

    // NOTIFY ALL WHEN BE HALT TIME
    await sleep_for(WAIT_COUNT * SLEEP_TIME / 2.0);
    cv.notify_all();

    // VALIDATE SUCCESS COUNT
    await sleep_for(SLEEP_TIME);
    if (success_count < 3 || success_count > 7)
        throw new Error("Bug on ConditionVariable.wait_for(): it does not work in exact time.");
}