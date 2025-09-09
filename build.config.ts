import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
	entries: ["./src/orm/index"],
	declaration: true,
});
