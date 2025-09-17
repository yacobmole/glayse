export type Unsafe = string | number | boolean | bigint;

class SQLSpecial {
	constructor(public sql: string) {}

	static identifier(sql: string) {
		// replace every run of backticks with doubled length
		const escaped = sql.replace(/`+/g, (m) => m.repeat(2));
		return new SQLSpecial(`\`${escaped}\``);
	}

	static default() {
		return new SQLSpecial("DEFAULT");
	}

	static raw(unsafeSql: Unsafe) {
		return new SQLSpecial(unsafeSql.toString());
	}
}

class SQLValues {
	constructor(
		public values: Array<any>,
		public types: Array<string>,
	) {}

	static createValueTypePair(value: any, type?: string) {
		if (
			typeof value === "bigint" ||
			typeof value === "number" ||
			typeof value === "boolean" ||
			typeof value === "string" ||
			value === null
		)
			return { value: value.toString(), type: type || "String" };

		return { value, type };
	}

	static values(data: Array<any>, forcedTypes?: Array<string>) {
		const { values, types } = data.reduce(
			({ values, types }, input, index) => {
				const { value, type } = SQLValues.createValueTypePair(
					input,
					forcedTypes?.[index],
				);
				values.push(value);
				types.push(type);
				return { values, types };
			},
			{ values: [], types: [] },
		);
		return new SQLValues(values, types);
	}
}

class SQLQuery {
	constructor(
		public segments: Array<string>,
		public values: Array<any>,
		public types: Array<string>,
	) {}

	private createEscapedParam(index: number, type: string = "String") {
		const name = `param${index}`;
		return { escaped: `{${name}:${type}}`, name };
	}

	static template(
		strings: TemplateStringsArray,
		...vars: Array<any | SQLSpecial | SQLValues>
	) {
		const segments: Array<string> = [];
		const values: Array<any> = [];
		const types: Array<string> = [];

		strings.forEach((str, i) => {
			if (i === vars.length) {
				segments.push(str);
			} else {
				const value = vars[i];
				if (value instanceof SQLSpecial) {
					if (segments[values.length] !== undefined)
						segments[values.length] += str + value.sql;
					else segments.push(str + value.sql);
				} else if (value instanceof SQLValues) {
					segments.push(...value.values.map((_, i) => (i === 0 ? str : "")));
					values.push(...value.values);
					types.push(...value.types);
				} else {
					segments.push(str);
					values.push(value);
					types.push("String");
				}
			}
		});

		return new SQLQuery(segments, values, types);
	}

	append(query: SQLQuery) {
		const firstSegment = query.segments[0];
		if (firstSegment) {
			const restSegments = query.segments.slice(1);
			const lastExistingSegment = this.segments[this.segments.length - 1] || "";
			this.segments[this.segments.length - 1] =
				lastExistingSegment + firstSegment;
			this.segments.push(...restSegments);
		}
		this.values.push(...query.values);
		this.types.push(...query.types);

		return this;
	}

	toSQL() {
		const params: Record<string, any> = {};
		const sql = this.segments
			.map((str, i) => {
				const value = this.values[i];
				const type = this.types[i];
				if (value) {
					const { name, escaped } = this.createEscapedParam(i, type);
					params[name] = value;

					return str + escaped;
				} else return str;
			})
			.join("");
		return { sql, params };
	}
}

export const sql = Object.assign(SQLQuery.template, {
	identifier: SQLSpecial.identifier,
	default: SQLSpecial.default,
	raw: SQLSpecial.raw,
	values: SQLValues.values,
});
