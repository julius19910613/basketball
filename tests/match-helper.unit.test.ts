import helper = require("../miniprogram/utils/match-helper");

type PrepareMatchForSaveInput = Parameters<typeof helper.prepareMatchForSave>[0];

describe("match-helper", () => {
  test("calcFgPct handles divide-by-zero", () => {
    expect(helper.calcFgPct(0, 0)).toBe(0);
    expect(helper.calcFgPct(7, 10)).toBe(70);
  });

  test("prepareMatchForSave calculates result and percentages", () => {
    const matchData: PrepareMatchForSaveInput = {
      scoreUs: 68,
      scoreOpponent: 55,
      quarters: [{ quarter: 1, scoreUs: 18, scoreOpponent: 12 }],
      playerStats: [
        {
          playerId: "p1",
          nickname: "A",
          position: "PG",
          played: true,
          points: 20,
          rebounds: 3,
          assists: 5,
          steals: 1,
          blocks: 0,
          turnovers: 2,
          fouls: 2,
          shotsMade: 8,
          shotsAttempted: 12,
          threePtMade: 2,
          threePtAttempted: 6,
          ftMade: 2,
          ftAttempted: 4
        }
      ]
    };
    const payload = helper.prepareMatchForSave(matchData);

    expect(payload.result).toBe("win");
    expect(payload.playerStats?.[0].fgPct).toBe(66.7);
    expect(payload.playerStats?.[0].threePtPct).toBe(33.3);
    expect(payload.playerStats?.[0].ftPct).toBe(50);
  });
});
