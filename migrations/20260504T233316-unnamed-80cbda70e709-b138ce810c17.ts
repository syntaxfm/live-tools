import { schema as s } from "jazz-tools";

export default s.defineMigration({
  dropTables: {
    "lowerThirdOverlays": true,
  },
  fromHash: "80cbda70e709",
  toHash: "b138ce810c17",
  from: {
  "lowerThirdOverlays": s.table({
    "showId": s.ref("shows"),
    "activeShowHostId": s.ref("showHosts").optional(),
    "updatedById": s.ref("appUsers"),
    "updatedAt": s.timestamp(),
  })
},
  to: {},
});
