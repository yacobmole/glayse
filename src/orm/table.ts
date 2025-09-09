import type { PartialOnUndefinedDeep, Simplify } from "type-fest";
import type { AnyColumnBuilder, ColumnBuilder } from "./column";
import type { TSForColumn } from "./data-types";

export type TableDef<
	TColumns extends Record<string, AnyColumnBuilder>,
	TIdentifier extends string,
> = {
	columns: TColumns;
	identifier: TIdentifier;
};

export class TableBuilder<
	TColumns extends Record<string, AnyColumnBuilder>,
	TIdentifier extends string,
> {
	"+glayse": TableDef<TColumns, TIdentifier>;

	declare readonly $inferSelect: InferSelect<this>;
	declare readonly $inferInsert: InferInsert<this>;

	constructor(def: TableDef<TColumns, TIdentifier>) {
		this["+glayse"] = def;
	}

	databaseIdentifier<Input extends string>(key: Input) {
		return this["+glayse"].columns[key]?.["+glayse"].identifier || key;
	}
}

export type AnyTableBuilder = TableBuilder<
	Record<string, AnyColumnBuilder>,
	string
>;

export type InferInsert<TTable extends AnyTableBuilder> = Simplify<
	PartialOnUndefinedDeep<{
		[K in keyof TTable["+glayse"]["columns"] &
			string]: TTable["+glayse"]["columns"][K] extends ColumnBuilder<
			infer C,
			infer _I,
			infer N,
			infer D
		>
			? D extends undefined
				? N extends true
					? null | TSForColumn<C>
					: TSForColumn<C>
				: (N extends true ? null | TSForColumn<C> : TSForColumn<C>) | undefined
			: never;
	}>
>;

export type InferSelect<TTable extends AnyTableBuilder> = Simplify<
	Required<InferInsert<TTable>>
>;

export function table<
	TIdentifier extends string,
	TColumns extends Record<string, AnyColumnBuilder>,
>(
	identifier: TIdentifier,
	columns: TColumns,
): TableBuilder<TColumns, TIdentifier> {
	return new TableBuilder({
		columns,
		identifier,
	}) as TableBuilder<TColumns, TIdentifier>;
}
