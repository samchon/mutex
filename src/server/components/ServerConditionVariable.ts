import { WebSocketAcceptor } from "tgrid";
import { List, sleep_for } from "tstl";
import { LockType } from "tstl/lib/internal/thread/LockType";

import { SolidComponent } from "./SolidComponent";
import { Joiner } from "./internal/Joiner";
import { ProviderGroup } from "../ProviderGroup";

/**
 * @internal
 */
export class ServerConditionVariable extends SolidComponent<Resolver, {}> {
  /* ---------------------------------------------------------
    WAITORS
  --------------------------------------------------------- */
  public wait(
    acceptor: WebSocketAcceptor<any, ProviderGroup, null>,
    disolver: List.Iterator<Joiner>,
  ): Promise<void> {
    return new Promise((resolve) => {
      // ENROLL TO THE RESOLVERS
      const it: List.Iterator<Resolver> = this._Insert_resolver({
        handler: resolve,
        lockType: LockType.HOLD,

        acceptor: acceptor,
        disolver: disolver,
        aggregate: {},
      });

      // DISCONNECTION HANDLER
      disolver.value = () => this._Cancel_wait(it);
    });
  }

  public wait_for(
    ms: number,
    acceptor: WebSocketAcceptor<any, ProviderGroup, null>,
    disolver: List.Iterator<Joiner>,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      // ENROLL TO THE RESOLVERS
      const it: List.Iterator<Resolver> = this._Insert_resolver({
        handler: resolve,
        lockType: LockType.KNOCK,

        acceptor: acceptor,
        disolver: disolver,
        aggregate: {},
      });

      // DISCONNECTION HANDLER
      disolver.value = () => this._Cancel_wait(it);

      // TIME EXPIRATION HANDLER
      sleep_for(ms).then(() => {
        resolve(this._Cancel_wait(it) === false);
      });
    });
  }

  private _Cancel_wait(it: List.Iterator<Resolver>): boolean {
    if (it.value.handler === null) return false;

    it.value.destructor!();
    this.queue_.erase(it);

    return true;
  }

  /* ---------------------------------------------------------
    NOTIFIERS
  --------------------------------------------------------- */
  public async notify_one(): Promise<void> {
    if (this.queue_.empty()) return;

    // POP THE FIRST ITEM
    const it: List.Iterator<Resolver> = this.queue_.begin();
    this.queue_.erase(it);

    // DO RESOLVE
    this._Notify(it.value, true);
  }

  public async notify_all(): Promise<void> {
    if (this.queue_.empty()) return;

    // COPY RESOLVERS
    const ordinaryResolvers: Resolver[] = [...this.queue_];
    const copiedResolvers: Resolver[] = ordinaryResolvers.map((resolver) => ({
      ...resolver,
    }));

    // CLEAR OLD ITEMS
    this.queue_.clear();
    for (const resolver of ordinaryResolvers) resolver.destructor!();

    // DO NOTIFY
    for (const resolver of copiedResolvers) this._Notify(resolver, false);
  }

  private _Notify(resolver: Resolver, discard: boolean): void {
    // RESERVE HANDLER
    const handler = resolver.handler!;

    // DISCARD FOR SEQUENCE
    if (discard === true) resolver.destructor!();

    // CALL HANDLER
    if (resolver.lockType === LockType.HOLD) handler();
    else handler(true);
  }
}

/**
 * @internal
 */
type Resolver = SolidComponent.Resolver<Resolver, {}>;
