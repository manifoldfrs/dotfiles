#!/bin/bash
set -e
fixture="$1"
mkdir -p "$fixture/src/handlers" "$fixture/test"
cat > "$fixture/src/users.js" <<'EOF'
const DB = { 1: { id: 1, name: "Ada" }, 2: { id: 2, name: "Lin" } };
function getUser(id) {
  return DB[id] ?? null;
}
function getUsers() {
  return Object.values(DB);
}
function getUserName(id) {
  const user = getUser(id);
  return user ? user.name : "unknown";
}
module.exports = { getUser, getUsers, getUserName };
EOF
for i in $(seq -w 1 12); do
  cat > "$fixture/src/handlers/h$i.js" <<EOF
const { getUser, getUserName, getUsers } = require("../users");
function handle$i(id) {
  const user = getUser(id);
  const label = getUserName(id);
  return { user, label, total: getUsers().length, route: "h$i" };
}
module.exports = { handle$i };
EOF
done
cat > "$fixture/src/handlers/index.js" <<'EOF'
const users = require("../users");
const handlers = {};
for (let i = 1; i <= 12; i++) {
  const name = String(i).padStart(2, "0");
  Object.assign(handlers, require(`./h${name}`));
}
handlers.lookup = (id) => users.getUser(id);
module.exports = handlers;
EOF
cat > "$fixture/test/run.js" <<'EOF'
const assert = require("node:assert");
const users = require("../src/users");
const handlers = require("../src/handlers");
assert.strictEqual(typeof users.fetchUser, "function");
assert.strictEqual(users.getUser, undefined);
assert.strictEqual(users.getUserName(1), "Ada");
assert.strictEqual(users.getUsers().length, 2);
assert.deepStrictEqual(handlers.handle07(2).user, { id: 2, name: "Lin" });
assert.strictEqual(handlers.lookup(1).name, "Ada");
console.log("ok");
EOF
echo "done" > "$2"
