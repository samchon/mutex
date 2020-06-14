/**
 * @packageDocumentation
 * @module ms
 */
//-----------------------------------------------------------
import { WebServer } from "tgrid/protocols/web/WebServer";
import { Provider } from "./server/Provider";

/**
 * The Mutex Server.
 * 
 * @typeParam Headers Type of the *headers* who is containing the activation info.
 * @author Jeongho Nam - https://github.com/samchon
 */
export class MutexServer<Headers extends object>
{
    /**
     * @hidden
     */
    private server_: WebServer<Headers, Provider>;

    /**
     * @hidden
     */
    private provider_: Provider;

    /* -----------------------------------------------------------
        CONSTRUCTORS
    ----------------------------------------------------------- */
    /**
     * Default Constructor.
     * 
     * Create a web-socket server, without secured option (`ws://`).
     */
    public constructor();

    /**
     * Initializer Constructor.
     * 
     * Create a secured web-socket server with *key* and *certification* data (`wss://`).
     * 
     * @param key Key string.
     * @param cert Certification string.
     */
    public constructor(key: string, cert: string);

    public constructor(key?: string, cert?: string)
    {
        this.server_ = new WebServer(key!, cert!);
        this.provider_ = new Provider();
    }

    /**
     * Open a `mutex-server`.
     * 
     * Open a `mutex-server` through web-socket protocol, with its *port* number and *predicator* 
     * function determining whether to accept the client's connection or not. After the 
     * `mutex-server` has been opened, clients can connect to that `mutex-server` by using the 
     * {@link MutexConnector} class.
     * 
     * When implementing the *predicator* function, returns `true` if you want to accept a new 
     * client's connection. Otherwise you dont't want to accept the client and reject its 
     * connection, returns `false` instead.
     * 
     * Note that, this `mutex-server` handles the global critical sections on the entire network 
     * level. If you define the *predicator* function to accept every client's connection, some 
     * bad guy can spoil your own `mutex-server` by monopolying those critical sections. 
     * Therefore, don't implement the *predicator* function to returns only `true`, but filter
     * clients' connections by considering their {@link MutexServer.ConnectionInfo} data.
     * 
     * @param port Port number to listen.
     * @param predicator A predicator function determining whether to accept the client's connection or not.
     */
    public open(port: number, predicator: MutexServer.Predicator<Headers>): Promise<void>
    {
        return this.server_.open(port, async acceptor => 
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
     * Close the `mutex-server`.
     * 
     * Close the `mutex-server` and disconnect all the remote connections between its clients.
     * Therefore, clients who are using the {@link MutexConnector} class, they can't use the 
     * remote-thread-components more. 
     * 
     * If there're some clients who are waiting for monopolying some critical sections through 
     * remote-thread-components like {@link RemoteMutex.lock} or {@link RemoteSemaphore.acquire}, 
     * those clients would get `exception` when the `mutex-server` has been closed.
     */
    public close(): Promise<void>
    {
        return this.server_.close();
    }

    /* -----------------------------------------------------------
        ACCESSORS
    ----------------------------------------------------------- */
    /**
     * Get server state.
     * 
     * Get current state of the `mutex-server`. List of values are such like below:
     * 
     *   - NONE: A `{@link MutexServer} instance is newly created, but did nothing yet.
     *   - OPENING: The {@link MutexServer.open} method is on running.
     *   - OPEN: The `mutex-server` is online.
     *   - CLOSING: The {@link MutexServer.close} method is on running.
     *   - CLOSED: The `mutex-server` is offline.
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