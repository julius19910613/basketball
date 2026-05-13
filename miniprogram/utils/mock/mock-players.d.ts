interface MockPlayer {
  _id: string;
  name: string;
  number: number;
  position: string;
  skillLevel: number;
  avatar: string;
  height: number;
  weight: number;
  joinDate: string;
}

declare const mockPlayersModule: {
  mockPlayers: MockPlayer[];
  getLevelDesc(level: number): string;
  getLevelColor(level: number): string;
  getPositionName(position: string): string;
};

export = mockPlayersModule;
