/**
 * @packageDocumentation
 * @module msv
 */
//-----------------------------------------------------------
import { WebAcceptor } from "tgrid/protocols/web/WebAcceptor";
import { HashMap } from "tstl/container/HashMap";
import { HashSet } from "tstl/container/HashSet";
import { List } from "tstl/container/List";
import { LockType } from "tstl/internal/thread/LockType";

import { IComponent } from "./IComponent";
import { Disolver } from "./internal/Disolver";

/**
 * @internal
 */
export abstract class SolidComponent<
    Resolver extends SolidComponent.Resolver<Resolver, Aggregate>,
    Aggregate extends Record<string, number>,
> implements IComponent
{
    protected queue_: List<Resolver>;
    protected local_areas_: HashMap<
        WebAcceptor<any, any>,
        SolidComponent.LocalArea<Resolver, Aggregate>
    >;

    private acceptors_: HashSet<WebAcceptor<any, any>> = new HashSet();

    /* ---------------------------------------------------------
        CONSTRUCTORS
    --------------------------------------------------------- */
    public constructor() {
        this.queue_ = new List();
        this.local_areas_ = new HashMap();
    }

    public _Insert_acceptor(acceptor: WebAcceptor<any, any>): void {
        this.acceptors_.insert(acceptor);
    }

    public _Erase_acceptor(acceptor: WebAcceptor<any, any>): boolean {
        this.acceptors_.erase(acceptor);
        return this.acceptors_.empty();
    }

    /* ---------------------------------------------------------
        ACCESSORS
    --------------------------------------------------------- */
    protected _Insert_resolver(resolver: Resolver): List.Iterator<Resolver> {
        //----
        // LOCAL QUEUE
        //----
        // FIND OR EMPLACE
        let mit: HashMap.Iterator<
            WebAcceptor<any, any>,
            SolidComponent.LocalArea<Resolver, Aggregate>
        > = this.local_areas_.find(resolver.acceptor);
        if (mit.equals(this.local_areas_.end()) === true)
            mit = this.local_areas_.emplace(resolver.acceptor, {
                queue: new List(),
                aggregate: resolver.aggregate,
            }).first;
        else {
            for (const key in resolver.aggregate)
                (mit.second.aggregate as Record<string, number>)[key] +=
                    resolver.aggregate[key];
            resolver.aggregate = mit.second.aggregate;
        }

        // INSERT NEW ITEM
        const lit: List.Iterator<Resolver> = mit.second.queue.insert(
            mit.second.queue.end(),
            resolver,
        );

        //----
        // GLOBAL QUEUE
        //----
        const ret: List.Iterator<Resolver> = this.queue_.insert(
            this.queue_.end(),
            resolver,
        );
        resolver.iterator = ret;
        resolver.destructor = () => {
            resolver.handler = null;
            resolver.disolver.value = undefined;

            if (resolver.disolver.erased_ !== true)
                resolver.disolver.source().erase(resolver.disolver);
            return mit.second.queue.erase(lit);
        };
        return ret;
    }

    protected _Get_local_area(
        acceptor: WebAcceptor<any, any>,
    ): SolidComponent.LocalArea<Resolver, Aggregate> | null {
        const it: HashMap.Iterator<
            WebAcceptor<any, any>,
            SolidComponent.LocalArea<Resolver, Aggregate>
        > = this.local_areas_.find(acceptor);
        return it.equals(this.local_areas_.end()) === false ? it.second : null;
    }
}

/**
 * @internal
 */
export namespace SolidComponent {
    export interface Resolver<
        T extends Resolver<T, AggregateT>,
        AggregateT extends Record<string, number>,
    > {
        // THREAD HANDLER
        handler: Function | null;
        lockType: LockType;

        // ASSET FFOR CLIENT
        acceptor: WebAcceptor<any, any>;
        aggregate: AggregateT;
        disolver: Disolver;

        // FOR DESTRUCTION
        destructor?: () => List.Iterator<T>;
        iterator?: List.Iterator<T>;
    }

    export type LocalArea<
        ResolverT extends Resolver<ResolverT, AggregateT>,
        AggregateT extends Record<string, number>,
    > = {
        queue: List<ResolverT>;
        aggregate: AggregateT;
    };
}
