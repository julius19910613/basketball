/**
 * @jest-environment jsdom
 */

const path = require("path");
const simulate = require("miniprogram-simulate");

describe("player-stat-input component", () => {
  const componentPath = path.resolve(__dirname, "../miniprogram/components/player-stat-input/player-stat-input");
  let componentId = "";

  beforeAll(() => {
    componentId = simulate.load(componentPath, { compiler: "simulate" });
  });

  function renderComponent(properties = {}) {
    const comp = simulate.render(componentId, properties);
    comp.attach(document.createElement("div"));
    return comp;
  }

  test("initializes played players and emits team points", () => {
    const players = [
      { _id: "p1", nickname: "A", position: "PG" },
      { _id: "p2", nickname: "B", position: "SG" }
    ];
    const value = [
      { playerId: "p1", nickname: "A", position: "PG", played: true, points: 12 },
      { playerId: "p2", nickname: "B", position: "SG", played: false, points: 8 }
    ];

    const comp = renderComponent({ players, value });

    expect(comp.data.selectedIds).toEqual(["p1"]);
    expect(comp.data.statsMap.p1.played).toBe(true);
    expect(comp.data.statsMap.p2.played).toBe(false);

    const changes = [];
    comp.addEventListener("change", (evt) => changes.push(evt.detail));
    comp.instance.emitChange();

    expect(changes).toHaveLength(1);
    expect(changes[0].totalPoints).toBe(12);
    expect(changes[0].value).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ playerId: "p1", played: true, points: 12 }),
        expect.objectContaining({ playerId: "p2", played: false, points: 8 })
      ])
    );
  });

  test("updates played state and shooting percentages through component methods", () => {
    const players = [{ _id: "p1", nickname: "A", position: "PG" }];
    const comp = renderComponent({ players, value: [] });

    comp.instance.onTogglePlayer({
      currentTarget: { dataset: { playerId: "p1" } },
      detail: { value: true }
    });
    comp.instance.onStatInput({
      currentTarget: { dataset: { playerId: "p1", field: "shotsMade" } },
      detail: { value: 5 }
    });
    comp.instance.onStatInput({
      currentTarget: { dataset: { playerId: "p1", field: "shotsAttempted" } },
      detail: { value: 8 }
    });
    comp.instance.onStatInput({
      currentTarget: { dataset: { playerId: "p1", field: "points" } },
      detail: { value: 14 }
    });

    const changes = [];
    comp.addEventListener("change", (evt) => changes.push(evt.detail));
    comp.instance.emitChange();

    expect(comp.data.selectedIds).toEqual(["p1"]);
    expect(comp.data.statsMap.p1.played).toBe(true);
    expect(comp.data.statsMap.p1.shotsMade).toBe(5);
    expect(comp.data.statsMap.p1.shotsAttempted).toBe(8);
    expect(changes[0].totalPoints).toBe(14);
    expect(changes[0].value).toEqual([
      expect.objectContaining({
        playerId: "p1",
        played: true,
        points: 14,
        fgPct: 62.5
      })
    ]);
  });
});
