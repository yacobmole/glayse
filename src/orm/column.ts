import type { Except } from "type-fest";
import type {
	AnyColumn,
	DateTimeColumn,
	EnumColumn,
	EnumIntSize,
	FixedStringColumn,
	FloatColumn,
	IPv6Column,
	StringColumn,
	TSForColumn,
	UIntColumn,
} from "./data-types";

export type DefaultFn<TColumn extends AnyColumn> = () => TSForColumn<TColumn>;
export type DefaultSQL<TColumn extends AnyColumn> = TSForColumn<TColumn>;
export type DefaultSQLStatement = { sql: true };
export type AnyDefault =
	| DefaultFn<AnyColumn>
	| DefaultSQL<AnyColumn>
	| undefined;

export type ColumnDef<
	TColumn extends AnyColumn,
	TIdentifier extends string | undefined,
	Nullable extends boolean,
	TDefault extends DefaultFn<TColumn> | DefaultSQL<TColumn> | undefined,
> = {
	identifier: TIdentifier;
	column: TColumn;
	nullable: Nullable;
	default: TDefault;
};

export class ColumnBuilder<
	TColumn extends AnyColumn,
	TIdentifier extends string | undefined,
	Nullable extends boolean,
	TDefault extends DefaultFn<TColumn> | DefaultSQL<TColumn> | undefined,
> {
	"+glayse": ColumnDef<TColumn, TIdentifier, Nullable, TDefault>;

	constructor(def: ColumnDef<TColumn, TIdentifier, Nullable, TDefault>) {
		this["+glayse"] = def;
	}

	nullable(
		this: ColumnBuilder<TColumn, TIdentifier, false, TDefault>,
	): ColumnBuilder<TColumn, TIdentifier, true, TDefault>;
	nullable(
		this: ColumnBuilder<TColumn, TIdentifier, true, TDefault>,
		state: false,
	): ColumnBuilder<TColumn, TIdentifier, false, TDefault>;
	nullable(state?: false) {
		return new ColumnBuilder({
			...this["+glayse"],
			nullable: (state ?? true) as true | false, // inferred as true when undefined
		});
	}

	default(
		this: ColumnBuilder<TColumn, TIdentifier, Nullable, undefined>,
		value: DefaultSQL<TColumn>,
	): ColumnBuilder<TColumn, TIdentifier, Nullable, DefaultSQL<TColumn>> {
		return new ColumnBuilder({
			...this["+glayse"],
			default: value,
		});
	}

	$defaultFn(
		this: ColumnBuilder<TColumn, TIdentifier, Nullable, undefined>,
		fn: DefaultFn<TColumn>,
	): ColumnBuilder<TColumn, TIdentifier, Nullable, DefaultFn<TColumn>> {
		return new ColumnBuilder({
			...this["+glayse"],
			default: fn,
		});
	}
}

export type AnyColumnBuilder = ColumnBuilder<
	AnyColumn,
	string | undefined,
	boolean,
	DefaultFn<AnyColumn> | DefaultSQL<AnyColumn> | undefined
>;

// Column Utility Functions
export function string<I extends string>(
	identifier?: I,
): ColumnBuilder<StringColumn, I, false, undefined> {
	return new ColumnBuilder({
		identifier: identifier as I,
		column: {
			dataType: "String",
		} satisfies StringColumn,
		nullable: false,
		default: undefined,
	});
}

export function fixedString(
	options: FixedStringColumn["options"],
): ColumnBuilder<FixedStringColumn, undefined, false, undefined>;
export function fixedString<I extends string>(
	identifier: I,
	options: FixedStringColumn["options"],
): ColumnBuilder<FixedStringColumn, I, false, undefined>;
export function fixedString<I extends string>(
	a: I | FixedStringColumn["options"],
	b?: FixedStringColumn["options"],
): ColumnBuilder<FixedStringColumn, I | undefined, false, undefined> {
	const hasId = typeof a === "string";
	const identifier = (hasId ? a : undefined) as I | undefined;
	const options = (hasId ? b : a) as FixedStringColumn["options"];

	return new ColumnBuilder({
		identifier: identifier as I, // undefined only in first overload
		column: { dataType: "FixedString", options } satisfies FixedStringColumn,
		nullable: false,
		default: undefined,
	});
}

export function ipv6(): ColumnBuilder<IPv6Column, undefined, false, undefined>;
export function ipv6<I extends string>(
	identifier?: I,
): ColumnBuilder<IPv6Column, I, false, undefined> {
	return new ColumnBuilder({
		identifier: identifier as I,
		column: {
			dataType: "IPv6",
		} satisfies IPv6Column,
		nullable: false,
		default: undefined,
	});
}

export function uint(
	options: UIntColumn["options"],
): ColumnBuilder<UIntColumn, undefined, false, undefined>;
export function uint<I extends string>(
	identifier: I,
	options: UIntColumn["options"],
): ColumnBuilder<UIntColumn, I, false, undefined>;
export function uint<I extends string>(
	a: I | UIntColumn["options"],
	b?: UIntColumn["options"],
): ColumnBuilder<UIntColumn, I | undefined, false, undefined> {
	const hasId = typeof a === "string";
	const identifier = (hasId ? a : undefined) as I | undefined;
	const options = (hasId ? b : a) as UIntColumn["options"];

	const size = options?.size || 32;

	return new ColumnBuilder({
		identifier: identifier as I, // undefined only in first overload
		column: {
			dataType: `UInt${size}`,
			options: {
				size,
			},
		} satisfies UIntColumn,
		nullable: false,
		default: undefined,
	});
}

export function float(
	options: FloatColumn["options"],
): ColumnBuilder<FloatColumn, undefined, false, undefined>;
export function float<I extends string>(
	identifier: I,
	options?: FloatColumn["options"],
): ColumnBuilder<FloatColumn, I, false, undefined>;
export function float<I extends string>(
	a: I | FloatColumn["options"],
	b?: FloatColumn["options"],
): ColumnBuilder<FloatColumn, I | undefined, false, undefined> {
	const hasId = typeof a === "string";
	const identifier = (hasId ? a : undefined) as I | undefined;
	const options = (hasId ? b : a) as FloatColumn["options"];

	const size = options?.size || 32;

	return new ColumnBuilder({
		identifier: identifier as I, // undefined only in first overload
		column: {
			dataType: `Float${size}`,
			options: {
				size,
			},
		} satisfies FloatColumn,
		nullable: false,
		default: undefined,
	});
}

export function datetime(
	options?: DateTimeColumn["options"],
): ColumnBuilder<DateTimeColumn, undefined, false, undefined>;
export function datetime<I extends string>(
	identifier: I,
	options?: DateTimeColumn["options"],
): ColumnBuilder<DateTimeColumn, I, false, undefined>;
export function datetime<I extends string>(
	a: I | DateTimeColumn["options"],
	b?: DateTimeColumn["options"],
): ColumnBuilder<DateTimeColumn, I | undefined, false, undefined> {
	const hasId = typeof a === "string";
	const identifier = (hasId ? a : undefined) as I | undefined;
	const options = (hasId ? b : a) as DateTimeColumn["options"];

	const timezone = options?.timezone || null;

	return new ColumnBuilder({
		identifier: identifier as I, // undefined only in first overload
		column: {
			dataType: `DateTime`,
			options: {
				timezone,
			},
		} satisfies DateTimeColumn,
		nullable: false,
		default: undefined,
	});
}

type EnumValues = Record<number, string>;
type EnumValuesTuple = readonly [string, ...string[]];
type NormaliseEnumValues<V extends EnumValuesTuple | EnumValues> =
	V extends EnumValuesTuple
		? {
				[T in V[number]]: T;
			}
		: V;
export function chEnum<const V extends EnumValues | EnumValuesTuple>(
	values: V,
	options?: Except<
		Required<EnumColumn<EnumIntSize, NormaliseEnumValues<V>>>["options"],
		"values"
	>,
): ColumnBuilder<
	EnumColumn<EnumIntSize, NormaliseEnumValues<V>>,
	undefined,
	false,
	undefined
>;
export function chEnum<
	I extends string,
	const V extends EnumValues | EnumValuesTuple,
>(
	identifier: I,
	values: V,
	options?: Except<
		Required<EnumColumn<EnumIntSize, NormaliseEnumValues<V>>>["options"],
		"values"
	>,
): ColumnBuilder<
	EnumColumn<EnumIntSize, NormaliseEnumValues<V>>,
	I,
	false,
	undefined
> {
	const intSize = options?.intSize || 8;

	const enumValues: NormaliseEnumValues<V> = Array.isArray(values)
		? (Object.assign({}, values) as any)
		: values;

	return new ColumnBuilder({
		identifier,
		column: {
			dataType: `Enum${intSize}`,
			options: {
				intSize,
				values: enumValues,
			},
		} as EnumColumn<EnumIntSize, NormaliseEnumValues<V>>,
		nullable: false,
		default: undefined,
	});
}
