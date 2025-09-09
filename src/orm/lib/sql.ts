// # IMPORTANT
// https://github.com/drizzle-team/waddler/issues/6
//
// This file is a hacky cobbled together version of the parts of the original waddler  library source files.
// The modifications are necessary to avoid the dependency on @clickhouse/client

import {
	ClickHouseDialect,
	type Identifier,
	type IdentifierObject,
	type Raw,
	type SQL,
	SQLCommonParam,
	SQLDefault,
	SQLIdentifier,
	type SQLParamType,
	SQLQuery,
	SQLRaw,
	SQLValues,
	SQLWrapper,
	type Values,
} from "waddler";

export type DbType =
	| "Int8"
	| "Int16"
	| "Int32"
	| "Int64"
	| "Int128"
	| "Int256"
	| "UInt8"
	| "UInt16"
	| "UInt32"
	| "UInt64"
	| "UInt128"
	| "UInt256"
	| "Float32"
	| "Float64"
	| "BFloat16"
	| "Decimal"
	| "Decimal32"
	| "Decimal64"
	| "Decimal128"
	| "Decimal256"
	| "String"
	| "FixedString"
	| "Enum"
	| "UUID"
	| "IPv4"
	| "IPv6"
	| "Date"
	| "Date32"
	| "Time"
	| "Time64"
	| "DateTime"
	| "DateTime64"
	| "Bool"
	| "JSON"
	| "Tuple"
	| "Map"
	| "Variant"
	| "LowCardinality"
	| "Nullable"
	| "Point"
	| "Ring"
	| "LineString"
	| "MultiLineString"
	| "Polygon"
	| "MultiPolygon"
	| (string & {});

export const SQLFunctions = {
	identifier: (value: Identifier<IdentifierObject>) => {
		return new SQLIdentifier(value);
	},
	values: (value: Values, types?: DbType[]) => {
		return new SQLValues(value, types);
	},
	param: (value: any, type?: DbType) => {
		return new SQLCommonParam(value, type);
	},
	raw: (value: Raw) => {
		return new SQLRaw(value);
	},
	default: new SQLDefault(),
};
interface ClickHouseSQLQuery
	extends Pick<SQL, "identifier" | "raw" | "default"> {
	values(value: Values, types?: DbType[]): SQLValues;
	param(value: any, type: DbType): SQLCommonParam;
	(
		strings: TemplateStringsArray,
		...params: SQLParamType[]
	): SQLQuery<ClickHouseDialect>;
}
const sql = ((strings: TemplateStringsArray, ...params: SQLParamType[]) => {
	const sqlWrapper = new SQLWrapper();
	sqlWrapper.with({ templateParams: { strings, params } });
	const dialect = new ClickHouseDialect();

	return new SQLQuery(sqlWrapper, dialect);
}) as ClickHouseSQLQuery;

Object.assign(sql, SQLFunctions);

export { sql };
