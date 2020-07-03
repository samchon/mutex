/**
 * @packageDocumentation
 * @module msv
 */
//-----------------------------------------------------------
import { WebServer } from "tgrid/protocols/web/WebServer";
import { MutexAcceptor } from "./MutexAcceptor";

import { ProviderCapsule } from "./server/ProviderCapsule";
import { ProviderGroup } from "./server/ProviderGroup";
import { GlobalGroup } from "./server/GlobalGroup";

/**
 * The Mutex Server.
 * 
 * The {@link MutexServer} is a class who can open an `mutex-server`. Clients connecting to the
 * `mutex-server` would communicate with this server through {@link MutexAcceptor} objects using
 * websocket and [RFC](https://github.com/samchon/tgrid#13-remote-function-call) protocol.
 * 
 * To open the `mutex-server`, call the {@link open} method with your custom callback function 
 * which would be called whenever a {@link MutexAcceptor} has been newly created by a client's
 * connection.
 * 
 * Also, when declaring this {@link MutexServer} type, you've to define two template arguments,
 * *Header* and *Provider*. The *Header* type repersents an initial data gotten from the remote
 * client after the connection. I hope you and client not to omit it and utilize it as an 
 * activation tool to enhance security. 
 * 
 * The second template argument *Provider* represents the additional features provided for the 
 * remote client. If you don't have any plan to provide additional feature to the remote client, 
 * just declare it as `null`.
 * 
 * @template Header Type of the *header* containing initial data.
 * @template Provider Type of additional features provided for the remote client.
 * @author Jeongho Nam - https://github.com/samchon
 */
export class MutexServer<Header, Provider extends object | null>
{
    /**
     * @hidden
     */
    private server_: WebServer<Header, ProviderCapsule<Provider>>;

    /**
     * @hidden
     */
    private components_: GlobalGroup;

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
        this.components_ = new GlobalGroup();
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
     * clients' connections by considering their {@link MutexAcceptor.header} data.
     * 
     * @param port Port number to listen.
     * @param handler A handler function determining whether to accept the client's connection or not.
     */
    public open(port: number, handler: (acceptor: MutexAcceptor<Header, Provider>) => Promise<void>): Promise<void>
    {
        return this.server_.open(port, async base => 
        {
            let group: ProviderGroup = new ProviderGroup(this.components_, base);
            let acceptor: MutexAcceptor<Header, Provider> = MutexAcceptor.create(base, group);

            await handler(acceptor);
        });
    }

    /**
     * Close the `mutex-server`.
     * 
     * Close the `mutex-server` and disconnect all the remote connections between its clients.
     * Therefore, clients who are using the {@link MutexConnector} class, they can't use the 
     * remote-thread-components more. 
     * 
     * Also, closing the server means that all of the [RFC](https://github.com/samchon/tgrid#13-remote-function-call)s
     * between the server and had connected clients would be destroied. Therefore, all of the [RFC](https://github.com/samchon/tgrid#13-remote-function-call)s
     * that are not returned (completed) yet would ge {@link RuntimeError} exception.
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
     *   - `NONE`: The `{@link MutexServer} instance is newly created, but did nothing yet.
     *   - `OPENING`: The {@link MutexServer.open} method is on running.
     *   - `OPEN`: The `mutex-server` is online.
     *   - `CLOSING`: The {@link MutexServer.close} method is on running.
     *   - `CLOSED`: The `mutex-server` is offline.
     */
    public get state(): MutexServer.State
    {
        return this.server_.state;
    }
}

/**
 * 
 */
export namespace MutexServer
{
    /**
     * Current state of the {@link MutexServer}
     */
    export import State = WebServer.State;
}