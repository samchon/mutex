import { ProviderBase } from "./ProviderBase";
import { GlobalBarriers } from "../global/GlobalBarriers";

/**
 * @internal
 */
export class BarriersProvider extends ProviderBase<
  GlobalBarriers,
  number,
  void
> {
  public wait(name: string): Promise<void> {
    return this.get(name).wait(this.acceptor_, this.createDisolver());
  }

  public wait_for(name: string, ms: number): Promise<boolean> {
    return this.get(name).wait_for(ms, this.acceptor_, this.createDisolver());
  }

  public arrive(name: string, n: number): Promise<void> {
    return this.get(name).arrive(n);
  }

  public arrive_and_drop(name: string): Promise<void> {
    return this.get(name).arrive_and_drop();
  }

  public arrive_and_wait(name: string): Promise<void> {
    return this.get(name).arrive_and_wait(
      this.acceptor_,
      this.createDisolver(),
    );
  }
}
