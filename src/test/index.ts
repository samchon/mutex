import * as fs from "fs";

import { IHeaders } from "./internal/IHeaders";
import { MutexServer } from "../MutexServer";
import { MutexConnector } from "../MutexConnector";

const EXTENSION = __filename.substr(-2);
if (EXTENSION === "js")
    require("source-map-support").install();

const PORT = 44994;
const URL = `ws://127.0.0.1:${PORT}`;
const HEADERS = { password: "some_password" };

interface IModule
{
    [key: string]: (connector: MutexConnector<IHeaders>, headers: IHeaders) => Promise<void>;
}

async function measure(job: () => Promise<void>): Promise<number>
{
    let time: number = Date.now();
    await job();
    return Date.now() - time;
}

async function iterate(connector: MutexConnector<IHeaders>, headers: IHeaders, path: string): Promise<void>
{
    let fileList: string[] = await fs.promises.readdir(path);
    for (let file of fileList)
    {
        let currentPath: string = `${path}/${file}`;
        let stats: fs.Stats = await fs.promises.lstat(currentPath);

        if (stats.isDirectory() === true && file !== "internal")
        {
            await iterate(connector, headers, currentPath);
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
            let time: number = await measure(() => external[key](connector, headers));
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
    let server: MutexServer<IHeaders> = new MutexServer();
    await server.open(PORT, info => info.headers.password === HEADERS.password );

    // CONNECT TO THE SERVER
    let connector: MutexConnector<IHeaders> = new MutexConnector();
    await connector.connect(URL, HEADERS);

    //----
    // TEST AUTOMATION
    //----
    // DO TEST WITH ELAPSED TIME
    let time: number = await measure(() => iterate(connector, HEADERS, __dirname));

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
    await connector.close();
    await server.close();
}
main().catch(exp => 
{
    process.stdout.write("\n");
    console.log(exp);
    process.exit(-1);
});