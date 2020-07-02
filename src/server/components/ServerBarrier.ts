/**
 * @packageDocumentation
 * @module msv
 */
//-----------------------------------------------------------
import { IComponent } from "./IComponent";
import { ServerConditionVariable } from "./ServerConditionVariable";

import { WebAcceptor } from "tgrid/protocols/web/WebAcceptor";
import { List } from "tstl/container/List";
import { Joiner } from "./internal/Joiner";

/**
 * @internal
 */
export class ServerBarrier implements IComponent
{
    private cv_: ServerConditionVariable;

    private size_: number;
    private count_: number;

    /* ---------------------------------------------------------
        CONSTRUCTORS
    --------------------------------------------------------- */
    public constructor(size: number)
    {
        this.cv_ = new ServerConditionVariable();

        this.size_ = size;
        this.count_ = size;
    }

    public _Insert_acceptor(acceptor: WebAcceptor<any, any>): void
    {
        this.cv_._Insert_acceptor(acceptor);
    }

    public _Erase_acceptor(acceptor: WebAcceptor<any, any>): boolean
    {
        return this.cv_._Erase_acceptor(acceptor);
    }

    /* ---------------------------------------------------------
        WAITORS
    --------------------------------------------------------- */
    public wait(acceptor: WebAcceptor<any, any>, disolver: List.Iterator<Joiner>): Promise<void>
    {
        return this.cv_.wait(acceptor, disolver);
    }

    public wait_for(ms: number, acceptor: WebAcceptor<any, any>, disolver: List.Iterator<Joiner>): Promise<boolean>
    {
        return this.cv_.wait_for(ms, acceptor, disolver);
    }

    /* ---------------------------------------------------------
        ARRIVERS
    --------------------------------------------------------- */
    public async arrive(n: number): Promise<void>
    {
        let completed: boolean = (this.count_ += n) <= this.size_;
        if (completed === false)
            return;

        this.count_ %= this.size_;
        await this.cv_.notify_all();
    }

    public async arrive_and_wait(acceptor: WebAcceptor<any, any>, disolver: List.Iterator<Joiner>): Promise<void>
    {
        await this.arrive(1);
        await this.wait(acceptor, disolver);
    }

    public async arrive_and_drop(): Promise<void>
    {
        --this.size_;
        await this.arrive(0);
    }
}