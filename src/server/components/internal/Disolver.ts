import { IPointer } from "tstl/functional/IPointer";

export type Disolver = IPointer<(() => Promise<void>) | undefined>;