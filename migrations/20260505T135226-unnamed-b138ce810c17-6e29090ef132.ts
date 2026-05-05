import { schema as s } from "jazz-tools";

export default s.defineMigration({
  createTables: {
    "tickerMessages": true,
  },
  fromHash: "b138ce810c17",
  toHash: "6e29090ef132",
  from: {},
  to: {
  "tickerMessages": s.table({
    "showId": s.ref("shows"),
    "text": s.string(),
    "position": s.int(),
    "createdById": s.ref("appUsers"),
    "createdAt": s.timestamp(),
    "updatedAt": s.timestamp().optional(),
  })
},
});
