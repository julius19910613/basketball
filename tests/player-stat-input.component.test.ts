/**
 * @jest-environment jsdom
 */

import * as path from "path";
import * as simulate from "miniprogram-simulate";

interface PlayerSummary {
  _id: string;
  nickname: string;
  position: string;
}

interface PlayerStatValue {
  playerId: string;
  nickname: string;
  position: string;
  played: boolean;
  points: number;
  shotsMade?: number;
  shotsAttempted?: number;
  fgPct?: number;
}

interface ToggleEvent {
  currentTarget: {
    dataset: {
      playerId: string;
    };
  };
  detail: {
    value: boolean;
  };
}

interface StatInputEvent {
  currentTarget: {
    dataset: {
      playerId: string;
      field: string;
    };
  };
  detail: {
    value: number;
  };
}

interface ChangeDetail {
  totalPoints: number;
  value: PlayerStatValue[];
}

interface RenderedComponent {
  data: {
    selectedIds: string[];
    statsMap: Record<string, PlayerStatValue>;
  };
  instance: {
    emitChange(): void;
    onTogglePlayer(event: ToggleEvent): void;
    onStatInput(event: StatInputEvent): void;
  };
  attach(node: unknown): void;
  addEventListener(type: "change", listener: (event: { detail: ChangeDetail }) => void): void;
}

const componentPath = path.resolve(__dirname, "../miniprogram/components/player-stat-input/player-stat-input");

function renderComponent(
  componentId: string,
  properties: { players?: PlayerSummary[]; value?: PlayerStatValue[] } = {}
): RenderedComponent {
  const comp = simulate.render(componentId, properties) as RenderedComponent;
  const globalContext = global as typeof globalThis & {
    document: {
      createElement: (tagName: string) => unknown;
    };
  };
  comp.attach(globalContext.document.createElement("div"));
  return comp;
}

describe("player-stat-input component", () => {
  let componentId = "";

  beforeAll((): void => {
    componentId = simulate.load(componentPath, { compiler: "simulate" });
  });

  test("initializes played players and emits team points", () => {
    const players: PlayerSummary[] = [
      { _id: "p1", nickname: "A", position: "PG" },
      { _id: "p2", nickname: "B", position: "SG" }
    ];
    const value: PlayerStatValue[] = [
      { playerId: "p1", nickname: "A", position: "PG", played: true, points: 12 },
      { playerId: "p2", nickname: "B", position: "SG", played: false, points: 8 }
    ];

    const comp = renderComponent(componentId, { players, value });

    expect(comp.data.selectedIds).toEqual(["p1"]);
    expect(comp.data.statsMap.p1.played).toBe(true);
    expect(comp.data.statsMap.p2.played).toBe(false);

    const changes: ChangeDetail[] = [];
    comp.addEventListener("change", (evt): void => {
      changes.push(evt.detail);
    });
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
    const players: PlayerSummary[] = [{ _id: "p1", nickname: "A", position: "PG" }];
    const comp = renderComponent(componentId, { players, value: [] });

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

    const changes: ChangeDetail[] = [];
    comp.addEventListener("change", (evt): void => {
      changes.push(evt.detail);
    });
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

export {};
