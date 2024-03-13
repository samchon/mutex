import { WebAcceptor } from "tgrid";
import { List, sleep_for, OutOfRange, Pair } from "tstl";
import { AccessType } from "tstl/internal/thread/AccessType";
import { LockType } from "tstl/internal/thread/LockType";

import { SolidComponent } from "./SolidComponent";
import { Disolver } from "./internal/Disolver";
import { Joiner } from "./internal/Joiner";

/**
 * @internal
 */
export class ServerMutex extends SolidComponent<Resolver, {}> {
  private writing_: number;
  private reading_: number;

  /* ---------------------------------------------------------
    CONSTRUCTORS
  --------------------------------------------------------- */
  public constructor() {
    super();

    this.writing_ = 0;
    this.reading_ = 0;
  }

  protected _Insert_resolver(resolver: Resolver): List.Iterator<Resolver> {
    let it: List.Iterator<Resolver> = super._Insert_resolver(resolver);
    resolver.iterator = it;

    return it;
  }

  /* ---------------------------------------------------------
    WRITE LOCK
  --------------------------------------------------------- */
  public lock(
    acceptor: WebAcceptor<any, any>,
    disolver: List.Iterator<Joiner>,
  ): Promise<void> {
    return new Promise((resolve) => {
      // CONSTRUCT RESOLVER
      let it: List.Iterator<Resolver> = this._Insert_resolver({
        handler: this.writing_++ === 0 && this.reading_ === 0 ? null : resolve,
        accessType: AccessType.WRITE,
        lockType: LockType.HOLD,

        acceptor: acceptor,
        disolver: disolver,
        aggregate: {},
      });

      // DISCONNECTION HANDLER
      disolver.value = () => this._Handle_disconnection(it);

      // RETURNS OR WAIT
      if (it.value.handler === null) resolve();
    });
  }

  public async try_lock(
    acceptor: WebAcceptor<any, any>,
    disolver: List.Iterator<Joiner>,
  ): Promise<boolean> {
    // LOCKABLE ?
    if (this.writing_ !== 0 || this.reading_ !== 0) return false;

    // CONSTRUCT RESOLVER
    let it: List.Iterator<Resolver> = this._Insert_resolver({
      handler: null,
      accessType: AccessType.WRITE,
      lockType: LockType.KNOCK,

      acceptor: acceptor,
      disolver: disolver,
      aggregate: {},
    });

    // DISCONNECTION HANDLER
    disolver.value = () => this._Handle_disconnection(it);

    // RETURNS
    ++this.writing_;
    return true;
  }

  public try_lock_for(
    ms: number,
    acceptor: WebAcceptor<any, any>,
    disolver: List.Iterator<Joiner>,
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      // CONSTRUCT RESOLVER
      let it: List.Iterator<Resolver> = this._Insert_resolver({
        handler: this.writing_++ === 0 && this.reading_ === 0 ? null : resolve,
        accessType: AccessType.WRITE,
        lockType: LockType.KNOCK,

        acceptor: acceptor,
        disolver: disolver,
        aggregate: {},
      });

      // DISCONNECTION HANDLER
      disolver.value = () => this._Handle_disconnection(it);

      // RETURNS OR WAIT UNTIL TIMEOUT
      if (it.value.handler === null)
        resolve(true); // SUCCESS
      else
        sleep_for(ms).then(() => {
          // NOT YET, THEN DO UNLOCK
          if (it.value.handler !== null) {
            --this.writing_;
            this._Cancel(it);
          }
        });
    });
  }

  public async unlock(acceptor: WebAcceptor<any, any>): Promise<void> {
    //----
    // VALIDATION
    //----
    // IN GLOBAL AREA
    if (
      this.queue_.empty() === true ||
      this.queue_.front().accessType !== AccessType.WRITE
    )
      throw new OutOfRange(
        `Error on RemoteMutex.unlock(): this mutex is free on the unique lock.`,
      );

    // IN LOCAL AREA
    let local: SolidComponent.LocalArea<Resolver, {}> | null =
      this._Get_local_area(acceptor);
    if (
      local === null ||
      local.queue.empty() === true ||
      this.queue_.front() !== local.queue.front()
    )
      throw new OutOfRange(
        "Error on RemoteMutex.unlock(): you're free on the unique lock.",
      );

    //----
    // RELEASE
    //----
    // DESTRUCT TOP RESOLVER
    let top: Resolver = local.queue.front();

    this.queue_.erase(top.iterator!);
    top.destructor!();

    // DO RELEASE
    --this.writing_;
    this._Release();
  }

  /* ---------------------------------------------------------
    READ LOCK
  --------------------------------------------------------- */
  public lock_shared(
    acceptor: WebAcceptor<any, any>,
    disolver: List.Iterator<Joiner>,
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      // CONSTRUCT RESOLVER
      let it: List.Iterator<Resolver> = this._Insert_resolver({
        handler: this.writing_ === 0 ? null : resolve,
        accessType: AccessType.READ,
        lockType: LockType.HOLD,

        acceptor: acceptor,
        disolver: disolver,
        aggregate: {},
      });

      // DISCONNECTION HANDLER
      disolver.value = () => this._Handle_disconnection(it);

      // RETURNS OR WAIT
      ++this.reading_;
      if (it.value.handler === null) resolve();
    });
  }

  public async try_lock_shared(
    acceptor: WebAcceptor<any, any>,
    disolver: List.Iterator<Joiner>,
  ): Promise<boolean> {
    if (this.writing_ !== 0) return false;

    // CONSTRUCT RESOLVER
    let it = this._Insert_resolver({
      handler: null,
      accessType: AccessType.READ,
      lockType: LockType.KNOCK,

      acceptor: acceptor,
      disolver: disolver,
      aggregate: {},
    });

    // DISCONNECTION HANDLER
    disolver.value = () => this._Handle_disconnection(it);

    // RETURNS
    ++this.reading_;
    return true;
  }

  public try_lock_shared_for(
    ms: number,
    acceptor: WebAcceptor<any, any>,
    disolver: List.Iterator<Joiner>,
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      // CONSTRUCT RESOLVER
      let it: List.Iterator<Resolver> = this._Insert_resolver({
        handler: this.writing_ === 0 ? null : resolve,
        accessType: AccessType.READ,
        lockType: LockType.KNOCK,

        acceptor: acceptor,
        disolver: disolver,
        aggregate: {},
      });

      // DISCONNECTION HANDLER
      disolver.value = () => this._Handle_disconnection(it);

      // RETURNS OR WAIT UNTIL TIMEOUT
      ++this.reading_;
      if (it.value.handler === null) resolve(true);
      else
        sleep_for(ms).then(() => {
          if (it.value.handler !== null) {
            --this.reading_;
            this._Cancel(it);
          }
        });
    });
  }

  public async unlock_shared(acceptor: WebAcceptor<any, any>): Promise<void> {
    //----
    // VALIDATION
    //----
    // IN GLOBAL AREA
    if (
      this.queue_.empty() === true ||
      this.queue_.front().accessType !== AccessType.READ
    )
      throw new OutOfRange(
        `Error on RemoteMutex.unlock_shared(): this mutex is free on the shared lock.`,
      );

    // IN LOCAL AREA
    let local: SolidComponent.LocalArea<Resolver, {}> | null =
      this._Get_local_area(acceptor);
    if (
      local === null ||
      local.queue.empty() === true ||
      local.queue.front().accessType !== AccessType.READ
    )
      throw new OutOfRange(
        "Error on RemoteMutex.unlock_shared(): you're free on the shared lock.",
      );

    //----
    // RELEASE
    //----
    // DESTRUCT THE RESOLVER
    let top: Resolver = local.queue.front();

    this.queue_.erase(top.iterator!);
    top.destructor!();

    // DO RELEASE
    --this.reading_;
    this._Release();
  }

  /* ---------------------------------------------------------
    RELEASE
  --------------------------------------------------------- */
  private _Release(): void {
    if (this.queue_.empty() === true) return;

    // GATHER THE NEXT STEPS
    let currentType: AccessType = this.queue_.front().accessType;
    let pairList: Pair<Function, LockType>[] = [];

    for (let resolver of this.queue_) {
      // STOP WHEN DIFFERENT ACCESS TYPE COMES
      if (resolver.accessType !== currentType) break;
      // RESERVE HANDLER
      else if (resolver.handler !== null) {
        pairList.push(new Pair(resolver.handler, resolver.lockType));
        resolver.handler = null;
      }

      // STOP AFTER WRITE LOCK
      if (resolver.accessType === AccessType.WRITE) break;
    }

    // CALL THE HANDLERS
    for (let pair of pairList)
      if (pair.second === LockType.HOLD) pair.first();
      else pair.first(true);
  }

  private _Cancel(it: List.Iterator<Resolver>): void {
    // POP HANDLER & DESTRUCT
    let handler: Function = it.value.handler!;

    this.queue_.erase(it);
    it.value.destructor!();

    // CHECK THE PREVIOUS HANDLER
    let prev: List.Iterator<Resolver> = it.prev();
    if (prev.equals(this.queue_.end()) === false && prev.value.handler === null)
      this._Release();

    // (LAZY) RETURNS FAILURE
    handler(false);
  }

  private async _Handle_disconnection(
    it: List.Iterator<Resolver>,
  ): Promise<void> {
    // CHECK ALIVE
    if (((<any>it) as Disolver).erased_ === true) return;
    //----
    // ROLLBACK ACTION
    //----
    else if (it.value.handler === null) {
      // SUCCEEDED TO GET LOCK
      if (it.value.accessType === AccessType.WRITE)
        await this.unlock(it.value.acceptor);
      else await this.unlock_shared(it.value.acceptor);
    } else {
      // HAD BEEN WAITING
      if (it.value.accessType === AccessType.WRITE) --this.writing_;
      else --this.reading_;

      // CANCEL THE LOCK
      this._Cancel(it);
    }
  }
}

/**
 * @internal
 */
interface Resolver extends SolidComponent.Resolver<Resolver, {}> {
  accessType: AccessType;
}
