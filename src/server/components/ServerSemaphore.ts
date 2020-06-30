/**
 * @packageDocumentation
 * @module mutex
 */
//-----------------------------------------------------------
import { SolidComponent } from "./SolidComponent";

import { WebAcceptor } from "tgrid/protocols/web/WebAcceptor";

import { List } from "tstl/container/List";
import { OutOfRange } from "tstl/exception/OutOfRange";
import { sleep_for } from "tstl/thread/global";

import { LockType } from "tstl/internal/thread/LockType";
import { Joiner } from "./internal/Joiner";

/**
 * @internal
 */
export class ServerSemaphore extends SolidComponent<IResolver>
{
    private max_: number;
    private acquiring_: number;

    /* ---------------------------------------------------------
        CONSTRUCTORS
    --------------------------------------------------------- */
    public constructor(max: number)
    {
        super();

        this.acquiring_ = 0;
        this.max_ = max;
    }

    public max(): number
    {
        return this.max_;
    }

    /* ---------------------------------------------------------
        ACQUIRANCES
    --------------------------------------------------------- */
    public acquire(acceptor: WebAcceptor<any, any>, disolver: List.Iterator<Joiner>): Promise<void>
    {
        return new Promise<void>(resolve =>
        {
            // ENROLL TO THE RESOLVERS
            let it: List.Iterator<IResolver> = this._Insert_resolver({
                handler: this.acquiring_ < this.max_
                    ? null
                    : resolve,
                lockType: LockType.HOLD,
                acceptor: acceptor,
                disolver: disolver
            });

            // DISCONNECTION HANDLER
            disolver.value = () => this._Handle_disconnection(it);

            // RETURNS OR WAIT
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
        let it: List.Iterator<IResolver> = this._Insert_resolver({
            handler: null,
            lockType: LockType.HOLD,
            acceptor: acceptor,
            disolver: disolver
        });

        // DISCONNECTION HANDLER
        disolver.value = () => this._Handle_disconnection(it);

        // RETURNS
        ++this.acquiring_;
        return true;
    }

    public async try_acquire_for(ms: number, acceptor: WebAcceptor<any, any>, disolver: List.Iterator<Joiner>): Promise<boolean>
    {
        return new Promise<boolean>(resolve =>
        {
            // CONSTRUCT RESOLVER
            let it: List.Iterator<IResolver> = this._Insert_resolver({
                handler: this.acquiring_ < this.max_
                    ? null
                    : resolve,
                lockType: LockType.KNOCK,
                acceptor: acceptor,
                disolver: disolver
            });

            // DISCONNECTION HANDLER
            disolver.value = () => this._Handle_disconnection(it);

            // RETURNS OR WAIT UNTIL TIMEOUT
            if (it.value.handler === null)
            {
                ++this.acquiring_;
                resolve(true);
            }
            else 
                sleep_for(ms).then(() =>
                {
                    let success: boolean = it.value.handler === null;
                    if (success === false)
                        this._Cancel(it);

                    resolve(success);
                });
        });
    }

    private _Cancel(it: List.Iterator<IResolver>): void
    {
        // POP THE LISTENER
        let handler: Function = it.value.handler!;
        
        this.queue_.erase(it);
        this._Discard_resolver(it.value);

        // RELEASE IF LASTEST RESOLVER
        let prev: List.Iterator<IResolver> = it.prev();
        if (prev.equals(this.queue_.end()) === false && prev.value.handler !== null)
            this._Release(1);
        
        // RETURNS FAILURE
        handler(false);
    }

    /* ---------------------------------------------------------
        RELEASE
    --------------------------------------------------------- */
    public async release(n: number): Promise<void>
    {
        //----
        // VALIDATION
        //----
        // IN GLOBAL AREA
        if (n < 1)
            throw new OutOfRange(`Error on RemoteSemaphore.release(): parametric n is less than 1 -> (n = ${n}).`);
        else if (n > this.max_)
            throw new OutOfRange(`Error on RemoteSemaphore.release(): parametric n is greater than max -> (n = ${n}, max = ${this.max_}).`);
        else if (n > this.acquiring_)
            throw new OutOfRange(`Error on RemoteSemaphore.release(): parametric n is greater than acquiring -> (n = ${n}, acquiring = ${this.acquiring_}).`);

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
            // POP HANDLER
            let handler = it.value.handler;
            
            this.queue_.erase(it);
            this._Discard_resolver(it.value);

            if (handler === null)
                continue;

            if (it.value.lockType === LockType.HOLD)
                handler();
            else
                handler(true);

            // BREAK CONDITION
            if (++this.acquiring_ >= this.max_ || --n === 0)
                break;
        }
    }

    private async _Handle_disconnection(it: List.Iterator<IResolver>): Promise<void>
    {
        if (it.prev().next().equals(it) === false)
            return;

        if (it.value.handler === null)
            await this.release(1);
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
type IResolver = SolidComponent.IResolver;