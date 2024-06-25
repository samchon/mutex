import { WebSocketAcceptor } from "tgrid";

import { ProviderGroup } from "./server/ProviderGroup";

/**
 * Acceptor of the `mutex-server`.
 *
 *  - available only in NodeJS.
 *
 * The {@link MutexAcceptor} is a communicator class interacting with the remote client, through
 * websocket and [RPC](https://tgrid.com/docs/remote-procedure-call/) protocol, in the
 * `mutex-server`. The {@link MutexAcceptor} objects are always created by the {@link MutexServer}
 * class, whenever a remote client connects to the `mutex-server`.
 *
 * You can accept or reject the client's connection by calling {@link accept} or {@link reject}
 * method. If you {@link accept} the connection, the interaction would be started and the client
 * can access to critical component sections of this `mutex-server`.
 *
 * Also, when declaring this {@link MutexAcceptor} type, you've to define one template argument,
 * *Header*. The *Header* type repersents an initial data gotten from the remote client after
 * the connection. I hope you and client not to omit it and utilize it as an activation tool
 * to enhance security.
 *
 * @template Header Type of the header containing initial data.
 * @author Jeongho Nam - https://github.com/samchon
 */
export class MutexAcceptor<Header> {
  /**
   * @hidden
   */
  private base_: WebSocketAcceptor<Header, ProviderGroup, null>;

  /**
   * @hidden
   */
  private group_: ProviderGroup;

  /* ----------------------------------------------------------------
        CONSTRUCTORS
    ---------------------------------------------------------------- */
  /**
   * @hidden
   */
  private constructor(
    base: WebSocketAcceptor<Header, ProviderGroup, null>,
    group: ProviderGroup,
  ) {
    this.base_ = base;
    this.group_ = group;
  }

  /**
   * @internal
   */
  public static create<Header>(
    base: WebSocketAcceptor<Header, ProviderGroup, null>,
    group: ProviderGroup,
  ): MutexAcceptor<Header> {
    return new MutexAcceptor(base, group);
  }

  /**
   * Close connection.
   *
   * Close connection with the remote client.
   *
   * When connection with the remote client has been closed, all of the locks the client had
   * acquired and tried would be automatically unlocked and cancelled by this `mutex-server`.
   * Also, remote critical section components had assigned to the client would be returned, too.
   *
   * @param code Closing code.
   * @param reason Reason why.
   * @throw DomainError when the connection is not online.
   */
  public close(code?: number, reason?: string): Promise<void> {
    return this.base_.close(code, reason);
  }

  /**
   * Join connection.
   *
   * Wait until connection with the server to be closed.
   */
  public join(): Promise<void>;

  /**
   * Join connection until timeout.
   *
   * Wait until connection with the server to be clsoed until timeout.
   *
   * @param ms The maximum miliseconds for waiting.
   * @return Whether succeeded to waiting in the given time.
   */
  public join(ms: number): Promise<boolean>;

  /**
   * Join connection until time expiration.
   *
   * Wait until connection with the server to be closed until time expiration.
   *
   * @param at The maximum time point to wait.
   * @return Whether succeeded to waiting in the given time.
   */
  public join(at: Date): Promise<boolean>;

  public join(param?: number | Date): Promise<void | boolean> {
    return this.base_.join(param! as Date);
  }

  /* ----------------------------------------------------------------
        ACCESSORS
    ---------------------------------------------------------------- */
  /**
   * IP Address of client.
   */
  public get ip(): string {
    return this.base_.ip;
  }

  /**
   * Path of client has connected.
   */
  public get path(): string {
    return this.base_.path;
  }

  /**
   * Header containing initialization data like activation.
   */
  public get header(): Header {
    return this.base_.header;
  }

  /**
   * Get state.
   *
   * Get current state of connection state with the remote client. List of values are such like
   * below:
   *
   *   - `REJECTING`: The {@link MutexAcceptor.reject} method is on running.
   *   - `NONE`: The {@link MutexAcceptor} instance is newly created, but did nothing yet.
   *   - `ACCEPTING`: The {@link MutexAcceptor.accept} method is on running.
   *   - `OPEN`: The connection is online.
   *   - `CLOSING`: The {@link MutexAcceptor.close} method is on running.
   *   - `CLOSED`: The connection is offline.
   */
  public get state(): MutexAcceptor.State {
    return this.base_.state;
  }

  /* ----------------------------------------------------------------
        HANDSHAKES
    ---------------------------------------------------------------- */
  /**
   * Accept connection.
   *
   * Accepts, permits the client's connection to this `mutex-server` and starts interaction.
   *
   * @param provider An object providing additional features for the remote client. If you don't have plan to proivde any additional feature, assign `null`.
   */
  public async accept(): Promise<void> {
    await this.base_.accept(this.group_);
    this.base_.join().then(() => this.group_.destructor());
  }

  /**
   * Reject connection.
   *
   * Reject without acceptance, any interaction. The connection would be closed immediately.
   *
   * @param code Closing code.
   * @param reason Reason why.
   */
  public reject(status?: number, reason?: string): Promise<void> {
    return this.base_.reject(status, reason);
  }
}

/**
 *
 */
export namespace MutexAcceptor {
  /**
   * Current state of the {@link MutexAcceptor}
   */
  export import State = WebSocketAcceptor.State;
}
