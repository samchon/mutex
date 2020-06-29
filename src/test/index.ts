import * as fs from "fs";

import { IActivation } from "./internal/IActivation";
import { ConnectionFactory } from "./internal/ConnectionFactory";

import { MutexServer } from "../MutexServer";
import { MutexConnector } from "../MutexConnector";

const EXTENSION = __filename.substr(-2);
if (EXTENSION === "js")
    require("source-map-support").install();

const PORT = 44994;
const URL = `ws://127.0.0.1:${PORT}`;
const HEADER = { password: "some_password" };

interface IModule
{
    [key: string]: (factory: ConnectionFactory) => Promise<void>;
}

async function measure(job: () => Promise<void>): Promise<number>
{
    let time: number = Date.now();
    await job();
    return Date.now() - time;
}

async function iterate(factory: ConnectionFactory, path: string): Promise<void>
{
    let fileList: string[] = await fs.promises.readdir(path);
    for (let file of fileList)
    {
        let currentPath: string = `${path}/${file}`;
        let stats: fs.Stats = await fs.promises.lstat(currentPath);

        if (stats.isDirectory() === true && file !== "internal")
        {
            await iterate(factory, currentPath);
            continue;
        }
        else if (file.substr(-3) !== `.${EXTENSION}` || currentPath === `${__dirname}/index.${EXTENSION}`)
            continue;

        let external: IModule = await import(currentPath.substr(0, currentPath.length - 3));
        for (let key in external)
        {
            if (key.substr(0, 5) !== "test_")
                continue;
            else if (key.substr(5) === process.argv[2])
                continue;

            process.stdout.write(`  - ${key}`);
            let time: number = await measure(() => external[key](factory));
            console.log(`: ${time} ms`);
        }
    }
}

async function main(): Promise<void>
{
    //----
    // PREPARE ASSETS
    //----
    // PRINT TITLE
    console.log("==========================================================");
    console.log(" Mutex Server - Test Automation Program ");
    console.log("==========================================================");

    // OPEN SERVER
    let server: MutexServer<IActivation> = new MutexServer();
    await server.open(PORT, info => info.header.password === HEADER.password );

    // CONNECTION-FACTORY TO THE SERVER
    let factory: ConnectionFactory = async () =>
    {
        let connector: MutexConnector<IActivation> = new MutexConnector(HEADER);
        await connector.connect(URL);

        return connector;
    };

    //----
    // TEST AUTOMATION
    //----
    // DO TEST WITH ELAPSED TIME
    let time: number = await measure(() => iterate(factory, __dirname));

    // PRINT ELAPSED TIME
    console.log("----------------------------------------------------------");
    console.log("Success");
    console.log(`  - elapsed time: ${time} ms`);

    // MEMORY USAGE
    let memory: NodeJS.MemoryUsage = process.memoryUsage();
    for (let property in memory)
    {
        let amount: number = memory[property as keyof NodeJS.MemoryUsage] / 10**6;
        console.log(`  - ${property}: ${amount} MB`);
    }
    console.log("----------------------------------------------------------\n");

    //----
    // TERMINATE
    //----
    await server.close();
}
main().catch(exp => 
{
    process.stdout.write("\n");
    console.log(exp);
    process.exit(-1);
});