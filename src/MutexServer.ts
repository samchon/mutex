import { WebServer } from "tgrid/protocols/web/WebServer";
import { Provider } from "./server/Provider";

/**
 * The Mutex Server.
 * 
 * @typeParam Headers Type of the *headers* who containing the activation info.
 * @author Jeongho Nam - https://github.com/samchon
 */
export class MutexServer<Headers extends object>
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
    /**
     * Default Constructor
     */
    public constructor()
    {
        this.server_ = new WebServer();
        this.provider_ = new Provider();
    }

    /**
     * Open a mutex server.
     * 
     * @param port Port number to listen.
     * @param predicator A predicator function determining whether to accept the client's connection or not.
     */
    public open(port: number, predicator: MutexServer.Predicator<Headers>): Promise<void>
    {
        return this.server_.open<Headers>(port, async acceptor => 
        {
            let info: MutexServer.ConnectionInfo<Headers> = {
                ip: acceptor.ip,
                path: acceptor.path,
                headers: acceptor.headers
            };
            if (await predicator(info) === true)
                await acceptor.accept(this.provider_);
            else // @todo: detailed reason
                await acceptor.reject();
        });
    }

    /**
     * Close the mutex server.
     */
    public close(): Promise<void>
    {
        return this.server_.close();
    }

    /* -----------------------------------------------------------
        ACCESSORS
    ----------------------------------------------------------- */
    /**
     * Get server state
     */
    public get state(): MutexServer.State
    {
        return this.server_.state;
    }
}

export namespace MutexServer
{
    /**
     * Current state of the `mutex-server`
     */
    export import State = WebServer.State;

    /**
     * The predicator function type.
     * 
     * @typeParam Headers Type of the *headers*.
     */
    export interface Predicator<Headers extends object>
    {
        /**
         * @param info The information about connection with a client.
         * @return Whether to accept the connection or not.
         */
        (info: ConnectionInfo<Headers>): boolean | Promise<boolean>;
    }

    /**
     * Connection information with a client.
     * 
     * @typeParam Headers Type of the *headers*.
     */
    export interface ConnectionInfo<Headers extends object>
    {
        /**
         * IP address of the client.
         */
        ip: string;

        /**
         * Connection path the client has used.
         */
        path: string;

        /**
         * Headers who containing information about the activation.
         */
        headers: Headers;
    }
}