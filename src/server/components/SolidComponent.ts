import { WebSocketAcceptor } from "tgrid";
import { HashMap, HashSet, List } from "tstl";
import { LockType } from "tstl/lib/internal/thread/LockType";

import { IComponent } from "./IComponent";
import { Disolver } from "./internal/Disolver";
import { ProviderGroup } from "../ProviderGroup";

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
    WebSocketAcceptor<any, ProviderGroup, null>,
    SolidComponent.LocalArea<Resolver, Aggregate>
  >;

  private acceptors_: HashSet<WebSocketAcceptor<any, ProviderGroup, null>> =
    new HashSet();

  /* ---------------------------------------------------------
    CONSTRUCTORS
  --------------------------------------------------------- */
  public constructor() {
    this.queue_ = new List();
    this.local_areas_ = new HashMap();
  }

  public _Insert_acceptor(
    acceptor: WebSocketAcceptor<any, ProviderGroup, null>,
  ): void {
    this.acceptors_.insert(acceptor);
  }

  public _Erase_acceptor(
    acceptor: WebSocketAcceptor<any, ProviderGroup, null>,
  ): boolean {
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
    // eslint-disable-next-line
    let mit: HashMap.Iterator<
      WebSocketAcceptor<any, ProviderGroup, null>,
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
    acceptor: WebSocketAcceptor<any, ProviderGroup, null>,
  ): SolidComponent.LocalArea<Resolver, Aggregate> | null {
    const it: HashMap.Iterator<
      WebSocketAcceptor<any, ProviderGroup, null>,
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
    acceptor: WebSocketAcceptor<any, ProviderGroup, null>;
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
