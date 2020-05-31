/**
 * @packageDocumentation
 * @module ms
 */
//-----------------------------------------------------------
import { BarrierProvider } from "./BarrierProvider";
import { ConditionVariableProvider } from "./ConditionVariableProvider";
import { LatchProvider } from "./LatchProvider";
import { MutexProvider } from "./MutexProvider";
import { SemaphoreProvider } from "./SemaphoreProvider";

/**
 * @hidden
 */
export class Provider
{
    public readonly barriers: BarrierProvider = new BarrierProvider();
    public readonly condition_variables: ConditionVariableProvider = new ConditionVariableProvider();
    public readonly latches: LatchProvider = new LatchProvider();
    public readonly mutexes: MutexProvider = new MutexProvider();
    public readonly semaphores: SemaphoreProvider = new SemaphoreProvider();
}