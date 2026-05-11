/// <reference path="../../../typings/index.d.ts" />

import helper = require("../../utils/match-helper");

const FIELDS = [
  "points",
  "rebounds",
  "assists",
  "steals",
  "blocks",
  "turnovers",
  "fouls",
  "shotsMade",
  "shotsAttempted",
  "threePtMade",
  "threePtAttempted",
  "ftMade",
  "ftAttempted"
];

interface PlayerLike {
  _id?: string;
  [key: string]: any;
}

interface PlayerStatInputData {
  statsMap: Record<string, any>;
  selectedIds: string[];
}

Component({
  properties: {
    players: { type: Array, value: [] },
    value: { type: Array, value: [] }
  },
  data: {
    statsMap: {},
    selectedIds: []
  } as PlayerStatInputData,
  observers: {
    value() {
      this.initData();
    },
    players() {
      this.initData();
    }
  },
  lifetimes: {
    attached() {
      this.initData();
    }
  },
  methods: {
    initData(this: WechatMiniprogram.Component.TrivialInstance & { data: PlayerStatInputData; properties: { players: PlayerLike[]; value: any[] } }) {
      const map: Record<string, any> = {};
      const selected: string[] = [];
      (this.properties.players || []).forEach((player: PlayerLike) => {
        map[player._id || ""] = helper.createEmptyPlayerStat(player);
      });
      (this.properties.value || []).forEach((item: any) => {
        if (!item || !item.playerId) return;
        map[item.playerId] = Object.assign({}, map[item.playerId] || {}, item);
        if (item.played) selected.push(item.playerId);
      });
      this.setData({ statsMap: map, selectedIds: selected });
      this.emitChange();
    },

    onTogglePlayer(this: WechatMiniprogram.Component.TrivialInstance & { data: PlayerStatInputData }, e: any) {
      const playerId = e.currentTarget.dataset.playerId;
      const checked = Boolean(e.detail.value);
      const selected = this.data.selectedIds.slice();
      const idx = selected.indexOf(playerId);
      if (checked && idx === -1) selected.push(playerId);
      if (!checked && idx >= 0) selected.splice(idx, 1);
      this.setData({
        selectedIds: selected,
        [`statsMap.${playerId}.played`]: checked
      });
      this.emitChange();
    },

    onStatInput(this: WechatMiniprogram.Component.TrivialInstance & { data: PlayerStatInputData }, e: any) {
      const playerId = e.currentTarget.dataset.playerId;
      const field = e.currentTarget.dataset.field;
      const value = Number(e.detail.value || 0);
      if (FIELDS.indexOf(field) < 0) return;
      this.setData({ [`statsMap.${playerId}.${field}`]: value });
      this.emitChange();
    },

    emitChange(this: WechatMiniprogram.Component.TrivialInstance & { data: PlayerStatInputData }) {
      const list = Object.keys(this.data.statsMap).map((id) => {
        const item = Object.assign({}, this.data.statsMap[id]);
        item.fgPct = helper.calcFgPct(item.shotsMade, item.shotsAttempted);
        item.threePtPct = helper.calcFgPct(item.threePtMade, item.threePtAttempted);
        item.ftPct = helper.calcFgPct(item.ftMade, item.ftAttempted);
        return item;
      });
      const totalPoints = helper.calcTeamPoints(list);
      this.triggerEvent("change", { value: list, totalPoints: totalPoints });
    }
  }
});
