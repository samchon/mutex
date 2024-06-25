import { WebSocketConnector } from "tgrid";

import { RemoteBarrier } from "./client/RemoteBarrier";
import { RemoteConditionVariable } from "./client/RemoteConditionVariable";
import { RemoteLatch } from "./client/RemoteLatch";
import { RemoteMutex } from "./client/RemoteMutex";
import { RemoteSemaphore } from "./client/RemoteSemaphore";
import { ProviderGroup } from "./server/ProviderGroup";

/**
 * Mutex server connector for client.
 *
 * The {@link MutexConnector} is a communicator class who can connect to a remote `mutex-server`
 * and interact with it through websocket and [RPC](https://tgrid.com/docs/remote-procedure-call/)
 * protocol.
 *
 * You can connect to the websocket `mutex-server` using {@link connect} method. After the
 * connection, get network level remote critical section components using one of below methods.
 * After utilizing those components, please do not forget to realising the component by calling
 * {@link IRemoteComponent.destructor} or closing connection with the `mutex-server` by calling
 * the {@link close} method to prevent waste of resources of the `mutex-server`.
 *
 *   - Solid Components
 *     - {@link getConditionVariable}
 *     - {@link getMutex}
 *     - {@link getSemaphore}
 *   - Adaptor Comopnents
 *     - {@link getBarrier}
 *     - {@link getLatch}
 *
 * Also, when declaring this {@link MutexConnector} type, you've to define one template argument,
 * *Header*. The *Header* type repersents an initial data sending to the remote `mutex-server`
 * after connection. I hope you not to omit it and utilize it as an activation tool to
 * enhance security.
 *
 * @template Header Type of the *header* containing initial data.
 * @author Jeongho Nam - https://github.com/samchon
 */
export class MutexConnector<Header> {
  /**
   * @hidden
   */
  private connector_: WebSocketConnector<Header, null, ProviderGroup>;

  /* -----------------------------------------------------------
        CONSTRUCTORS
    ----------------------------------------------------------- */
  /**
   * Initializer Constructor.
   *
   * @param header Initial data sending to the remote server after connection. Hope to use it as an activation tool.
   */
  public constructor(header: Header) {
    this.connector_ = new WebSocketConnector(header, null);
  }

  /**
   * Connect to a remote `mutex-server`.
   *
   * Try connection to the remote `mutex-server` with its *address* and waiting for the server
   * to accept the trial. If the `mutex-server` accepts your connection, the function would be
   * returned. Otherwise, the server rejects your connection, an exception would be thrown.
   *
   * After the connection and your business (using remote critical sections) has been
   * completed, please don't forget closing the connection in time to prevent waste of the
   * server resource.
   *
   * @param url URL address to connect.
   * @throw DomainError when connection is not offline .
   * @throw WebError when target server is not following adequate protocol.
   * @throw WebError when server rejects your connection.
   * @throw WebError when server does not accept your connection until timeout.
   */
  public connect(url: string, timeout?: number): Promise<void> {
    return this.connector_.connect(url, { timeout });
  }

  /**
   * Close connection.
   *
   * Close connection from the remote `mutex-server`.
   *
   * When connection with the `mutex-server` has been closed, all of the locks you had acquired
   * and tried would be automatically unlocked and cancelled by the server. Therefore, if you've
   * tried to get locks through the remote critical section components by calling their methods,
   * those methods would throw {@link RuntimeError} exceptions.
   *
   * @throw DomainError when the connection is not online.
   */
  public async close(): Promise<void> {
    await this.connector_.close();
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
    return this.connector_.join(param! as Date);
  }

  /* -----------------------------------------------------------
        ACCESSORS
    ----------------------------------------------------------- */
  /**
   * Get connection url.
   */
  public get url(): string | undefined {
    return this.connector_.url;
  }

  /**
   * Get state.
   *
   * Get current state of connection state with the `mutex-server`. List of values are such like
   * below:
   *
   *   - `NONE`: The {@link MutexConnector} instance is newly created, but did nothing yet.
   *   - `CONNECTING`: The {@link MutexConnector.connect} method is on running.
   *   - `OPEN`: The connection is online.
   *   - `CLOSING`: The {@link MutexConnector.close} method is on running.
   *   - `CLOSED`: The connection is offline.
   */
  public get state(): MutexConnector.State {
    return this.connector_.state;
  }

  /**
   * Get header.
   */
  public get header(): Header {
    return this.connector_.header;
  }

  /* -----------------------------------------------------------
    THREAD COMPONENTS
  ----------------------------------------------------------- */
  /**
   * Get remote condition variable.
   *
   * Get remote condition variable from the `mutex-server`.
   *
   * If the `mutex-server` doesn't have the *key* named condition variable, the server will
   * create a new condition variable instance. Otherwise, the server already has the *key* named
   * condition variable, server will return it directly.
   *
   * @param key An identifier name to be created or search for.
   * @return A {@link RemoteConditionVariable} object.
   */
  public getConditionVariable(key: string): Promise<RemoteConditionVariable> {
    return RemoteConditionVariable.create(
      this.connector_.getDriver().condition_variables,
      key,
    );
  }

  /**
   * Get remote mutex.
   *
   * Get remote mutex from the `mutex-server`.
   *
   * If the `mutex-server` doesn't have the *key* named mutex, the server will create a new
   * mutex instance. Otherwise, the server already has the *key* named mutex, server will return
   * it directly.
   *
   * @param key An identifier name to be created or search for.
   * @return A {@link RemoteMutex} object.
   */
  public getMutex(key: string): Promise<RemoteMutex> {
    return RemoteMutex.create(this.connector_.getDriver().mutexes, key);
  }

  /**
   * Get remote semaphore.
   *
   * Get remote semaphore from the `mutex-server`.
   *
   * If the `mutex-server` doesn't have the *key* named semaphore, the server will create a new
   * semaphore instance with your *count*. Otherwise, the server already has the *key* named
   * semaphore, server will return it directly.
   *
   * Therefore, if the server already has the *key* named semaphore, its
   * {@link RemoteSemaphore.max} can be different with your *count*.
   *
   * @param key An identifier name to be created or search for.
   * @param count Downward counter of the target semaphore, if newly created.
   * @return A {@link RemoteSemaphore} object.
   */
  public getSemaphore(key: string, count: number): Promise<RemoteSemaphore> {
    return RemoteSemaphore.create(
      this.connector_.getDriver().semaphores,
      key,
      count,
    );
  }

  /**
   * Get remote barrier.
   *
   * Get remote barrier from the `mutex-server`.
   *
   * If the `mutex-server` doesn't have the *key* named barrier, the server will create a new
   * barrier instance with your *count*. Otherwise, the server already has the *key* named
   * barrier, server will return it directly.
   *
   * Therefore, if the server already has the *key* named barrier, its downward counter can be
   * different with your *count*.
   *
   * @param key An identifier name to be created or search for.
   * @param count Downward counter of the target barrier, if newly created.
   * @return A {@link RemoteBarrier} object.
   */
  public getBarrier(key: string, count: number): Promise<RemoteBarrier> {
    return RemoteBarrier.create(
      this.connector_.getDriver().barriers,
      key,
      count,
    );
  }

  /**
   * Get remote latch.
   *
   * Get remote latch from the `mutex-server`.
   *
   * If the `mutex-server` doesn't have the *key* named latch, the server will create a new
   * latch instance with your *count*. Otherwise, the server already has the *key* named latch,
   * server will return it directly.
   *
   * Therefore, if the server already has the *key* named latch, its downward counter can be
   * different with your *count*.
   *
   * @param identifier An identifier name to be created or search for.
   * @param count Downward counter of the target latch, if newly created.
   * @return A {@link RemoteLatch} object.
   */
  public getLatch(identifier: string, count: number): Promise<RemoteLatch> {
    return RemoteLatch.create(
      this.connector_.getDriver().latches,
      identifier,
      count,
    );
  }
}

/**
 *
 */
export namespace MutexConnector {
  /**
   * Current state of the {@link MutexConnector}
   */
  export import State = WebSocketConnector.State;
}
