import { MutexConnector, RemoteMutex } from "mutex-server";
import { Pair, sleep_for } from "tstl";

import { IActivation } from "../internal/IActivation";
import { ConnectionFactory } from "../internal/ConnectionFactory";
import { Validator } from "../internal/Validator";

const enum Status {
  START_READING = "Start Reading",
  END_READING = "End Reading",
  START_WRITING = "Start Writing",
  END_WRITING = "End Writing",
}
const MAGNIFIER: number = 3;

export async function test_mutex_locks(
  factory: ConnectionFactory,
): Promise<void> {
  const connector: MutexConnector<IActivation> = await factory();
  const mutex: RemoteMutex = await connector.getMutex("remote_mutex");

  // TEST COMMON FEATURES
  await Validator.lock(mutex);
  await Validator.try_lock(mutex);
  await Validator.lock_shared(mutex);
  await Validator.try_lock_shared(mutex);

  // @todo: must be removed
  if (1 === <any>1) return;

  // TEST SPECIAL FEATURES
  const statusList: Pair<Status, number>[] = [];

  try {
    const promises: Promise<void>[] = [];
    for (let i: number = 0; i < 25; ++i) promises.push(read(mutex, statusList));
    promises.push(write(mutex, statusList));

    await Promise.all(promises);

    let reading: number = 0;
    let writing: number = 0;

    for (let i: number = 0; i < statusList.length; ++i) {
      const status: Status = statusList[i].first;

      if (status === Status.START_READING) ++reading;
      else if (status === Status.START_WRITING) ++writing;
      else if (status === Status.END_READING) --reading;
      else --writing;

      if (writing > 0 && reading > 0)
        throw new Error(
          `Bug on SharedTimeMutex; reading and writing at the same time at ${i}`,
        );
    }
  } catch (exp) {
    for (let pair of statusList) console.log(pair.first, pair.second);
    throw exp;
  }
}

async function write(
  mutex: RemoteMutex,
  statusList: Pair<Status, number>[],
): Promise<void> {
  for (let i: number = 0; i < MAGNIFIER * 10; ++i) {
    // JUST DELAY FOR SAFETY
    await sleep_for(100);
    const time: number = Date.now();

    // DO WRITE
    await mutex.lock();
    {
      const now: number = Date.now();
      statusList.push(new Pair(Status.START_WRITING, now - time));

      await sleep_for(50);
      statusList.push(new Pair(Status.END_WRITING, Date.now() - now));
    }
    await mutex.unlock();
  }
}

async function read(
  mutex: RemoteMutex,
  statusList: Pair<Status, number>[],
): Promise<void> {
  for (let i: number = 0; i < MAGNIFIER * 100; ++i) {
    const time: number = Date.now();

    // DO READ
    await mutex.lock_shared();
    {
      const now: number = Date.now();
      statusList.push(new Pair(Status.START_READING, now - time));

      await sleep_for(10);
      statusList.push(new Pair(Status.END_READING, Date.now() - now));
    }
    await mutex.unlock_shared();
  }
}
