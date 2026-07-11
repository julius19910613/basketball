import helper from "../miniprogram/utils/activity-helper";

type ValidateActivityFormInput = Parameters<typeof helper.validateActivityForm>[0];
type PrepareActivityForSaveInput = Parameters<typeof helper.prepareActivityForSave>[0];
type PrepareActivityForSaveExtra = Parameters<typeof helper.prepareActivityForSave>[1];

describe("activity helper", () => {
  test("creates default activity form with three teams", () => {
    const form = helper.createEmptyActivity();
    expect(form.ruleType).toBe("ncaa");
    expect(form.formatType).toBe("3team-double-round-robin");
    expect(form.teamNames).toEqual(["白队", "黑队", "红队"]);
    expect(form.groupingSnapshot.teams).toHaveLength(3);
  });

  test("validates core form rules", () => {
    const emptyTitleForm: ValidateActivityFormInput = {
      title: "",
      activityDate: "2026-06-28",
      startTime: "19:00",
      endTime: "22:00",
      teamNames: ["白队", "黑队", "红队"]
    };
    expect(helper.validateActivityForm(emptyTitleForm)).toBe("请输入活动名称");

    const invalidTimeForm: ValidateActivityFormInput = {
      title: "活动",
      activityDate: "2026-06-28",
      startTime: "20:00",
      endTime: "19:00",
      teamNames: ["白队", "黑队", "红队"]
    };
    expect(helper.validateActivityForm(invalidTimeForm)).toBe("结束时间需晚于开始时间");

    const duplicateTeamNamesForm: ValidateActivityFormInput = {
      title: "活动",
      activityDate: "2026-06-28",
      startTime: "19:00",
      endTime: "22:00",
      teamNames: ["白队", "白队", "红队"]
    };
    expect(helper.validateActivityForm(duplicateTeamNamesForm)).toBe("队伍名称不能重复");
  });

  test("prepares payload with normalized team names and grouping snapshot", () => {
    const form: PrepareActivityForSaveInput = {
      title: " 6月底活动 ",
      activityDate: "2026-06-28",
      startTime: "19:00",
      endTime: "22:00",
      location: " 1号场 ",
      teamNames: [" 白队 ", "黑队", " 红队 "],
      registrationDeadline: "2026-06-28 18:00"
    };
    const extraData: PrepareActivityForSaveExtra = { status: "registration_open" };
    const payload = helper.prepareActivityForSave(form, extraData);

    expect(payload.title).toBe("6月底活动");
    expect(payload.location).toBe("1号场");
    expect(payload.teamNames).toEqual(["白队", "黑队", "红队"]);
    expect(payload.groupingSnapshot.teams).toEqual([
      { teamName: "白队", playerIds: [] },
      { teamName: "黑队", playerIds: [] },
      { teamName: "红队", playerIds: [] }
    ]);
    expect(payload.status).toBe("registration_open");
  });

  test("builds and validates three-team grouping snapshots", () => {
    const selectedPlayerIds: string[] = ["p1", "p2", "p3", "p4", "p5", "p6"];
    const groups: string[][] = [["p1", "p2"], ["p3", "p4"], ["p5", "p6"]];
    const snapshot = helper.buildActivityGroupingPayload(
      ["白队", "黑队", "红队"],
      selectedPlayerIds,
      groups,
      2
    );
    expect(snapshot.version).toBe(2);
    expect(snapshot.teams).toHaveLength(3);

    const pass = helper.validateActivityGrouping(selectedPlayerIds, snapshot);
    expect(pass.ok).toBe(true);

    const fail = helper.validateActivityGrouping(["p1", "p2", "p3"], {
      teams: [
        { teamName: "白队", playerIds: ["p1"] },
        { teamName: "黑队", playerIds: ["p1"] },
        { teamName: "红队", playerIds: ["p3"] }
      ]
    });
    expect(fail.ok).toBe(false);
  });

  test("creates six double round robin matches for three teams", () => {
    const schedule = helper.createDoubleRoundRobinSchedule(["白队", "黑队", "红队"]);
    expect(schedule).toEqual([
      { roundIndex: 1, gameIndex: 1, homeTeamName: "白队", awayTeamName: "黑队" },
      { roundIndex: 1, gameIndex: 2, homeTeamName: "白队", awayTeamName: "红队" },
      { roundIndex: 1, gameIndex: 3, homeTeamName: "黑队", awayTeamName: "红队" },
      { roundIndex: 2, gameIndex: 4, homeTeamName: "白队", awayTeamName: "黑队" },
      { roundIndex: 2, gameIndex: 5, homeTeamName: "白队", awayTeamName: "红队" },
      { roundIndex: 2, gameIndex: 6, homeTeamName: "黑队", awayTeamName: "红队" }
    ]);
  });

  test("selects only players from the two teams in each scheduled match", () => {
    const snapshot = {
      teams: [
        { teamName: "白队", playerIds: ["white-1", "white-2"] },
        { teamName: "黑队", playerIds: ["black-1", "black-2"] },
        { teamName: "红队", playerIds: ["red-1", "red-2"] }
      ]
    };
    const grouping = helper.buildMatchGroupingFromActivity(snapshot, "白队", "黑队");

    expect(helper.getGroupingPlayerIds(grouping)).toEqual([
      "white-1",
      "white-2",
      "black-1",
      "black-2"
    ]);
    expect(helper.getGroupingPlayerIds(grouping)).not.toContain("red-1");
  });
});
