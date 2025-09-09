import type { GlayseConnection } from "./connection";
import { _findManySQL, _parseFindManyData, type FindManyQuery } from "./find";
import { _insertManySQL } from "./insert";
import type { AnyTableBuilder } from "./table";

type SchemaInput = Record<string, AnyTableBuilder>;

type TableAPI<TTable extends AnyTableBuilder> = {
	insertMany: (data: Array<TTable["$inferInsert"]>) => Promise<void>;
	findMany: (
		query?: FindManyQuery<TTable>,
	) => Promise<Array<TTable["$inferSelect"]>>;
};

type SchemaAPI<S extends SchemaInput> = {
	[TableName in keyof S]: TableAPI<S[TableName]>;
};

function createTableAPI<TTable extends AnyTableBuilder>(
	connection: GlayseConnection,
	table: TTable,
): TableAPI<TTable> {
	const tableApi: TableAPI<TTable> = {
		insertMany: async (data) => {
			const { sql, params } = _insertManySQL(table, data);

			console.log(sql, params);

			await connection.command({
				query: sql,
				query_params: params,
			});
			return Promise.resolve();
		},
		findMany: async (query) => {
			const { sql, params } = _findManySQL(table, query);

			const result = await connection.query({
				query: sql,
				query_params: params,
			});
			const json = await result.json();
			const parsed = _parseFindManyData(table, json.data);

			return Promise.resolve(parsed);
		},
	};
	return tableApi;
}

function createSchemaAPI<S extends SchemaInput>(
	connection: GlayseConnection,
	schema: S,
): SchemaAPI<S> {
	const schemaAPI = {} as SchemaAPI<S>;
	const entries = Object.entries(schema) as [keyof S, S[keyof S]][];
	entries.forEach(([friendlyName, table]) => {
		const tableAPI = createTableAPI(connection, table);
		schemaAPI[friendlyName] = tableAPI;
	});

	return schemaAPI;
}

interface GlayseOptions<TSchema extends SchemaInput> {
	schema: TSchema;
}

export const glayse = <TSchema extends SchemaInput>(
	connection: GlayseConnection,
	options: GlayseOptions<TSchema>,
) => {
	const { schema } = options;
	return createSchemaAPI(connection, schema);
};
