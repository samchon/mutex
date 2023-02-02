/**
 * @packageDocumentation
 * @module msv
 */
//-----------------------------------------------------------
import { WebAcceptor } from "tgrid/protocols/web/WebAcceptor";
import { List } from "tstl/container/List";

import { GlobalGroup } from "./GlobalGroup";
import { Joiner } from "./components/internal/Joiner";
import { BarriersProvider } from "./providers/BarriersProvider";
import { ConditionVariablesProvider } from "./providers/ConditionVariablesProvider";
import { LatchesProvider } from "./providers/LatchesProvider";
import { MutexesProvider } from "./providers/MutexesProvider";
import { SemaphoresProvider } from "./providers/SemaphoresProvider";

/**
 * @internal
 */
export class ProviderGroup {
    private readonly disolvers_: List<Joiner>;

    // MAIN COMPONENTS
    public readonly condition_variables: ConditionVariablesProvider;
    public readonly mutexes: MutexesProvider;
    public readonly semaphores: SemaphoresProvider;

    // ADAPTOR COMPONENTS
    public readonly barriers: BarriersProvider;
    public readonly latches: LatchesProvider;

    public constructor(group: GlobalGroup, acceptor: WebAcceptor<any, any>) {
        this.disolvers_ = new List();

        this.condition_variables = new ConditionVariablesProvider(
            group.condition_variables,
            acceptor,
            this.disolvers_,
            "RemoteConditionVariable",
        );
        this.mutexes = new MutexesProvider(
            group.mutexes,
            acceptor,
            this.disolvers_,
            "RemoteMutex",
        );
        this.semaphores = new SemaphoresProvider(
            group.semaphores,
            acceptor,
            this.disolvers_,
            "RemoteSemaphore",
        );

        this.barriers = new BarriersProvider(
            group.barriers,
            acceptor,
            this.disolvers_,
            "RemoteBarrier",
        );
        this.latches = new LatchesProvider(
            group.latches,
            acceptor,
            this.disolvers_,
            "RemoteLatch",
        );
    }

    public async destructor(): Promise<void> {
        for (const joiner of this.disolvers_)
            if (joiner !== undefined) await joiner();

        await this.condition_variables.destructor();
        await this.mutexes.destructor();
        await this.semaphores.destructor();
    }
}
