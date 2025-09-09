export type ValidDataType =
	| "String"
	| "FixedString"
	| "Bool"
	| "IPv6"
	| `UInt${UIntSize}`
	| `Float${FloatSize}`
	| "DateTime"
	| `Enum${EnumIntSize}`;

type BaseColumn<
	DataType extends ValidDataType,
	TOptions extends Record<string, any> = never,
> = {
	dataType: DataType;
	options?: TOptions;
};

export type StringColumn = BaseColumn<"String">;
export type FixedStringColumn = BaseColumn<"FixedString", { length: number }>;
export type BoolColumn = BaseColumn<"Bool">;
export type IPv6Column = BaseColumn<"IPv6">;
export type UIntSize = 8 | 16 | 32 | 64 | 128 | 256;
export type UIntColumn<S extends UIntSize = UIntSize> = BaseColumn<
	`UInt${S}`,
	{ size: S }
>;
export type FloatSize = 32 | 64;
export type FloatColumn<S extends FloatSize = FloatSize> = BaseColumn<
	`Float${S}`,
	{ size: S }
>;
export type DateTimeColumn = BaseColumn<
	"DateTime",
	{ timezone: string | null }
>;

export type EnumIntSize = 8 | 16;
export type EnumColumn<
	S extends EnumIntSize = EnumIntSize,
	V extends Record<number, string> = Record<number, string>,
> = BaseColumn<`Enum${S}`, { values: V; intSize: S }>;

export type AnyColumn = BaseColumn<ValidDataType, Record<string, any>>;

type EnumValueUnion<V> = V extends Record<number, infer S>
	? string extends S
		? string
		: S
	: never;
export type TSForColumn<TColumn extends AnyColumn> = TColumn extends
	| StringColumn
	| FixedStringColumn
	? string
	: TColumn extends BoolColumn
		? boolean
		: TColumn extends IPv6Column
			? string
			: TColumn extends UIntColumn
				? number
				: TColumn extends FloatColumn
					? number
					: TColumn extends DateTimeColumn
						? string
						: TColumn extends EnumColumn<EnumIntSize, infer V>
							? EnumValueUnion<V>
							: any;
