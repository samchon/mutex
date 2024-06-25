import { WebSocketAcceptor } from "tgrid";
import { List } from "tstl";

import { IComponent } from "./IComponent";
import { ServerConditionVariable } from "./ServerConditionVariable";
import { Joiner } from "./internal/Joiner";
import { ProviderGroup } from "../ProviderGroup";

/**
 * @internal
 */
export class ServerLatch implements IComponent {
  private cv_: ServerConditionVariable;
  private count_: number;

  /* ---------------------------------------------------------
    CONSTRUCTORS
  --------------------------------------------------------- */
  public constructor(size: number) {
    this.cv_ = new ServerConditionVariable();
    this.count_ = size;
  }

  public _Insert_acceptor(
    acceptor: WebSocketAcceptor<any, ProviderGroup, null>,
  ): void {
    this.cv_._Insert_acceptor(acceptor);
  }

  public _Erase_acceptor(
    acceptor: WebSocketAcceptor<any, ProviderGroup, null>,
  ): boolean {
    return this.cv_._Erase_acceptor(acceptor);
  }

  /* ---------------------------------------------------------
    WAITORS
  --------------------------------------------------------- */
  public async wait(
    acceptor: WebSocketAcceptor<any, ProviderGroup, null>,
    disolver: List.Iterator<Joiner>,
  ): Promise<void> {
    if (this._Try_wait() === false) return this.cv_.wait(acceptor, disolver);
  }

  public async try_wait(): Promise<boolean> {
    return this._Try_wait();
  }

  public async wait_for(
    ms: number,
    acceptor: WebSocketAcceptor<any, ProviderGroup, null>,
    disolver: List.Iterator<Joiner>,
  ): Promise<boolean> {
    if (this._Try_wait() === true) return true;
    return await this.cv_.wait_for(ms, acceptor, disolver);
  }

  private _Try_wait(): boolean {
    return this.count_ <= 0;
  }

  /* ---------------------------------------------------------
    DECOUNTERS
  --------------------------------------------------------- */
  public async count_down(n: number): Promise<void> {
    this.count_ -= n;
    if (this._Try_wait() === true) await this.cv_.notify_all();
  }

  public async arrive_and_wait(
    acceptor: WebSocketAcceptor<any, ProviderGroup, null>,
    disolver: List.Iterator<Joiner>,
  ): Promise<void> {
    await this.count_down(1);
    await this.wait(acceptor, disolver);
  }
}
