import { sql } from "../sql";
import type { AnyTableBuilder } from "./table";

export type FindManyQuery<
	TTable extends AnyTableBuilder,
	_Select = TTable["$inferSelect"],
	_Keys = Extract<keyof _Select, string>,
> = {
	limit?: number;
	offset?: number;
	order?: "asc" | "desc";
	sort?: Extract<keyof _Select, string>;
	filter?: {
		[K in Extract<keyof _Select, string>]?: _Select[K] extends Date | number
			? {
					equals?: _Select[K] | number;
					not_equals?: _Select[K] | number;
					in?: (_Select[K] | number)[];
					not_in?: (_Select[K] | number)[];
					gt?: _Select[K] | number;
					gte?: _Select[K] | number;
					lt?: _Select[K] | number;
					lte?: _Select[K] | number;
					between?: [_Select[K] | number, _Select[K] | number];
				}
			: {
					equals?: _Select[K];
					not_equals?: _Select[K];
					in?: _Select[K][];
					not_in?: _Select[K][];
				};
	};
};

export function _findManySQL<T extends AnyTableBuilder>(
	table: T,
	query?: FindManyQuery<T>,
) {
	const tableIdentifier = sql.identifier(table["+glayse"].identifier);

	const findStatement = sql`SELECT * FROM ${tableIdentifier}`;

	if (query?.filter) {
		findStatement.append(sql` WHERE 1=1`);
		for (const [key, rules] of Object.entries(query.filter)) {
			const column = sql.identifier(table.databaseIdentifier(key));
			if (!rules) continue;

			if (rules.equals !== undefined) {
				findStatement.append(sql` AND ${column} = ${rules.equals}`);
			}
			if (rules.not_equals !== undefined) {
				findStatement.append(sql` AND ${column} != ${rules.not_equals}`);
			}
			if (rules.in !== undefined) {
				findStatement.append(sql` AND ${column} IN (${rules.in})`);
			}
			if (rules.not_in !== undefined) {
				findStatement.append(sql` AND ${column} NOT IN (${rules.not_in})`);
			}

			if ("gt" in rules && rules.gt !== undefined)
				findStatement.append(sql` AND ${column} > ${rules.gt}`);
			if ("gte" in rules && rules.gte !== undefined)
				findStatement.append(sql` AND ${column} >= ${rules.gte}`);
			if ("lt" in rules && rules.lt !== undefined)
				findStatement.append(sql` AND ${column} < ${rules.lt}`);
			if ("lte" in rules && rules.lte !== undefined)
				findStatement.append(sql` AND ${column} <= ${rules.lte}`);
			if (
				"between" in rules &&
				Array.isArray(rules.between) &&
				rules.between.length === 2
			) {
				const [start, end] = rules.between;
				findStatement.append(sql` AND ${column} BETWEEN ${start} AND ${end}`);
			}
		}
	}
	if (query?.sort)
		findStatement.append(
			sql` ORDER BY ${sql.identifier(table.databaseIdentifier(query.sort))} ${sql.raw(query.order?.toUpperCase() === "ASC" ? "ASC" : "DESC")}`,
		);
	if (query?.limit) findStatement.append(sql` LIMIT ${query.limit}`);
	if (query?.offset) findStatement.append(sql` OFFSET ${query.offset}`);

	return findStatement.toSQL();
}

export function _parseFindManyData<T extends AnyTableBuilder>(
	table: T,
	data: any,
): T["$inferSelect"][] {
	const getFriendlyName = (identifier: string) =>
		table["+glayse"].columns[identifier]?.["+glayse"].identifier || identifier;

	if (!Array.isArray(data)) throw new Error("Data is not an json array");

	const parsedData = data.map((row: any) => {
		const parsedRow: Record<string, any> = {};
		for (const [key, value] of Object.entries(row)) {
			parsedRow[getFriendlyName(key)] = value;
		}
		return parsedRow;
	});

	return parsedData;
}
