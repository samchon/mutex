import { WebConnector } from "tgrid/protocols/web/WebConnector";
import { Driver } from "tgrid/components/Driver";
import { Provider } from "./providers/Provider";

import { RemoteBarrier } from "./remote/RemoteBarrier";
import { RemoteConditionVariable } from "./remote/RemoteConditionVariable";
import { RemoteLatch } from "./remote/RemoteLatch";
import { RemoteMutex } from "./remote/RemoteMutex";
import { RemoteSemaphore } from "./remote/RemoteSemaphore";

export class MutexConnector
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
     * Default Constructor
     */
    public constructor()
    {
        this.connector_ = new WebConnector();
        this.controller_ = this.connector_.getDriver();
    }

    public async connect(url: string): Promise<void>
    {
        await this.connector_.connect(url);
    }

    public async close(): Promise<void>
    {
        await this.connector_.close();
    }

    /* -----------------------------------------------------------
        ACCESSORS
    ----------------------------------------------------------- */
    public get url(): string | undefined
    {
        return this.connector_.url;
    }

    public get state(): WebConnector.State
    {
        return this.connector_.state;
    }

    /* -----------------------------------------------------------
        THREAD COMPONENTS
    ----------------------------------------------------------- */
    public getBarriers(name: string, count: number): Promise<RemoteBarrier>
    {
        return RemoteBarrier.create(this.controller_.barriers, name, count);
    }

    public getConditionVariable(name: string): Promise<RemoteConditionVariable>
    {
        return RemoteConditionVariable.create(this.controller_.condition_variables, name);
    }

    public getLatch(name: string, count: number): Promise<RemoteLatch>
    {
        return RemoteLatch.create(this.controller_.latches, name, count);
    }

    public getMutex(name: string): Promise<RemoteMutex>
    {
        return RemoteMutex.create(this.controller_.mutexes, name);
    }

    public getSemaphore(name: string, count: number): Promise<RemoteSemaphore>
    {
        return RemoteSemaphore.create(this.controller_.semaphores, name, count);
    }
}