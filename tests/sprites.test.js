import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
test("run AND armed sprites explicitly alternate illustrated right/left contact poses", () => {
  for (const name of ["neon", "inda"]) {
    const m = JSON.parse(
      readFileSync(
        new URL(
          `../assets/characters/v41/${name}-frames.json`,
          import.meta.url,
        ),
      ),
    );
    assert.equal(m.frames.length, 20);
    assert.deepEqual(m.layers, { weaponUpper: 2, gaitLower: 3 });
    for (const action of ["run", "weapon"]) {
      const fs = m.frames.filter((f) => f.action === action);
      assert.equal(fs.length, 10);
      assert.equal(fs[0].lead, "right");
      assert.equal(fs[5].lead, "left");
      assert.notEqual(fs[0].legSource, fs[5].legSource);
      assert.ok(fs.some((f) => !f.contact));
    }
    assert.deepEqual(m.anchor, { x: 130, y: 210 });
  }
});
