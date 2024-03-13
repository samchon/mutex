import { GlobalBarriers } from "./global/GlobalBarriers";
import { GlobalConditionVariablaes } from "./global/GlobalConditionVariables";
import { GlobalLatches } from "./global/GlobalLatches";
import { GlobalMutexes } from "./global/GlobalMutexes";
import { GlobalSemaphores } from "./global/GlobalSemaphores";

/**
 * @internal
 */
export class GlobalGroup {
  // MAIN COMPONENTS
  public condition_variables: GlobalConditionVariablaes =
    new GlobalConditionVariablaes();
  public mutexes: GlobalMutexes = new GlobalMutexes();
  public semaphores: GlobalSemaphores = new GlobalSemaphores();

  // ADAPTOR COMPONENTS
  public barriers: GlobalBarriers = new GlobalBarriers();
  public latches: GlobalLatches = new GlobalLatches();
}
