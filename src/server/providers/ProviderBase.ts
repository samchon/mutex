/**
 * @packageDocumentation
 * @module msv
 */
//-----------------------------------------------------------
import { WebSocketAcceptor } from "tgrid";
import { List, HashSet, OutOfRange } from "tstl";

import { GlobalBase } from "../global/GlobalBase";
import { Joiner } from "../components/internal/Joiner";
import { ProviderGroup } from "../ProviderGroup";

/**
 * @internal
 */
export abstract class ProviderBase<
  GlobalT extends GlobalBase<any, Param, Ret>,
  Param,
  Ret,
> {
  protected readonly global_: GlobalT;
  protected readonly acceptor_: WebSocketAcceptor<any, ProviderGroup, null>;
  private readonly disolvers_: List<Joiner>;

  private readonly names_: HashSet<string>;
  private readonly remote_name_: string;

  /* ---------------------------------------------------------
    CONSTRUCTORS
  --------------------------------------------------------- */
  public constructor(
    global: GlobalT,
    acceptor: WebSocketAcceptor<any, ProviderGroup, null>,
    disolvers: List<Joiner>,
    remoteName: string,
  ) {
    this.global_ = global;
    this.acceptor_ = acceptor;
    this.disolvers_ = disolvers;

    this.names_ = new HashSet();
    this.remote_name_ = remoteName;
  }

  public destructor(): void {
    for (const name of this.names_) this.erase(name);
  }

  protected createDisolver(): List.Iterator<Joiner> {
    return this.disolvers_.insert(this.disolvers_.end(), undefined);
  }

  /* ---------------------------------------------------------
    ACCESSORS
  --------------------------------------------------------- */
  public emplace(name: string, param: Param): Ret {
    this.names_.insert(name);
    return this.global_.emplace(name, param, this.acceptor_);
  }

  public erase(name: string): void {
    this.names_.erase(name);
    this.global_.erase(name, this.acceptor_);
  }

  public get(
    name: string,
  ): GlobalT extends GlobalBase<infer ComponentT, Param, Ret>
    ? ComponentT
    : unknown {
    if (this.names_.has(name) === false)
      throw new OutOfRange(
        `Error on ${this.remote_name_}: you've already erased the component.`,
      );

    return this.global_.get(name);
  }
}
