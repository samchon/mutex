import { MutexConnector, RemoteMutex } from "mutex-server";
import { sleep_for } from "tstl";

import { IActivation } from "../internal/IActivation";
import { ConnectionFactory } from "../internal/ConnectionFactory";

async function test_disconnection(
  factory: ConnectionFactory,
  index: number,
): Promise<void> {
  const connector: MutexConnector<IActivation> = await factory();
  const mutex: RemoteMutex = await connector.getMutex(
    "test_mutex_disconnection",
  );

  if (index % 2 === 0) {
    if ((await mutex.try_lock_for(SLEEP * COUNT * 20)) === false)
      throw new Error(
        "Error on RemoteMutex.try_lock_for(): disconnected clients do not return their acquisitions.",
      );
  } else mutex.try_lock_for(SLEEP * COUNT * 20).catch(() => {});

  await sleep_for(SLEEP * index);
  await connector.close();
}

export async function test_mutex_disconnections(
  factory: ConnectionFactory,
): Promise<void> {
  const promises: Promise<void>[] = [];
  for (let i: number = 0; i < COUNT; ++i)
    promises.push(test_disconnection(factory, i));

  await Promise.all(promises);
}

const COUNT = 4;
const SLEEP = 10;
