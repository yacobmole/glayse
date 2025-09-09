import type { ClickHouseClient } from "@clickhouse/client-common";

export type GlayseConnection = Pick<ClickHouseClient<any>, "query" | "command">;
