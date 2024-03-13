import { ConnectionFactory } from "../internal/ConnectionFactory";

export async function test_semaphore_simple(
  factory: ConnectionFactory,
): Promise<void> {
  let connector = await factory();
  let semaphore = await connector.getSemaphore("test_sema2", 4);

  for (let i: number = 0; i < 4; ++i) await semaphore.acquire();

  let promises: Promise<void>[] = [];
  let count: number = 0;

  for (let i: number = 0; i < 4; ++i)
    promises.push(
      semaphore.acquire().then(() => {
        ++count;
      }),
    );

  await semaphore.release(4);
  await Promise.all(promises);

  if (count !== 4) throw new Error("Error on RemoteSemaphore.release(4)");
}
