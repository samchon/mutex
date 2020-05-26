import { WebServer } from "tgrid/protocols/web/WebServer";
import { MutexProvider } from "./internal/MutexProvider";

export class MutexServer
{
    private server_: WebServer<MutexProvider> = new WebServer();
    private provider_: MutexProvider = new MutexProvider();

    public async open(port: number = MutexServer.PORT): Promise<void>
    {
        await this.server_.open(port, acceptor => acceptor.accept(this.provider_));
    }

    public async close(): Promise<void>
    {
        await this.server_.close();
    }
}
export namespace MutexServer
{
    export const PORT = 37111;
}