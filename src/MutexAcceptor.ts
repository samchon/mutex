/**
 * @packageDocumentation
 * @module msv
 */
//-----------------------------------------------------------
import { Driver } from "tgrid/components/Driver";
import { WebAcceptor } from "tgrid/protocols/web/WebAcceptor";

import { ProviderCapsule } from "./server/ProviderCapsule";
import { ProviderGroup } from "./server/ProviderGroup";

/**
 * Acceptor of the `mutex-server`.
 *
 *  - available only in NodeJS.
 *
 * The {@link MutexAcceptor} is a communicator class interacting with the remote client, through
 * websocket and [RFC](https://github.com/samchon/tgrid#13-remote-function-call) protocol, in the
 * `mutex-server`. The {@link MutexAcceptor} objects are always created by the {@link MutexServer}
 * class, whenever a remote client connects to the `mutex-server`.
 *
 * You can accept or reject the client's connection by calling {@link accept} or {@link reject}
 * method. If you {@link accept} the connection, the interaction would be started and the client
 * can access to critical component sections of this `mutex-server`.
 *
 * Also, when declaring this {@link MutexAcceptor} type, you've to define two template arguments,
 * *Header* and *Provider*. The *Header* type repersents an initial data gotten from the remote
 * client after the connection. I hope you and client not to omit it and utilize it as an
 * activation tool to enhance security.
 *
 * The second template argument *Provider* represents the additional features provided for the
 * remote client. If you don't have any plan to provide additional feature to the remote client,
 * just declare it as `null`
 *
 * @template Header Type of the header containing initial data.
 * @template Provider Type of additional features provided for the remote client.
 * @author Jeongho Nam - https://github.com/samchon
 */
export class MutexAcceptor<Header, Provider extends object | null> {
    /**
     * @hidden
     */
    private base_: WebAcceptor<Header, ProviderCapsule<Provider>>;

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
        base: WebAcceptor<Header, ProviderCapsule<Provider>>,
        group: ProviderGroup,
    ) {
        this.base_ = base;
        this.group_ = group;
    }

    /**
     * @internal
     */
    public static create<Header, Provider extends object | null>(
        base: WebAcceptor<Header, ProviderCapsule<Provider>>,
        group: ProviderGroup,
    ) {
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
     * In addition, the disconnection destories all [RFC](https://github.com/samchon/tgrid#13-remote-function-call)s
     * between the remote client. Therefore, if the remote client is providing custom features to
     * your `mutex-server` and there're uncompleted method calls to the `Provider` through
     * `Driver<Controller>`, {@link RuntimeError} exceptions would be thrown.
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

    /**
     * Get Driver for [RFC](https://github.com/samchon/tgrid#13-remote-function-call).
     *
     * If remote client provides custom features for this `mutex-server`, you can utilize
     * those features thorugh returned `Driver` object by this method. To use this method, you
     * should define the `Controller` template argument, a type of interface who is defining
     * additionla features provided from the remote client.
     *
     * The returned object `Driver` makes to call remote functions, defined in the `Controller`
     * and provided by `Provider` in the remote client, possible. In other words, callling a
     * function in the `Driver<Controller>`, it means to call a matched function in the remote
     * client's `Provider` object.
     *
     *   - `Controller`: Definition only
     *   - `Driver`: [Remote Function Call](https://github.com/samchon/tgrid#13-remote-function-call)
     *
     * @template Controller An interface for provided features (functions & objects) from the remote client (`Provider`).
     * @template UseParametric Whether to convert type of function parameters to be compatible with their pritimive.
     * @return A `Driver` for the [RFC](https://github.com/samchon/tgrid#13-remote-function-call).
     */
    public getDriver<
        Controller extends object,
        UseParametric extends boolean = false,
    >(): Driver<Controller, UseParametric> {
        return this.base_.getDriver();
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
    public async accept(provider: Provider): Promise<void> {
        await this.base_.accept({ group: this.group_, provider: provider });
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
    export import State = WebAcceptor.State;
}
