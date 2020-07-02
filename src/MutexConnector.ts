/**
 * @packageDocumentation
 * @module msv
 */
//-----------------------------------------------------------
import { WebConnector } from "tgrid/protocols/web/WebConnector";
import { Driver } from "tgrid/components/Driver";
import { ProviderCapsule } from "./server/ProviderCapsule";

import { RemoteBarrier } from "./client/RemoteBarrier";
import { RemoteConditionVariable } from "./client/RemoteConditionVariable";
import { RemoteLatch } from "./client/RemoteLatch";
import { RemoteMutex } from "./client/RemoteMutex";
import { RemoteSemaphore } from "./client/RemoteSemaphore";

/**
 * Mutex server connector for client.
 * 
 * @template Header Type of the *header* containing initial data.
 * @template Provider Type of additional features provided for the remote server.
 * @author Jeongho Nam - https://github.com/samchon
 */
export class MutexConnector<Header, Provider extends object | null>
{
    /**
     * @hidden
     */
    private base_: WebConnector<Header, Provider>;

    /**
     * @hidden
     */
    private controller_: Driver<ProviderCapsule<any>>;

    /* -----------------------------------------------------------
        CONSTRUCTORS
    ----------------------------------------------------------- */
    /**
     * Initializer Constructor.
     * 
     * @param header Initial data.
     * @param provider Additional feature provided for the remote server.
     */
    public constructor(header: Header, provider: Provider)
    {
        this.base_ = new WebConnector(header, provider);
        this.controller_ = this.base_.getDriver();
    }

    /**
     * Connect to a remote `mutex-server`.
     * 
     * Try connection to the remote `mutex-server` with its *address* and waiting for the server
     * to accept the trial. If the `mutex-server` accepts your connection, the function would be
     * returned. Otherwise, the server rejects your connection, an exception would be thrown.
     * 
     * After the connection and your business (using remote critical sections) has been 
     * completed, please don't forget closing the connection in time to prevent waste of the 
     * server resource.
     * 
     * @param url URL address to connect.
     * @throw WebError when server rejects your connection.
     */
    public connect(url: string): Promise<void>
    {
        return this.base_.connect(url);
    }

    /**
     * Close connection.
     * 
     * Close connection from the remote `mutex-server`.
     * 
     * @throw DomainError when the connection is not online.
     */
    public async close(): Promise<void>
    {
        await this.base_.close();
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

    /* -----------------------------------------------------------
        ACCESSORS
    ----------------------------------------------------------- */
    /**
     * Get server url.
     */
    public get url(): string | undefined
    {
        return this.base_.url;
    }

    /**
     * Get connection state.
     */
    public get state(): MutexConnector.State
    {
        return this.base_.state;
    }

    /**
     * Get header.
     */
    public get header(): Header
    {
        return this.base_.header;
    }

    /**
     * Get Driver for RFC (Remote Function Call).
     * 
     * If your target {@link MutexServer} provides additional features, you can utilize those 
     * features through returned `Driver` object by this method. To use this method, you should 
     * define the `Controller` template argument, a type of interface who is defining additional 
     * features provided from the remote server. 
     * 
     * The returned object `Driver` makes to call remote functions, defined in the `Controller` 
     * and provided by `Provider` in the remote server, possible. In other words, callling a 
     * function in the `Driver<Controller>`, it means to call a matched function in the remote 
     * server's `Provider` object.
     * 
     *   - `Controller`: Definition only
     *   - `Driver`: Remote Function Call
     * 
     * @template Controller An interface for provided features (functions & objects) from the remote system (`Provider`).
     * @template UseParametric Whether to convert type of function parameters to be compatible with their pritimive.
     * @return A Driver for the RFC.
     */
    public getDriver<Controller extends object, UseParametric extends boolean = false>(): Driver.Promisive<Controller, UseParametric>
    {
        return this.controller_.provider as any;
    }

    /* -----------------------------------------------------------
        THREAD COMPONENTS
    ----------------------------------------------------------- */
    /**
     * Get remote barrier.
     * 
     * @param key An identifier name to be created or search for.
     * @param count Downward counter of the target barrier, if newly created.
     * @return A {@link RemoteBarrier} object.
     */
    public getBarrier(key: string, count: number): Promise<RemoteBarrier>
    {
        return RemoteBarrier.create(this.controller_.group.barriers, key, count);
    }

    /**
     * Get remote condition variable.
     * 
     * @param key An identifier name to be created or search for.
     * @return A {@link RemoteConditionVariable} object.
     */
    public getConditionVariable(key: string): Promise<RemoteConditionVariable>
    {
        return RemoteConditionVariable.create(this.controller_.group.condition_variables, key);
    }

    /**
     * Get remote latch.
     * 
     * @param identifier An identifier name to be created or search for.
     * @param count Downward counter of the target latch, if newly created.
     * @return A {@link RemoteLatch} object.
     */
    public getLatch(identifier: string, count: number): Promise<RemoteLatch>
    {
        return RemoteLatch.create(this.controller_.group.latches, identifier, count);
    }

    /**
     * Get remote mutex.
     * 
     * @param key An identifier name to be created or search for.
     * @return A {@link RemoteMutex} object.
     */
    public getMutex(key: string): Promise<RemoteMutex>
    {
        return RemoteMutex.create(this.controller_.group.mutexes, key);
    }

    /**
     * Get remote semaphore.
     * 
     * @param key An identifier name to be created or search for.
     * @param count Downward counter of the target semaphore, if newly created.
     * @return A {@link RemoteSemaphore} object.
     */
    public getSemaphore(key: string, count: number): Promise<RemoteSemaphore>
    {
        return RemoteSemaphore.create(this.controller_.group.semaphores, key, count);
    }
}

export namespace MutexConnector
{
    /**
     * Current state of the {@link MutexConnector}
     */
    export import State = WebConnector.State;
}