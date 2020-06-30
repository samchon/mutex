/**
 * @packageDocumentation
 * @module mutex
 */
//-----------------------------------------------------------
import { List } from "tstl/container/List";
import { HashMap } from "tstl/container/HashMap";
import { HashSet } from "tstl/container/HashSet";
import { WebAcceptor } from "tgrid/protocols/web/WebAcceptor";

import { IComponent } from "./IComponent";
import { Disolver } from "./internal/Disolver";
import { LockType } from "tstl/internal/thread/LockType";

/**
 * @internal
 */
export abstract class SolidComponent<Resolver extends SolidComponent.IResolver>
    implements IComponent
{
    protected queue_: List<Resolver>;
    protected local_queue_: HashMap<WebAcceptor<any, any>, List<Resolver>>;

    private acceptors_: HashSet<WebAcceptor<any, any>> = new HashSet();

    /* ---------------------------------------------------------
        CONSTRUCTORS
    --------------------------------------------------------- */
    public constructor()
    {
        this.queue_ = new List();
        this.local_queue_ = new HashMap();
    }

    public _Insert_acceptor(acceptor: WebAcceptor<any, any>): void
    {
        this.acceptors_.insert(acceptor);
    }

    public _Erase_acceptor(acceptor: WebAcceptor<any, any>): boolean
    {
        this.acceptors_.erase(acceptor);
        return this.acceptors_.empty();
    }

    /* ---------------------------------------------------------
        ACCESSORS
    --------------------------------------------------------- */
    protected _Insert_resolver(resolver: Resolver): List.Iterator<Resolver>
    {
        //----
        // LOCAL QUEUE
        //----
        // FIND OR EMPLACE
        let it: HashMap.Iterator<WebAcceptor<any, any>, List<Resolver>> = this.local_queue_.find(resolver.acceptor);
        if (it.equals(this.local_queue_.end()) === true)
            it = this.local_queue_.emplace(resolver.acceptor, new List()).first;

        // INSERT NEW ITEM
        it.second.push_back(resolver);

        //----
        // GLOBAL QUEUE
        //----
        return this.queue_.insert(this.queue_.end(), resolver)
    }

    protected _Get_local_queue(acceptor: WebAcceptor<any, any>): List<Resolver> | null
    {
        let it: HashMap.Iterator<WebAcceptor<any, any>, List<Resolver>> = this.local_queue_.find(acceptor);
        return (it.equals(this.local_queue_.end()) === false)
            ? it.second
            : null;
    }

    /* ---------------------------------------------------------
        DISCONNECTION HANDLERS
    --------------------------------------------------------- */
    protected _Discard_resolver(resolver: Resolver): void
    {
        resolver.handler = null;
        resolver.disolver.value = undefined;

        if (resolver.disolver.erased_ !== true)
            resolver.disolver.source().erase(resolver.disolver);
    }
}

export namespace SolidComponent
{
    export interface IResolver
    {
        // THREAD HANDLER
        handler: Function | null;
        lockType: LockType;

        // DISCONNECTION HANDLER
        acceptor: WebAcceptor<any, any>;
        disolver: Disolver;
    }
}