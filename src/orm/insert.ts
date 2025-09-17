import { sql } from "../sql";
import type { AnyTableBuilder } from "./table";

export function _insertManySQL<T extends AnyTableBuilder>(
	table: T,
	data: Array<T["$inferInsert"]>,
) {
	const columns = Object.entries(table["+glayse"].columns);
	if (!columns.length) throw new Error("No columns found");

	const insertStatement = sql`INSERT INTO ${sql.identifier(table["+glayse"].identifier)}`;

	let identifierSql: ReturnType<typeof sql> | null = null;
	columns.forEach(([key]) => {
		const toAppend = sql.identifier(table.databaseIdentifier(key));

		if (!identifierSql) identifierSql = sql`${toAppend}`;
		else identifierSql.append(sql`,${toAppend}`);
	});
	insertStatement.append(sql` (${identifierSql})`);

	const types = columns.map(([_, cb]) => {
		const dataType = cb["+glayse"].column.dataType;

		if (dataType.startsWith("Enum")) return "String";
		return dataType;
	});
	const values = data.map((value) => {
		const row: any[] = [];
		columns.forEach(([key, cb]) => {
			const hasDefault = typeof cb["+glayse"].default !== "undefined";
			const isRuntimeDefault = typeof cb["+glayse"].default === "function";

			const defaultValue = !isRuntimeDefault
				? sql.default
				: cb["+glayse"].default();

			const passedValue = value[key];
			const cell =
				passedValue === undefined && hasDefault ? defaultValue : passedValue;
			row.push(cell);
		});

		return row;
	});
	insertStatement.append(sql` VALUES ${sql.values(values, types)}`);

	return insertStatement.toSQL();
}
