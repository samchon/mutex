import { Promisive } from "tgrid";

import { BarriersProvider } from "../server/providers/BarriersProvider";

/**
 * Remote Barrier.
 *
 * The `RemoteBarrier` class blocks critical sections until the downward counter to be zero.
 * Unlike the {@link RemoteLatch} class whose downward counter is disposable, `RemoteBarrier`
 * can re-use the downward counter repeatedly, resetting counter to be initial value whenever
 * reach to the zero.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export class RemoteBarrier {
  /**
   * @hidden
   */
  private controller_: Promisive<BarriersProvider>;

  /**
   * @hidden
   */
  private name_: string;

  /* -----------------------------------------------------------
    CONSTRUCTORS
  ----------------------------------------------------------- */
  /**
   * @hidden
   */
  private constructor(controller: Promisive<BarriersProvider>, name: string) {
    this.controller_ = controller;
    this.name_ = name;
  }

  /**
   * @internal
   */
  public static async create(
    controller: Promisive<BarriersProvider>,
    name: string,
    count: number,
  ): Promise<RemoteBarrier> {
    await controller.emplace(name, count);
    return new RemoteBarrier(controller, name);
  }

  /* -----------------------------------------------------------
        WAIT FUNCTIONS
    ----------------------------------------------------------- */
  /**
   * Waits until the counter to be zero.
   *
   * Blocks the function calling until internal counter to be reached to the zero.
   */
  public wait(): Promise<void> {
    return this.controller_.wait(this.name_);
  }

  /**
   * Tries to wait until the counter to be zero in timeout.
   *
   * Attempts to block the function calling until internal counter to be reached to the zero
   * in timeout. If succeeded to waiting the counter to be reached to the zero, it returns
   * `true`. Otherwise, the {@link RemoteBarrier} fails to reach to the zero in the given time,
   * the function gives up the waiting and returns `false`.
   *
   * @param ms The maximum miliseconds for waiting.
   * @return Whether succeeded to waiting in the given time.
   */
  public wait_for(ms: number): Promise<boolean> {
    return this.controller_.wait_for(this.name_, ms);
  }

  /**
   * Tries to wait until the counter to be zero in time expiration.
   *
   * Attempts to block the function calling until internal counter to be reached to the zero
   * in time expiration. If succeeded to waiting the counter to be reached to the zero, it
   * returns `true`. Otherwise, the {@link RemoteBarrier} fails to reach to the zero in the
   * given time, the function gives up the waiting and returns `false`.
   *
   * @param at The maximum time point to wait.
   * @return Whether succeeded to waiting in the given time.
   */
  public async wait_until(at: Date): Promise<boolean> {
    const ms: number = at.getTime() - Date.now();
    return await this.wait_for(ms);
  }

  /* -----------------------------------------------------------
    ARRIVAL FUNCTIONS
  ----------------------------------------------------------- */
  /**
   * Derecements the counter.
   *
   * Decrements the counter by *n* without blocking.
   *
   * If the parametric value *n* is equal to or greater than internal counter, so that the
   * internal counter be equal to or less than zero, everyone who are {@link wait waiting} for
   * the {@link Latch} would continue their executions.
   *
   * @param n Value of the decrement. Default is 1.
   */
  public arrive(n: number = 1): Promise<void> {
    return this.controller_.arrive(this.name_, n);
  }

  /**
   * Decrements the counter and waits until the counter to be zero.
   *
   * Decrements the counter by one and blocks the section until internal counter to be zero.
   *
   * If the the remained counter be zero by this decrement, everyone who are
   * {@link wait waiting} for the {@link RemoteBarrier} would continue their executions
   * including this one.
   */
  public arrive_and_drop(): Promise<void> {
    return this.controller_.arrive_and_drop(this.name_);
  }

  /**
   * Decrements the counter and initial size at the same time.
   *
   * Decrements not only internal counter, but also initialize size of the counter at the same
   * time. If the remained counter be zero by the decrement, everyone who are
   * {@link wait waiting} for the {@link RemoteBarrier} would continue their executions.
   */
  public arrive_and_wait(): Promise<void> {
    return this.controller_.arrive_and_wait(this.name_);
  }
}
