const fs = require("fs");

var seeds = JSON.parse(fs.readFileSync("./seeds.json", "utf8"));

var stops = JSON.parse(fs.readFileSync("./../stops.json", "utf8"));

var names = JSON.parse(fs.readFileSync("./../names.json", "utf8"));

var users = [];

seeds.forEach(seed => {
  let name = names[Math.floor(Math.random() * names.length)];
  let stop = stops[Math.floor(Math.random() * stops.length)];
  users.push({
    seed: seed,
    name: name,
    stop: stop.id,
    position: stop.position
  });
});

fs.writeFile("./../users_gen.json", JSON.stringify(users, null, 2), "utf-8");
