export namespace ArrayUtil {
    export async function asyncForEach<Input>(
        elements: readonly Input[],
        closure: (
            elem: Input,
            index: number,
            array: readonly Input[],
        ) => Promise<any>,
    ): Promise<void> {
        await asyncRepeat(elements.length, (index) =>
            closure(elements[index], index, elements),
        );
    }

    export async function asyncMap<Input, Output>(
        elements: readonly Input[],
        closure: (
            elem: Input,
            index: number,
            array: readonly Input[],
        ) => Promise<Output>,
    ): Promise<Output[]> {
        const ret: Output[] = [];
        await asyncForEach(elements, async (elem, index, array) => {
            const output: Output = await closure(elem, index, array);
            ret.push(output);
        });
        return ret;
    }

    export async function asyncRepeat<T>(
        count: number,
        closure: (index: number) => Promise<T>,
    ): Promise<T[]> {
        const indexes: number[] = new Array(count)
            .fill(1)
            .map((_, index) => index);

        const output: T[] = [];
        for (const index of indexes) output.push(await closure(index));

        return output;
    }
}
