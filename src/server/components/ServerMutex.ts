import { WebAcceptor } from "tgrid/protocols/web/WebAcceptor";

import { HashMap } from "tstl/container/HashMap";
import { List } from "tstl/container/List";
import { InvalidArgument } from "tstl/exception/InvalidArgument";
import { sleep_for } from "tstl/thread/global";

import { AccessType } from "tstl/internal/thread/AccessType";
import { LockType } from "tstl/internal/thread/LockType";
import { Disolver } from "./internal/Disolver";

/**
 * @hidden
 */
export class ServerMutex
{
    private acceptors_: HashMap<WebAcceptor<any, any>, IAggregate>;
    private queue_: List<IResolver>;

    private writing_: number;
    private reading_: number;

    /* ---------------------------------------------------------
        CONSTRUCTORS
    --------------------------------------------------------- */
    public constructor()
    {
        this.acceptors_ = new HashMap();
        this.queue_ = new List();

        this.writing_ = 0;
        this.reading_ = 0;
    }

    private _Current_access_type(): AccessType | null
    {
        return this.queue_.empty()
            ? null
            : this.queue_.front().accessType;
    }

    private _Aggregate(resolver: IResolver): IAggregate
    {
        // FIND OR EMPLACE
        let it: HashMap.Iterator<WebAcceptor<any, any>, IAggregate> = this.acceptors_.find(resolver.acceptor);
        if (it.equals(this.acceptors_.end()) === true)
            it = this.acceptors_.emplace(resolver.acceptor, 
            {
                reading: 0, 
                writing: 0, 
                read: 0, 
                wrote: 0 
            }).first;

        // COUNTING
        if (resolver.accessType === AccessType.READ)
        {
            ++it.second.reading;
            if (resolver.handler === null)
                ++it.second.read;
        }
        else
        {
            ++it.second.writing;
            if (resolver.handler === null)
                ++it.second.wrote;
        }
        
        // RETURNS
        resolver.aggregate = it.second;
        return it.second;
    }

    /* ---------------------------------------------------------
        WRITE LOCK
    --------------------------------------------------------- */
    public lock(acceptor: WebAcceptor<any, any>, disolver: Disolver): Promise<void>
    {
        return new Promise(resolve =>
        {
            // CONSTRUCT RESOLVER
            let it: List.Iterator<IResolver> = this.queue_.insert(this.queue_.end(), 
            {
                handler: (this.writing_++ === 0 && this.reading_ === 0)
                    ? null
                    : resolve,
                accessType: AccessType.WRITE,
                lockType: LockType.HOLD,
                
                acceptor: acceptor,
                aggregate: undefined!,
                disolver: disolver,
            });

            // RESERVE FOR DISOLVER
            this._Aggregate(it.value);
            disolver.value = () => this._Destruct_write(it);

            // RETURNS OR WAIT
            if (it.value.handler === null)
                resolve();
        });
    }

    public async try_lock(acceptor: WebAcceptor<any, any>, disolver: Disolver): Promise<boolean>
    {
        if (this.writing_ !== 0 || this.reading_ !== 0)
            return false;

        // CONSTRUCT RESOLVER
        ++this.writing_;
        let it: List.Iterator<IResolver> = this.queue_.insert(this.queue_.end(),
        {
            handler: null,
            accessType: AccessType.WRITE,
            lockType: LockType.KNOCK,

            acceptor: acceptor,
            aggregate: undefined!,
            disolver: disolver,
        });

        // RESERVE FOR DISCONNECTION
        this._Aggregate(it.value);
        disolver.value = () => this._Destruct_write(it);

        // RETURNS
        return true;
    }

    public try_lock_for(acceptor: WebAcceptor<any, any>, disolver: Disolver, ms: number): Promise<boolean>
    {
        return new Promise<boolean>(resolve =>
        {
            // CONSTRUCT RESOLVER
            let it: List.Iterator<IResolver> = this.queue_.insert(this.queue_.end(), 
            {
                handler: (this.writing_++ === 0 && this.reading_ === 0)
                    ? null
                    : resolve,
                lockType: LockType.KNOCK,
                acceptor: acceptor,

                accessType: AccessType.WRITE,
                aggregate: undefined!,
                disolver: disolver
            });

            // RESERVE FOR DISCONNECTION
            this._Aggregate(it.value);
            disolver.value = () => this._Destruct_write(it);

            // RETURNS OR WAIT UNTIL TIMEOUT
            if (it.value.handler === null)
                resolve(true); // SUCCESS
            else 
                sleep_for(ms).then(() =>
                {
                    // NOT YET, THEN DO UNLOCK
                    if (it.value.handler !== null)
                    {
                        --this.writing_;
                        this._Cancel(it);
                    }
                });
        });
    }

    public async try_lock_until(acceptor: WebAcceptor<any, any>, disolver: Disolver, at: Date): Promise<boolean>
    {
        let now: Date = new Date();
        let ms: number = at.getTime() - now.getTime();

        return await this.try_lock_for(acceptor, disolver, ms);
    }

    public async unlock(): Promise<void>
    {
        if (this._Current_access_type() !== AccessType.WRITE)
            throw new InvalidArgument(`Error on RemoteMutex.unlock(): this mutex is free on the unique lock.`);

        // DECREASE COUNTS
        let top: IResolver = this.queue_.front();
        --top.aggregate.writing;
        --top.aggregate.wrote;

        --this.writing_;

        // RELEASE
        this.queue_.pop_front();
        this._Release();
    }

    /* ---------------------------------------------------------
        READ LOCK
    --------------------------------------------------------- */
    public lock_shared(acceptor: WebAcceptor<any, any>, disolver: Disolver): Promise<void>
    {
        return new Promise<void>(resolve =>
        {
            // CONSTRUCT RESOLVER
            let it: List.Iterator<IResolver> = this.queue_.insert(this.queue_.end(),
            {
                handler: (this.writing_ === 0)
                    ? null
                    : resolve,
                accessType: AccessType.READ,
                lockType: LockType.HOLD,

                acceptor: acceptor,
                aggregate: undefined!,
                disolver: disolver
            });

            // RESERVE FOR DISCONNECTION
            this._Aggregate(it.value);
            disolver.value = () => this._Destruct_read(it);

            // RETURNS OR WAIT
            ++this.reading_;
            if (it.value.handler === null)
                resolve();
        });
    }

    public async try_lock_shared(acceptor: WebAcceptor<any, any>, disolver: Disolver): Promise<boolean>
    {
        if (this.writing_ !== 0)
            return false;
        
        // CONSTRUCT RESOLVER
        let it = this.queue_.insert(this.queue_.end(),
        {
            handler: null,
            accessType: AccessType.READ,
            lockType: LockType.KNOCK,

            acceptor: acceptor,
            aggregate: undefined!,
            disolver: disolver
        });

        // RESERVE FOR DISCONNECTION
        this._Aggregate(it.value);
        disolver.value = () => this._Destruct_read(it);

        // RETURNS
        ++this.reading_;
        return true;
    }

    public try_lock_shared_for(acceptor: WebAcceptor<any, any>, disolver: Disolver, ms: number): Promise<boolean>
    {
        return new Promise<boolean>(resolve =>
        {
            // CONSTRUCT RESOLVER
            let it: List.Iterator<IResolver> = this.queue_.insert(this.queue_.end(),
            {
                handler: (this.writing_ === 0)
                    ? null
                    : resolve,
                accessType: AccessType.READ,
                lockType: LockType.KNOCK,

                acceptor: acceptor,
                aggregate: undefined!,
                disolver: disolver
            });

            // RESERVE FOR DISCONNECTION
            this._Aggregate(it.value);
            disolver.value = () => this._Destruct_read(it);
            
            // RETURNS OR WAIT UNTIL TIMEOUT
            ++this.reading_;
            if (it.value.handler === null)
                resolve(true);
            else
                sleep_for(ms).then(() =>
                {
                    if (it.value.handler !== null)
                    {
                        --this.reading_;
                        this._Cancel(it);
                    }
                });
        });
    }

    public async try_lock_shared_until(acceptor: WebAcceptor<any, any>, disolver: Disolver, at: Date): Promise<boolean>
    {
        let now: Date = new Date();
        let ms: number = at.getTime() - now.getTime();

        return await this.try_lock_shared_for(acceptor, disolver, ms);
    }

    public async unlock_shared(): Promise<void>
    {
        if (this._Current_access_type() !== AccessType.READ)
            throw new InvalidArgument(`Error on RemoteMutex.unlock_shared(): this mutex is free on the shared lock.`);

        // DECREASE COUNTS
        let top: IResolver = this.queue_.front();
        --top.aggregate.reading;
        --top.aggregate.read;

        --this.reading_;

        // RELEASE
        this.queue_.pop_front();
        this._Release();
    }

    /* ---------------------------------------------------------
        RELEASE
    --------------------------------------------------------- */
    private _Release(): void
    {
        // STEP TO THE NEXT LOCKS
        let current: AccessType = this._Current_access_type()!;

        for (let resolver of this.queue_)
        {
            // DIFFERENT ACCESS TYPE COMES?
            if (resolver.accessType !== current)
                break;

            // NOT RESOLVED YET?
            if (resolver.handler !== null)
            {
                // CLEAR FIRST
                let handler: Function | null = resolver.handler;
                resolver.handler = null;

                // CALL LATER
                if (resolver.lockType === LockType.HOLD)
                    handler();
                else
                    handler(true);
            }
            
            // STOP AFTER WRITE LOCK
            if (resolver.accessType === AccessType.WRITE)
                break;
        }
    }

    private _Cancel(it: List.Iterator<IResolver>): void
    {
        //----
        // POP THE RELEASE
        //----
        // DO RASE
        this.queue_.erase(it);

        // EXTRACT HANDLER TO AVOID THE `this._Release()`
        let handler: Function = it.value.handler!;
        it.value.handler = null;

        //----
        // POST-PROCESS
        //----
        // CHECK THE PREVIOUS RESOLVER
        let prev: List.Iterator<IResolver> = it.prev();

        // RELEASE IF IT IS THE LASTEST RESOLVER
        if (prev.equals(this.queue_.end()) === false && prev.value.handler === null)
            this._Release();
        
        // (LAZY) RETURNS FAILURE
        handler(false);
    }

    private async _Destruct_write(it: List.Iterator<IResolver>): Promise<void>
    {
        if (it.value.handler === null && it.value.aggregate.wrote !== 0)
            await this.unlock();
        else
            this._Cancel(it);
    }

    private async _Destruct_read(it: List.Iterator<IResolver>): Promise<void>
    {
        if (it.value.handler === null && it.value.aggregate.read !== 0)
            await this.unlock_shared();
        else
            this._Cancel(it);
    }
}

interface IAggregate
{
    reading: number;
    writing: number;
    read: number;
    wrote: number;
}

interface IResolver
{
    // THREAD HANDLER
    handler: Function | null;
    accessType: AccessType; // read or write
    lockType: LockType; // void or boolean

    // DISCONNECTION HANDLERS
    acceptor: WebAcceptor<any, any>; // connection with client
    aggregate: IAggregate;
    disolver: Disolver;
}