import { WebServer } from "tgrid/protocols/web/WebServer";
import { Provider } from "./providers/Provider";

export class MutexServer
{
    /**
     * @hidden
     */
    private server_: WebServer<Provider>;

    /**
     * @hidden
     */
    private provider_: Provider;

    /* -----------------------------------------------------------
        CONSTRUCTORS
    ----------------------------------------------------------- */
    public constructor()
    {
        this.server_ = new WebServer();
        this.provider_ = new Provider();
    }

    public async open(port: number): Promise<void>
    {
        await this.server_.open(port, acceptor => acceptor.accept(this.provider_));
    }

    public async close(): Promise<void>
    {
        await this.server_.close();
    }
}