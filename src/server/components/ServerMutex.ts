/**
 * @packageDocumentation
 * @module mutex
 */
//-----------------------------------------------------------
import { WebAcceptor } from "tgrid/protocols/web/WebAcceptor";

import { HashMap } from "tstl/container/HashMap";
import { List } from "tstl/container/List";
import { InvalidArgument } from "tstl/exception/InvalidArgument";
import { sleep_for } from "tstl/thread/global";

import { AccessType } from "tstl/internal/thread/AccessType";
import { LockType } from "tstl/internal/thread/LockType";
import { Joiner } from "./internal/Joiner";

/**
 * @internal
 */
export class ServerMutex
{
    private acceptors_: HashMap<WebAcceptor<any, any>, List<IResolver>>;
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

    private _Reserve(resolver: IResolver): void
    {
        // FIND OR EMPLACE
        let it: HashMap.Iterator<WebAcceptor<any, any>, List<IResolver>> = this.acceptors_.find(resolver.acceptor);
        if (it.equals(this.acceptors_.end()) === true)
            it = this.acceptors_.emplace(resolver.acceptor, new List()).first;

        // INSERT NEW ITEM
        it.second.push_back(resolver);
    }

    private _Get_acceptor_resolvers(acceptor: WebAcceptor<any, any>): List<IResolver> | null
    {
        let it: HashMap.Iterator<WebAcceptor<any, any>, List<IResolver>> = this.acceptors_.find(acceptor);
        return (it.equals(this.acceptors_.end()) === false)
            ? it.second
            : null;
    }

    /* ---------------------------------------------------------
        WRITE LOCK
    --------------------------------------------------------- */
    public lock(acceptor: WebAcceptor<any, any>, disolver: List.Iterator<Joiner>): Promise<void>
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
                disolver: disolver,
            });

            // RESERVE FOR DISOLVER
            this._Reserve(it.value);
            disolver.value = () => this._Destruct_write(it);

            // RETURNS OR WAIT
            if (it.value.handler === null)
                resolve();
        });
    }

    public async try_lock(acceptor: WebAcceptor<any, any>, disolver: List.Iterator<Joiner>): Promise<boolean>
    {
        // LOCKABLE ?
        if (this.writing_ !== 0 || this.reading_ !== 0)
            return false;

        // CONSTRUCT RESOLVER
        let it: List.Iterator<IResolver> = this.queue_.insert(this.queue_.end(),
        {
            handler: null,
            accessType: AccessType.WRITE,
            lockType: LockType.KNOCK,

            acceptor: acceptor,
            disolver: disolver,
        });

        // RESERVE FOR DISCONNECTION
        this._Reserve(it.value);
        disolver.value = () => this._Destruct_write(it);

        // RETURNS
        ++this.writing_;
        return true;
    }

    public try_lock_for(ms: number, acceptor: WebAcceptor<any, any>, disolver: List.Iterator<Joiner>): Promise<boolean>
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
                disolver: disolver
            });

            // RESERVE FOR DISCONNECTION
            this._Reserve(it.value);
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

    public async unlock(acceptor: WebAcceptor<any, any>): Promise<void>
    {
        //----
        // VALIDATION
        //----
        // IN GLOBAL AREA
        if (this.queue_.empty() === true || this.queue_.front().accessType !== AccessType.WRITE)
            throw new InvalidArgument(`Error on RemoteMutex.unlock(): this mutex is free on the unique lock.`);

        // IN LOCAL AREA
        let local: List<IResolver> | null = this._Get_acceptor_resolvers(acceptor);
        if (local === null || local.empty() === true || local.front().accessType !== AccessType.WRITE)
            throw new InvalidArgument("Error on RemoteMutex.unlock(): you're free on the unique lock.");
        
        //----
        // RELEASE
        //----
        // ERASE FROM LOCAL
        let top: IResolver = local.front();
        top.disolver.source().erase(top.disolver);
        local.pop_front();
        
        // ERASE FROM GLOBAL
        --this.writing_;
        this.queue_.pop_front();
        
        // DO RELEASE
        this._Release();
    }

    /* ---------------------------------------------------------
        READ LOCK
    --------------------------------------------------------- */
    public lock_shared(acceptor: WebAcceptor<any, any>, disolver: List.Iterator<Joiner>): Promise<void>
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
                disolver: disolver
            });

            // RESERVE FOR DISCONNECTION
            this._Reserve(it.value);
            disolver.value = () => this._Destruct_read(it);

            // RETURNS OR WAIT
            ++this.reading_;
            if (it.value.handler === null)
                resolve();
        });
    }

    public async try_lock_shared(acceptor: WebAcceptor<any, any>, disolver: List.Iterator<Joiner>): Promise<boolean>
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
            disolver: disolver
        });

        // RESERVE FOR DISCONNECTION
        this._Reserve(it.value);
        disolver.value = () => this._Destruct_read(it);

        // RETURNS
        ++this.reading_;
        return true;
    }

    public try_lock_shared_for(ms: number, acceptor: WebAcceptor<any, any>, disolver: List.Iterator<Joiner>): Promise<boolean>
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
                disolver: disolver
            });

            // RESERVE FOR DISCONNECTION
            this._Reserve(it.value);
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

    public async unlock_shared(acceptor: WebAcceptor<any, any>): Promise<void>
    {
        //----
        // VALIDATION
        //----
        // IN GLOBAL AREA
        if (this.queue_.empty() === true || this.queue_.front().accessType !== AccessType.READ)
            throw new InvalidArgument(`Error on RemoteMutex.unlock_shared(): this mutex is free on the shared lock.`);

        // IN LOCAL AREA
        let local: List<IResolver> | null = this._Get_acceptor_resolvers(acceptor);
        if (local === null || local.empty() === true || local.front().accessType !== AccessType.WRITE)
            throw new InvalidArgument("Error on RemoteMutex.unlock_shared(): you're free on the shared lock.");

        //----
        // RELEASE
        //----
        // ERASE FROM LOCAL
        let top: IResolver = local.front();
        top.disolver.source().erase(top.disolver);
        local.pop_front();
        
        // ERASE FROM GLOBAL
        --this.reading_;
        this.queue_.pop_front();

        // DO RELEASE
        this._Release();
    }

    /* ---------------------------------------------------------
        RELEASE
    --------------------------------------------------------- */
    private _Release(): void
    {
        if (this.queue_.empty() === true)
            return;
        
        // STEP TO THE NEXT LOCKS
        let current: AccessType = this.queue_.front().accessType;

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
        // CHECK ALIVE
        if (it.prev().next().equals(it) === false)
            return;

        // DESTRUCT
        if (it.value.handler === null)
            await this.unlock(it.value.acceptor);
        else
        {
            this._Cancel(it);
            it.value.disolver.source().erase(it.value.disolver);
        }
    }

    private async _Destruct_read(it: List.Iterator<IResolver>): Promise<void>
    {
        // CHECK ALIVE
        if (it.prev().next().equals(it) === false)
            return;

        // DESTRUCT
        if (it.value.handler === null)
            await this.unlock_shared(it.value.acceptor);
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
    accessType: AccessType; // read or write
    lockType: LockType; // void or boolean

    // DISCONNECTION HANDLER
    acceptor: WebAcceptor<any, any>;
    disolver: List.Iterator<Joiner>;
}