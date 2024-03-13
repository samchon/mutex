import { MutexConnector, RemoteSemaphore } from "mutex-server";
import { sleep_for } from "tstl";
import { ITimedLockable } from "tstl/base/thread";

import { ConnectionFactory } from "../internal/ConnectionFactory";
import { IActivation } from "../internal/IActivation";
import { Validator } from "../internal/Validator";

const SIZE = 8;

export async function test_semaphore_acquires(
  factory: ConnectionFactory,
): Promise<void> {
  //----
  // TEST MUTEX FEATURES
  //----
  const connector: MutexConnector<IActivation, null> = await factory();
  const mutex: RemoteSemaphore = await connector.getSemaphore(
    "test_semaphore_acquires_binary",
    1,
  );
  const wrapper: ITimedLockable = RemoteSemaphore.get_lockable(mutex);

  await Validator.lock(wrapper);
  await Validator.try_lock(wrapper);

  //----
  // TEST SPECIAL FEATURES OF SEMAPHORE
  //----
  const semaphore: RemoteSemaphore = await connector.getSemaphore(
    "test_semaphore_acquires_counting",
    SIZE,
  );

  await _Test_semaphore(semaphore);
  await _Test_timed_semaphore(semaphore);
}

async function _Test_semaphore(s: RemoteSemaphore): Promise<void> {
  let acquired_count: number = 0;

  // LOCK 4 TIMES
  for (let i: number = 0; i < (await s.max()); ++i) {
    await s.acquire();
    ++acquired_count;
  }
  if (acquired_count !== (await s.max()))
    throw new Error(`Bug on Semaphore.acquire()`);
  else if ((await s.try_acquire()) === true)
    throw new Error(`Bug on Semaphore.try_acquire()`);

  // LOCK 4 TIMES AGAIN -> THEY SHOULD BE HOLD
  for (let i: number = 0; i < (await s.max()); ++i)
    s.acquire().then(() => {
      ++acquired_count;
    });
  if (acquired_count !== (await s.max()))
    throw new Error(`Bug on Semaphore.acquire() when Semaphore is full`);

  // DO UNLOCK
  await s.release(await s.max());

  if (acquired_count !== 2 * (await s.max()))
    throw new Error(`Bug on Semaphore.release()`);

  // RELEASE UNRESOLVED LOCKS
  await sleep_for(0);
  await s.release(await s.max());
}

async function _Test_timed_semaphore(ts: RemoteSemaphore): Promise<void> {
  // TRY LOCK FIRST
  for (let i: number = 0; i < (await ts.max()); ++i) {
    const flag: boolean = await ts.try_acquire_for(0);
    if (flag === false)
      throw new Error(
        "Bug on TimedSemaphore.try_lock_for(); failed to lock when clear",
      );
  }

  // TRY LOCK FOR -> MUST BE FAILED
  if ((await ts.try_acquire_for(50)) === true)
    throw new Error(
      "Bug on TimedSemaphore.try_lock_for(); succeeded to lock when must be failed.",
    );

  // LOCK WOULD BE HOLD
  let cnt: number = 0;
  for (let i: number = 0; i < (await ts.max()) / 2; ++i)
    ts.acquire().then(() => {
      ++cnt;
    });

  await sleep_for(100);
  if (cnt === (await ts.max()) / 2)
    throw new Error(
      "Bug on TimedSemaphore.try_lock_for(); failed to release holdings.",
    );

  // RELEASE AND LOCK
  await ts.release(await ts.max());

  for (let i: number = 0; i < (await ts.max()) / 2; ++i) {
    const flag: boolean = await ts.try_acquire_for(100);
    if (flag === false)
      throw new Error(
        "Bug on TimedSemaphore.try_lock_for(); failed to lock when released.",
      );
  }
  await ts.release(await ts.max());
}
