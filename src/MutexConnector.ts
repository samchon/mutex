/**
 * @packageDocumentation
 * @module ms
 */
//-----------------------------------------------------------
import { WebConnector } from "tgrid/protocols/web/WebConnector";
import { Driver } from "tgrid/components/Driver";
import { Provider } from "./server/Provider";

import { RemoteBarrier } from "./client/RemoteBarrier";
import { RemoteConditionVariable } from "./client/RemoteConditionVariable";
import { RemoteLatch } from "./client/RemoteLatch";
import { RemoteMutex } from "./client/RemoteMutex";
import { RemoteSemaphore } from "./client/RemoteSemaphore";

/**
 * Mutex server connector for client.
 * 
 * @typeParam Headers Type of the *headers* who containing the activation info.
 * @author Jeongho Nam - https://github.com/samchon
 */
export class MutexConnector<Headers extends object>
{
    /**
     * @hidden
     */
    private connector_: WebConnector<Provider>;

    /**
     * @hidden
     */
    private controller_: Driver<Provider>;

    /* -----------------------------------------------------------
        CONSTRUCTORS
    ----------------------------------------------------------- */
    /**
     * Default Constructor.
     */
    public constructor()
    {
        this.connector_ = new WebConnector();
        this.controller_ = this.connector_.getDriver();
    }

    /**
     * Connect to a remote `mutex-server`.
     * 
     * Try connection to the remote `mutex-server` with its *address* and waiting for the server
     * to accept the trial through the *headers*. If the `mutex-server` rejects your connection,
     * then exception would be thrown.
     * 
     * After the connection and your business (using remote critical sections) has been 
     * completed, please don't forget closing the connection in time to prevent waste of the 
     * server resource.
     * 
     * @param url URL address to connect.
     * @param headers Additional data for the activation.
     */
    public connect(url: string, headers: Headers): Promise<void>
    {
        return this.connector_.connect(url, headers);
    }

    /**
     * Close connection.
     * 
     * Close connection with the remote `mutex-server`.
     */
    public async close(): Promise<void>
    {
        await this.connector_.close();
    }

    /* -----------------------------------------------------------
        ACCESSORS
    ----------------------------------------------------------- */
    /**
     * Get server url.
     */
    public get url(): string | undefined
    {
        return this.connector_.url;
    }

    /**
     * Get connection state.
     */
    public get state(): WebConnector.State
    {
        return this.connector_.state;
    }

    /* -----------------------------------------------------------
        THREAD COMPONENTS
    ----------------------------------------------------------- */
    /**
     * Get remote barrier.
     * 
     * @param name An identifier name to be created or search for.
     * @param count Downward counter of the target barrier, if newly created.
     * @return A {@link RemoteBarrier} object.
     */
    public getBarrier(name: string, count: number): Promise<RemoteBarrier>
    {
        return RemoteBarrier.create(this.controller_.barriers, name, count);
    }

    /**
     * Get remote condition variable.
     * 
     * @param name An identifier name to be created or search for.
     * @return A {@link RemoteConditionVariable} object.
     */
    public getConditionVariable(name: string): Promise<RemoteConditionVariable>
    {
        return RemoteConditionVariable.create(this.controller_.condition_variables, name);
    }

    /**
     * Get remote latch.
     * 
     * @param name An identifier name to be created or search for.
     * @param count Downward counter of the target latch, if newly created.
     * @return A {@link RemoteLatch} object.
     */
    public getLatch(name: string, count: number): Promise<RemoteLatch>
    {
        return RemoteLatch.create(this.controller_.latches, name, count);
    }

    /**
     * Get remote mutex.
     * 
     * @param name An identifier name to be created or search for.
     * @return A {@link RemoteMutex} object.
     */
    public getMutex(name: string): Promise<RemoteMutex>
    {
        return RemoteMutex.create(this.controller_.mutexes, name);
    }

    /**
     * Get remote semaphore.
     * 
     * @param name An identifier name to be created or search for.
     * @param count Downward counter of the target semaphore, if newly created.
     * @return A {@link RemoteSemaphore} object.
     */
    public getSemaphore(name: string, count: number): Promise<RemoteSemaphore>
    {
        return RemoteSemaphore.create(this.controller_.semaphores, name, count);
    }
}