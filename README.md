# glayse

<p align="center">A powerful ORM for ClickHouse, heavily inspired by <a href="https://github.com/drizzle-team/drizzle-orm">Drizzle ORM</a>.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/glayse"><img src="https://img.shields.io/npm/v/glayse.svg" alt="npm version"></a>
  <a href="https://github.com/yacobmole/glayse/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/glayse.svg" alt="license"></a>
</p>

## Introduction

Glayse is a modern TypeScript ORM for ClickHouse, designed to provide a seamless and efficient way to interact with your ClickHouse database. Built with type safety in mind, Glayse offers:

- 🚀 **Type-safe** - Full TypeScript support with complete type inference
- ⚡ **Fast** - Optimized queries and minimal overhead
- 🎯 **Simple** - Clean, intuitive API inspired by Drizzle ORM
- 🔧 **Flexible** - Support for complex ClickHouse data types
- 🔍 **Advanced Querying** - Rich filtering, sorting, and pagination

## Installation
Install Glayse
```bash
pnpm add glayse
```

Install the <a href="https://clickhouse.com/docs/integrations/javascript">Offical ClickhouseJS</a> client libraries.
```bash
pnpm add @clickhouse/client
# or for Browsers (Chrome/Firefox), Cloudflare workers
pnpm add @clickhouse/client-web
```


## Quick Start

```typescript
import { createClient } from "@clickhouse/client"; // @clickhouse/client-web
import { glayse, string, table } from "glayse/orm";

// Define your Tables
const events = table("events", {
  id: string("uuid").$defaultFn(() => crypto.randomUUID()),
  name: string(),
  description: string().nullable().default(null),
});

// Create the schema object
const schema = {
  events
}

// Create client and ORM
const client = createClient(connectionConfig); // For configuration options refer to https://clickhouse.com/docs/integrations/javascript#configuration
const ch = glayse(client, { schema });

// Insert data
await ch.events.insertMany([
  {
    name: "button_click",
    description: "Read More",
  },
  {
    name: "scroll",
  },
]);

// Query data with filtering
const clickEvents = await ch.events.findMany({
  filter: {
    name: { equals: "button_click" }
  },
  sort: "id",
  order: "desc",
  limit: 10
});
/*
clickEvents = [
  {
    id: "63c0fddc-7f2e-4563-9356-257b2d6f5fb7"
    name: "button_click",
    description: "Read More",
  },
  {
    id: "6a8c3221-cd15-4a87-8946-e51b6146bd3c"
    name: "scroll",
    description: null
  },
]
*/
```

## Schema Definition

### Creating Tables

Define your tables using the `table` function with column definitions:

```typescript
import { table, string, uint, datetime, chEnum } from "glayse/orm";

const users = table("users", {
  id: uint({ size: 64 }),
  name: string(),
  email: string(),
  age: uint({ size: 8 }).nullable(),
  status: chEnum(["active", "inactive", "pending"]),
  createdAt: datetime({ timezone: "UTC" }),
});
```

### Column Types

Glayse supports various ClickHouse data types:

#### String Types

```typescript
import { string, fixedString } from "glayse/orm";

const table1 = table("example", {
  // Variable length string
  description: string(),

  // Fixed length string
  code: fixedString({ length: 10 }),

  // With identifier (database column name)
  fullName: string("full_name"),
});
```

#### Numeric Types

```typescript
import { uint, float } from "glayse/orm";

const analytics = table("analytics", {
  // Unsigned integers: UInt8, UInt16, UInt32, UInt64, UInt128, UInt256
  views: uint({ size: 32 }),
  bigNumber: uint({ size: 64 }),

  // Floating point: Float32, Float64
  rating: float({ size: 32 }),
  precision: float({ size: 64 }),
});
```

#### Date and Time

```typescript
import { datetime } from "glayse/orm";

const logs = table("logs", {
  timestamp: datetime(),
  utcTime: datetime({ timezone: "UTC" }),
  localTime: datetime({ timezone: "America/New_York" }),
});
```

#### Enums

```typescript
import { chEnum } from "glayse/orm";

const orders = table("orders", {
  // Object-based enum with custom values (Recommended)
  priority: chEnum("order_priority", {
    1: "low",
    2: "medium",
    3: "high",
    4: "urgent"
  }),

  // With custom integer size
  type: chEnum({
    1: "online",
    0: "offline",
  }, { intSize: 16 }),

  // Array-based enum (Not Recommended, Due to the way Clickhouse enums work.)
  status: chEnum(["pending", "processing", "shipped", "delivered"]),
});
```

#### Special Types

```typescript
import { ipv6 } from "glayse/orm";

const connections = table("connections", {
  clientIp: ipv6(),
});
```

### Column Modifiers

#### Nullable Columns

```typescript
const users = table("users", {
  username: string(), // name: string
  name: string().default("New User"), // name: string
  bio: string().nullable(), // bio: string | null
});
```

#### Default Values

```typescript
const posts = table("posts", {
  id: string().$defaultFn(() => crypto.randomUUID()),
  title: string(),
  published: uint({ size: 8 }).default(0), // Uses sql DEFAULT
  createdAt: datetime().$defaultFn(() => new Date().toISOString()), // Creates the default at runtime
});
```

*note* Raw SQL is not currently supported

## Database Operations

### Inserting Data

#### Insert Many Records

```typescript
await db.users.insertMany([
  {
    username: "john.d",
    name: "John Doe",
    bio: null
  },
  {
    username: "jane.s",
    bio: "My cool Bio"
    // name has a default, so it can be omitted
  },
]);
```

### Querying Data

#### Find All Records

```typescript
const allUsers = await db.users.findMany();
/*
allUsers = [
  {
    username: "john.d",
    name: "John Doe",
    bio: null
  },
  {
    username: "jane.s",
    name: "New User"
    bio: "My cool Bio"
  }
]
*/
```

#### Find with Filtering

Glayse supports powerful filtering with various operators:

```typescript
// Find users by exact match
const noBioUsers = await db.users.findMany({
  filter: {
    bio: { equals: null },
  },
  sort: "name",
  limit: 10
});
/*
noBioUsers = {
  username: "john.d",
  name: "John Doe",
  bio: null
},
*/

// Find users with multiple conditions
const hasBioDefaultNameUsers = await db.users.findMany({
  filter: {
    name: { equals: "New User" },
    bio: { not_equals: null },
  },
  limit: 10
});
/*
hasBioDefaultNameUsers = [{
  username: "jane.s",
  name: "New User"
  bio: "My cool Bio"
}]
*/
```

#### Sorting and Pagination

```typescript
// Sort and limit results
const recentUsers = await db.users.findMany({
  sort: "createdAt",
  order: "desc",
  limit: 10,
  offset: 0
});

// Paginated results
const page2Users = await db.users.findMany({
  limit: 10,
  offset: 10, // Skip first 10 records
});
```

### Available Filter Operators

#### For All Types
- `equals` - Exact match
- `not_equals` - Not equal
- `in` - Value in array
- `not_in` - Value not in array

#### For Numeric and Date Types
- `gt` - Greater than
- `gte` - Greater than or equal
- `lt` - Less than
- `lte` - Less than or equal
- `between` - Between two values (inclusive)

```typescript
// String filtering
await db.events.findMany({
  filter: {
    eventType: { in: ["click", "scroll"] },
    description: { not_equals: null }
  }
});

// Numeric filtering
await db.analytics.findMany({
  filter: {
    views: { between: [100, 1000] },
    userId: { gt: 0 },
    score: { lte: 95.5 }
  }
});

// Date/time filtering
await db.logs.findMany({
  filter: {
    timestamp: {
      gte: "2024-01-01T00:00:00Z",
      lt: "2024-02-01T00:00:00Z"
    }
  }
});
```

## Type Inference

Glayse provides full type inference for your schema:

```typescript
import type { InferInsert, InferSelect } from "glayse/orm"

// TypeScript automatically infers types
type UserInsert = InferInsert<typeof users>; // or type UserInsert = typeof users.$inferInsert
// {
//   id?: number;
//   name: string;
//   email: string;
//   age?: number | null;
//   status: "active" | "inactive" | "pending";
//   createdAt?: string;
// }

type UserSelect = InferSelect<typeof users>; // or type UserSelect = typeof users.$inferSelect
// {
//   id: number;
//   name: string;
//   email: string;
//   age: number | null;
//   status: "active" | "inactive" | "pending";
//   createdAt: string;
// }
```

### Multiple Schemas

```typescript
const userSchema = {
  users: table("users", {
    id: uint({ size: 64 }),
    name: string(),
  }),
  profiles: table("user_profiles", {
    userId: uint({ size: 64 }),
    bio: string().nullable(),
  }),
};

const analyticsSchema = {
  events: table("events", {
    id: string(),
    name: string(),
    timestamp: datetime(),
  }),
};

// Create separate ORM instances
const userDb = glayse(userClient, { schema: userSchema });
const analyticsDb = glayse(analyticsClient, { schema: analyticsSchema });
```

## Roadmap

Glayse is actively being developed. Here are some planned features:

- [x] **Rich Filtering**: Multiple operators for different data types
- [ ] **Joins**: Support for JOIN operations between tables
- [ ] **Aggregations**: COUNT, SUM, AVG, MIN, MAX functions
- [ ] **Schema Migrations**: Database schema versioning and migrations
- [ ] **Batch Operations**: Optimized bulk inserts and updates
- [ ] **Materialized Views**: Support for ClickHouse materialized views

## Contributing

We welcome contributions!

## License

MIT License - see the [LICENSE](LICENSE) file for details.
