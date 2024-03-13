import { MutexConnector, RemoteSemaphore } from "mutex-server";
import { ConnectionFactory } from "../internal/ConnectionFactory";
import { IActivation } from "../internal/IActivation";
import { sleep_for } from "tstl";

const MAX = 8;
const SLEEP = 50;

async function acquire_and_disconnect(
  factory: ConnectionFactory,
  ms: number,
): Promise<void> {
  const connector: MutexConnector<IActivation, null> = await factory();
  const semaphore: RemoteSemaphore = await connector.getSemaphore(
    "test_semaphore_disconnections",
    0,
  );

  if ((await semaphore.max()) !== MAX)
    throw new Error("Error on RemoteSemaphore.max(): invalid value.");
  else if ((await semaphore.try_acquire()) === false)
    throw new Error(
      "Error on RemoteSemaphore.try_acquire(): must be true but returns false.",
    );

  sleep_for(ms).then(() => connector.close());
}

export async function test_semaphore_disconnections(
  factory: ConnectionFactory,
): Promise<void> {
  const connector: MutexConnector<IActivation, null> = await factory();
  const semaphore: RemoteSemaphore = await connector.getSemaphore(
    "test_semaphore_disconnections",
    MAX,
  );

  for (let i: number = 0; i < MAX / 2; ++i)
    if ((await semaphore.try_acquire()) === false)
      throw new Error(
        "Error on RemoteSemaphore.try_acquire(): must be true but returns false.",
      );

  for (let i: number = 0; i < MAX / 2; ++i)
    await acquire_and_disconnect(factory, SLEEP);

  if ((await semaphore.try_acquire()) === true)
    throw new Error(
      "Error on RemoteSemaphore.try_acquire(): must be false but returns true.",
    );

  const promises: Promise<void>[] = [];
  let count: number = 0;
  for (let i: number = 0; i < MAX / 2; ++i)
    promises.push(
      semaphore.try_acquire_for(SLEEP * 1.2).then(() => {
        ++count;
      }),
    );
  if (count !== 0)
    throw new Error(
      "Error on RemoteSemaphore.try_acquire_for(): succeded too early.",
    );

  await Promise.all(promises);
  if (count !== MAX / 2)
    throw new Error(
      "Error on RemoteSemaphore.try_acquire_for(): must be succeeded but failed.",
    );

  await semaphore.release(4);
}
