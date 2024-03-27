import { WebAcceptor } from "tgrid";
import { List, sleep_for, OutOfRange, Pair } from "tstl";
import { LockType } from "tstl/lib/internal/thread/LockType";

import { SolidComponent } from "./SolidComponent";
import { Disolver } from "./internal/Disolver";

/**
 * @internal
 */
export class ServerSemaphore extends SolidComponent<Resolver, Aggregate> {
  private max_: number;
  private acquiring_: number;

  /* ---------------------------------------------------------
    CONSTRUCTORS
  --------------------------------------------------------- */
  public constructor(max: number) {
    super();

    this.max_ = max;
    this.acquiring_ = 0;
  }

  public max(): number {
    return this.max_;
  }

  /* ---------------------------------------------------------
    ACQUIRANCES
  --------------------------------------------------------- */
  public acquire(
    acceptor: WebAcceptor<any, any>,
    disolver: Disolver,
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      let success: boolean = this.acquiring_ < this.max_;

      // CONSTRUCT RESOLVER
      let it: List.Iterator<Resolver> = this._Insert_resolver({
        handler: success ? null : resolve,
        lockType: LockType.HOLD,
        acceptor: acceptor,
        disolver: disolver,
        aggregate: {
          acquring: success ? 1 : 0,
        },
      });

      // DISCONNECTION HANDLER
      disolver.value = () => this._Handle_disconnection(it);

      // RETURNS OR WAIT
      if (it.value.handler === null) {
        ++this.acquiring_;
        resolve();
      }
    });
  }

  public async try_acquire(
    acceptor: WebAcceptor<any, any>,
    disolver: Disolver,
  ): Promise<boolean> {
    // ACQUIRABLE ?
    if (this.acquiring_ >= this.max_) return false;

    // CONSTRUCT RESOLVER
    let it: List.Iterator<Resolver> = this._Insert_resolver({
      handler: null,
      lockType: LockType.HOLD,
      acceptor: acceptor,
      disolver: disolver,
      aggregate: {
        acquring: 1,
      },
    });
    ++this.acquiring_;

    // RETURNS WITH DISCONNECTION HANDLER
    disolver.value = () => this._Handle_disconnection(it);
    return true;
  }

  public async try_acquire_for(
    ms: number,
    acceptor: WebAcceptor<any, any>,
    disolver: Disolver,
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      let success: boolean = this.acquiring_ < this.max_;

      // CONSTRUCT RESOLVER
      let it: List.Iterator<Resolver> = this._Insert_resolver({
        handler: success ? null : resolve,
        lockType: LockType.KNOCK,
        acceptor: acceptor,
        disolver: disolver,
        aggregate: {
          acquring: success ? 1 : 0,
        },
      });

      // DISCONNECTION HANDLER
      disolver.value = () => this._Handle_disconnection(it);

      // RETURNS OR WAIT UNTIL TIMEOUT
      if (it.value.handler === null) {
        ++this.acquiring_;
        resolve(true);
      } else
        sleep_for(ms).then(() => {
          let success: boolean = it.value.handler === null;
          if (success === false) this._Cancel(it);

          resolve(success);
        });
    });
  }

  private _Cancel(it: List.Iterator<Resolver>): void {
    // POP THE LISTENER
    let handler: Function = it.value.handler!;

    this.queue_.erase(it);
    it.value.destructor!();

    // RETURNS FAILURE
    handler(false);
  }

  /* ---------------------------------------------------------
    RELEASE
  --------------------------------------------------------- */
  public async release(
    n: number,
    acceptor: WebAcceptor<any, any>,
  ): Promise<void> {
    //----
    // VALIDATION
    //----
    // IN GLOBAL AREA
    if (n < 1)
      throw new OutOfRange(
        `Error on RemoteSemaphore.release(): parametric n is less than 1 -> (n = ${n}).`,
      );
    else if (n > this.max_)
      throw new OutOfRange(
        `Error on RemoteSemaphore.release(): parametric n is greater than max -> (n = ${n}, max = ${this.max_}).`,
      );
    else if (n > this.acquiring_)
      throw new OutOfRange(
        `Error on RemoteSemaphore.release(): parametric n is greater than acquiring -> (n = ${n}, acquiring = ${this.acquiring_}).`,
      );

    // IN LOCAL AREA
    let local: SolidComponent.LocalArea<Resolver, Aggregate> | null =
      this._Get_local_area(acceptor);
    if (local === null || local.queue.empty() === true)
      throw new OutOfRange(
        "Error on RemoteSemaphore.release(): you're free on the acquirance.",
      );
    else if (local.aggregate.acquring < n)
      throw new OutOfRange(
        `Error onRemoteSemaphore.release(): parametric n is greater than what you've been acquiring -> (n = ${n}, acquiring = ${local.aggregate.acquring}).`,
      );

    //----
    // RELEASE
    //----
    // ERASE FROM QUEUES
    this.acquiring_ -= n;
    local.aggregate.acquring -= n;

    let count: number = 0;
    for (
      let it = local.queue.begin();
      it.equals(local.queue.end()) === false;

    ) {
      this.queue_.erase(it.value.iterator!);
      it = it.value.destructor!();

      if (++count === n) break;
    }

    // RESERVE HANDLERS
    let pairList: Pair<Function, LockType>[] = [];

    for (let resolver of this.queue_)
      if (resolver.handler !== null) {
        pairList.push(new Pair(resolver.handler!, resolver.lockType));
        resolver.handler = null;

        ++resolver.aggregate.acquring;
        if (++this.acquiring_ === this.max_) break;
      }

    // CALL HANDLERS
    for (let pair of pairList)
      if (pair.second === LockType.HOLD) pair.first();
      else pair.first(true);
  }

  private async _Handle_disconnection(
    it: List.Iterator<Resolver>,
  ): Promise<void> {
    // CHECK ALIVE
    if (((<any>it) as Disolver).erased_ === true) return;
    // ROLLBACK ACTION
    else if (it.value.handler === null)
      await this.release(1, it.value.acceptor);
    else this._Cancel(it);
  }
}

/**
 * @internal
 */
type Resolver = SolidComponent.Resolver<Resolver, Aggregate>;

/**
 * @internal
 */
type Aggregate = Record<"acquring", number>;
