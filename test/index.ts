import * as fs from "fs";
import { MutexConnector, MutexServer } from "mutex-server";

import { IActivation } from "./internal/IActivation";
import { ConnectionFactory } from "./internal/ConnectionFactory";

const EXTENSION = __filename.substr(-2);
if (EXTENSION === "js") require("source-map-support").install();

const PORT = 44994;
const URL = `ws://127.0.0.1:${PORT}`;
const HEADER = { password: "some_password" };

interface IModule {
  [key: string]: (
    factory: ConnectionFactory,
    server: MutexServer<IActivation, null>,
  ) => Promise<void>;
}

async function measure(job: () => Promise<void>): Promise<number> {
  let time: number = Date.now();
  await job();
  return Date.now() - time;
}

async function iterate(
  factory: ConnectionFactory,
  server: MutexServer<IActivation, null>,
  path: string,
): Promise<void> {
  const fileList: string[] = await fs.promises.readdir(path);
  for (let file of fileList) {
    const currentPath: string = `${path}/${file}`;
    const stats: fs.Stats = await fs.promises.lstat(currentPath);

    if (
      stats.isDirectory() === true &&
      file !== "internal" &&
      file !== "manual"
    ) {
      await iterate(factory, server, currentPath);
      continue;
    } else if (
      file.substr(-3) !== `.${EXTENSION}` ||
      currentPath === `${__dirname}/index.${EXTENSION}`
    )
      continue;

    const external: IModule = await import(
      currentPath.substr(0, currentPath.length - 3)
    );
    for (let key in external) {
      if (key.substr(0, 5) !== "test_") continue;
      else if (process.argv[2] && key.indexOf(process.argv[2]) === -1) continue;

      process.stdout.write(`  - ${key}`);
      let time: number = await measure(() => external[key](factory, server));
      console.log(`: ${time} ms`);
    }
  }
}

async function main(): Promise<void> {
  //----
  // PREPARE ASSETS
  //----
  // PRINT TITLE
  console.log("==========================================================");
  console.log(" Mutex Server - Test Automation Program ");
  console.log("==========================================================");

  // OPEN SERVER
  let server: MutexServer<IActivation, null> = new MutexServer();
  await server.open(PORT, async (acceptor) => {
    if (acceptor.header.password === HEADER.password) await acceptor.accept();
    else await acceptor.reject();
  });

  // CONNECTION-FACTORY TO THE SERVER
  let sequence: number = 0;
  const connectorList: MutexConnector<IActivation>[] = [];

  const factory: ConnectionFactory = async () => {
    const connector: MutexConnector<IActivation> = new MutexConnector({
      uid: ++sequence,
      ...HEADER,
    });
    await connector.connect(URL);

    connectorList.push(connector);
    return connector;
  };

  //----
  // TEST AUTOMATION
  //----
  // DO TEST WITH ELAPSED TIME
  let time: number = await measure(() => iterate(factory, server, __dirname));

  // PRINT ELAPSED TIME
  console.log("----------------------------------------------------------");
  console.log("Success");
  console.log(`  - elapsed time: ${time} ms`);

  // MEMORY USAGE
  let memory: NodeJS.MemoryUsage = process.memoryUsage();
  for (let property in memory) {
    let amount: number = memory[property as keyof NodeJS.MemoryUsage] / 10 ** 6;
    console.log(`  - ${property}: ${amount} MB`);
  }
  console.log("----------------------------------------------------------\n");

  //----
  // TERMINATE
  //----
  for (let connector of connectorList)
    if (connector.state === MutexConnector.State.OPEN) await connector.close();

  await server.close();
}
main().catch((exp) => {
  process.stdout.write("\n");
  console.log(exp);
  process.exit(-1);
});
