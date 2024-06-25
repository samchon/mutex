import { sleep_for } from "tstl";
import { MutexConnector, MutexServer, RemoteMutex } from "mutex-server";
import { IActivation } from "./internal/IActivation";
import { ConnectionFactory } from "./internal/ConnectionFactory";

async function test(factory: ConnectionFactory): Promise<void> {
  let connector: MutexConnector<IActivation> = await factory();
  let mutex: RemoteMutex = await connector.getMutex("test_destructors");

  await mutex.lock_shared();
  await sleep_for(50);

  // mutex.unlock_shared() would be automatically called
  await connector.close();
}

export async function test_destructors(
  factory: ConnectionFactory,
  server: MutexServer<IActivation>,
): Promise<void> {
  const promises: Promise<void>[] = [];
  for (let i: number = 0; i < 4; ++i) promises.push(test(factory));

  await Promise.all(promises);
  await sleep_for(50);

  if (server["components_"].mutexes["dict_"].has("test_destructors") === true)
    throw new Error("Destructor is not working.");
}
