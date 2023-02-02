import { ConnectionFactory } from "../internal/ConnectionFactory";

export async function test_semaphore_simple(
    factory: ConnectionFactory,
): Promise<void> {
    const connector = await factory();
    const semaphore = await connector.getSemaphore("test_sema2", 4);

    await Promise.all(new Array(4).fill("").map(() => semaphore.acquire()));

    const promises: Promise<number>[] = new Array(4).fill("").map(async () => {
        await semaphore.acquire();
        return 1;
    });
    await semaphore.release(4);

    const count: number = (await Promise.all(promises)).reduce(
        (a, b) => a + b,
        0,
    );
    if (count !== 4) throw new Error("Error on RemoteSemaphore.release(4)");
}
