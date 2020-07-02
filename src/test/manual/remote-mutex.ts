import msv from "../../index";
import std from "tstl";

const PASSWORD = "qweqwe123!";
const PORT = 37119;

async function client(index: number, character: string): Promise<void>
{
    // CONNECT TO THE SERVER
    let connector: msv.MutexConnector<string, null> = new msv.MutexConnector(PASSWORD, null);
    await connector.connect(`ws://127.0.0.1:${PORT}`);
    
    // GET LOCK
    let mutex: msv.RemoteMutex = await connector.getMutex("printer");
    await mutex.lock();

    // PRINTS A LINE VERY SLOWLY MONOPOLYING THE MUTEX
    process.stdout.write(`Connector #${index} is monopolying a mutex: `);
    for (let i: number = 0; i < 20; ++i)
    {
        process.stdout.write(character);
        await std.sleep_for(50);
    }
    process.stdout.write("\n");

    // ALTHOUGH THE CLIENT DOES NOT RELEASE THE LOCK
    if (Math.random() < 0.5)
        await mutex.unlock();
    else // SERVER WILL UNLOCK IT AUTOMATICALLY AFTER THE DISCONNECTION
        await connector.close();
}

async function main(): Promise<void>
{
    // OPEN SERVER
    let server: msv.MutexServer<string, null> = new msv.MutexServer();
    await server.open(PORT, async acceptor =>
    {
        if (acceptor.header === PASSWORD)
            await acceptor.accept(null);
        else
            await acceptor.reject();
    });

    // CREATE 10 CLIENTS LOCKING MUTEX
    let promises: Promise<void>[] = [];
    for (let i: number = 0; i < 4; ++i)
    {
        let character: string = std.randint(0, 9).toString();
        promises.push( client(i + 1, character) );
    }

    // WAIT THE CLIENTS TO BE DISCONNCTED AND CLOSE SERVER
    await Promise.all(promises);
    await server.close();
}
main();