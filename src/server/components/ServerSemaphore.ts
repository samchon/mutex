/**
 * @packageDocumentation
 * @module mutex
 */
//-----------------------------------------------------------
import { WebAcceptor } from "tgrid/protocols/web/WebAcceptor";

import { HashMap } from "tstl/container/HashMap";
import { List } from "tstl/container/List";
import { OutOfRange } from "tstl/exception/OutOfRange";
import { sleep_for } from "tstl/thread/global";

import { LockType } from "tstl/internal/thread/LockType";
import { Joiner } from "./internal/Joiner";

/**
 * @internal
 */
export class ServerSemaphore
{
    private acceptors_: HashMap<WebAcceptor<any, any>, List<IResolver>>;
    private queue_: List<IResolver>;
    
    private max_: number;
    private acquiring_: number;

    /* ---------------------------------------------------------
        CONSTRUCTORS
    --------------------------------------------------------- */
    public constructor(max: number)
    {
        this.acceptors_ = new HashMap();
        this.queue_ = new List();

        this.acquiring_ = 0;
        this.max_ = max;
    }

    public max(): number
    {
        return this.max_;
    }

    private _Reserve(resolver: IResolver): void
    {
        // FIND OR EMPLACE
        let it: HashMap.Iterator<WebAcceptor<any, any>, List<IResolver>> = this.acceptors_.find(resolver.acceptor);
        if (it.equals(this.acceptors_.end()) === true)
            it = this.acceptors_.emplace(resolver.acceptor, new List()).first;

        // INSERT NEW ITEM
        it.second.push_back(resolver);
    }

    /* ---------------------------------------------------------
        ACQURE & RELEASE
    --------------------------------------------------------- */
    public acquire(acceptor: WebAcceptor<any, any>, disolver: List.Iterator<Joiner>): Promise<void>
    {
        return new Promise<void>(resolve =>
        {
            let it: List.Iterator<IResolver> = this.queue_.insert(this.queue_.end(),
            {
                handler: this.acquiring_ < this.max_
                    ? null
                    : resolve,
                type: LockType.HOLD,
                acceptor: acceptor,
                disolver: disolver
            });

            this._Reserve(it.value);
            disolver.value = () => this._Destruct(it);

            if (it.value.handler === null)
            {
                ++this.acquiring_;
                resolve();
            }
        });
    }

    public async try_acquire(acceptor: WebAcceptor<any, any>, disolver: List.Iterator<Joiner>): Promise<boolean>
    {
        // ACQUIRABLE ?
        if (this.acquiring_ >= this.max_)
            return false;

        // CONSTRUCT RESOLVER
        let it: List.Iterator<IResolver> = this.queue_.insert(this.queue_.end(),
        {
            handler: null,
            type: LockType.HOLD,
            acceptor: acceptor,
            disolver: disolver
        });

        // RESERVE FOR DISCONNECTION
        this._Reserve(it.value);
        disolver.value = () => this._Destruct(it);

        // RETURNS
        ++this.acquiring_;
        return true;
    }

    public async try_acquire_for(ms: number, acceptor: WebAcceptor<any, any>, disolver: List.Iterator<Joiner>): Promise<boolean>
    {
        return new Promise<boolean>(resolve =>
        {
            // CONSTRUCT RESOLVER
            let it: List.Iterator<IResolver> = this.queue_.insert(this.queue_.end(),
            {
                handler: this.acquiring_++ < this.max_
                    ? null
                    : resolve,
                type: LockType.KNOCK,
                acceptor: acceptor,
                disolver: disolver
            });

            // RESERVE FOR DISCONNECTION
            this._Reserve(it.value);
            disolver.value = () => this._Destruct(it);

            // RETURNS OR WAIT UNTIL TIMEOUT
            if (it.value.handler === null)
                resolve(true); // SUCCESS
            else 
                sleep_for(ms).then(() =>
                {
                    // NOT YET, THEN DO UNLOCK
                    if (it.value.handler !== null)
                        this._Cancel(it);
                });
        });
    }

    /* ---------------------------------------------------------
        RELEASE
    --------------------------------------------------------- */
    public async release(n: number, acceptor: WebAcceptor<any, any>): Promise<void>
    {
        acceptor; // @todo

        //----
        // VALIDATION
        //----
        // IN GLOBAL AREA
        if (n < 1)
            throw new OutOfRange(`Error on std.Semaphore.release(): parametric n is less than 1 -> (n = ${n}).`);
        else if (n > this.max_)
            throw new OutOfRange(`Error on std.Semaphore.release(): parametric n is greater than max -> (n = ${n}, max = ${this.max_}).`);
        else if (n > this.acquiring_)
            throw new OutOfRange(`Error on std.Semaphore.release(): parametric n is greater than acquiring -> (n = ${n}, acquiring = ${this.acquiring_}).`);

        // IN LOCAL AREA
        
        //----
        // RELEASE
        //----
        this.acquiring_ -= n;
        this._Release(n);
    }

    private _Release(n: number): void
    {
        for (let it = this.queue_.begin(); !it.equals(this.queue_.end()); it = it.next())
        {
            // DO RESOLVE
            this.queue_.erase(it);
            if (it.value.type === LockType.HOLD)
                it.value.handler!();
            else
            {
                it.value.handler!(true);
                it.value.handler = null;
            }

            // BREAK CONDITION
            if (++this.acquiring_ >= this.max_ || --n === 0)
                break;
        }
    }

    private _Cancel(it: List.Iterator<IResolver>): void
    {
        // POP THE LISTENER
        --this.acquiring_;
        this.queue_.erase(it);

        let handler: Function = it.value.handler!;
        it.value.handler = null;

        // RELEASE IF LASTEST RESOLVER
        let prev: List.Iterator<IResolver> = it.prev();
        if (prev.equals(this.queue_.end()) === false && prev.value.handler !== null)
            this._Release(1);
        
        // RETURNS FAILURE
        handler(false);
    }

    private async _Destruct(it: List.Iterator<IResolver>): Promise<void>
    {
        if (it.prev().next().equals(it) === false)
            return;

        if (it.value.handler === null)
            await this.release(1, it.value.acceptor);
        else
        {
            this._Cancel(it);
            it.value.disolver.source().erase(it.value.disolver);
        }
    }
}

/**
 * @internal
 */
interface IResolver
{
    // THREAD HANDLER
    handler: Function | null;
    type: LockType;

    // DISCONNECTION HANDLER
    acceptor: WebAcceptor<any, any>;
    disolver: List.Iterator<Joiner>;
}