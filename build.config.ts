import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
	entries: ["./src/orm/index", "./src/sql/index"],
	declaration: true,
});
