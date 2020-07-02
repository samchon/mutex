/**
 * @packageDocumentation
 * @module msv
 */
//-----------------------------------------------------------
import { WebServer } from "tgrid/protocols/web/WebServer";
import { WebAcceptor } from "tgrid/protocols/web/WebAcceptor";
import { Driver } from "tgrid/components/Driver";

import { ProviderCapsule } from "./server/ProviderCapsule";
import { ProviderGroup } from "./server/ProviderGroup";
import { GlobalGroup } from "./server/GlobalGroup";

/**
 * The Mutex Server.
 * 
 * @template Header Type of the *header* who is containing the activation info.
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
     * clients' connections by considering their {@link MutexServer.ConnectionInfo} data.
     * 
     * @param port Port number to listen.
     * @param handler A handler function determining whether to accept the client's connection or not.
     */
    public open(port: number, handler: (acceptor: MutexServer.Acceptor<Header, Provider>) => Promise<void>): Promise<void>
    {
        return this.server_.open(port, async base => 
        {
            let group: ProviderGroup = new ProviderGroup(this.components_, base);
            let acceptor: MutexServer.Acceptor<Header, Provider> = MutexServer.Acceptor.create(base, group);

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

/**
 * 
 */
export namespace MutexServer
{
    /**
     * Current state of the {@link MutexServer}
     */
    export import State = WebServer.State;

    /**
     * MutexServer Acceptor.
     * 
     * @template Header Type of the *header* containing initial data.
     * @template Provider Type of additional features provided for the remote client.
     * @author Jeongho Nam - https://github.com/samchon
     */
    export class Acceptor<Header, Provider extends object | null>
        implements Pick<WebAcceptor<Header, Provider>, "getDriver">
    {
        /**
         * @hidden
         */
        private base_: WebAcceptor<Header, ProviderCapsule<Provider>>;

        /**
         * @hidden
         */
        private group_: ProviderGroup;

        /* ----------------------------------------------------------------
            CONSTRUCTORS
        ---------------------------------------------------------------- */
        /**
         * @hidden
         */
        private constructor(base: WebAcceptor<Header, ProviderCapsule<Provider>>, group: ProviderGroup)
        {
            this.base_ = base;
            this.group_ = group;
        }

        /**
         * @internal
         */
        public static create<Header, Provider extends object | null>
            (base: WebAcceptor<Header, ProviderCapsule<Provider>>, group: ProviderGroup)
        {
            return new Acceptor(base, group);
        }

        /**
         * 
         * @param code 
         * @param reason 
         */
        public close(code?: number, reason?: string): Promise<void>
        {
            return this.base_.close(code, reason);
        }

        /**
         * Join connection.
         */
        public join(): Promise<void>;

        /**
         * Join connection until timeout.
         * 
         * @param ms The maximum miliseconds for waiting.
         * @return Whether succeeded to waiting in the given time.
         */
        public join(ms: number): Promise<boolean>;

        /**
         * Join connection until time expiration.
         * 
         * @param at The maximum time point to wait.
         * @return Whether succeeded to waiting in the given time.
         */
        public join(at: Date): Promise<boolean>;

        public join(param?: number | Date): Promise<void | boolean>
        {
            return this.base_.join(param! as Date);
        }

        /* ----------------------------------------------------------------
            ACCESSORS
        ---------------------------------------------------------------- */
        /**
         * 
         */
        public get ip(): string
        {
            return this.base_.ip;
        }

        /**
         * 
         */
        public get path(): string
        {
            return this.base_.path;
        }

        /**
         * 
         */
        public get header(): Header
        {
            return this.base_.header;
        }

        /**
         * 
         */
        public get state()
        {
            return this.base_.state;
        }

        /**
         * @inheritDoc
         */
        public getDriver<Controller extends object, UseParametric extends boolean = false>(): Driver<Controller, UseParametric>
        {
            return this.base_.getDriver();
        }

        /* ----------------------------------------------------------------
            HANDSHAKES
        ---------------------------------------------------------------- */
        /**
         * 
         * @param provider 
         */
        public async accept(provider: Provider): Promise<void>
        {
            await this.base_.accept({ group: this.group_, provider: provider });
            this.base_.join().then(() => this.group_.destructor());
        }

        /**
         * 
         * @param status 
         * @param reason 
         */
        public reject(status?: number, reason?: string): Promise<void>
        {
            return this.base_.reject(status, reason);
        }
    }
    export namespace Acceptor
    {
        /**
         * Current state of the {@link MutexServer.Acceptor}
         */
        export import State = WebAcceptor.State;
    }
}