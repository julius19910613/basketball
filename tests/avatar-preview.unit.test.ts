import { previewAvatar, resolveAvatarPreviewUrl } from "../miniprogram/utils/avatar-preview";

type WxWithMocks = WechatMiniprogram.Wx & {
  previewImage: jest.Mock;
  cloud: {
    getTempFileURL: jest.Mock;
  };
};

describe("avatar preview helper", () => {
  let wxMock: WxWithMocks;

  beforeEach(() => {
    const testGlobal = globalThis as typeof globalThis & { wx?: WxWithMocks };
    if (!testGlobal.wx) {
      testGlobal.wx = {} as WxWithMocks;
    }
    wxMock = testGlobal.wx;
    wxMock.previewImage = jest.fn();
    wxMock.cloud = {
      getTempFileURL: jest.fn()
    } as WxWithMocks["cloud"];
  });

  test("returns plain avatar url directly", async () => {
    await expect(resolveAvatarPreviewUrl("https://example.com/avatar.jpg")).resolves.toBe(
      "https://example.com/avatar.jpg"
    );
    expect(wxMock.cloud.getTempFileURL).not.toHaveBeenCalled();
  });

  test("resolves cloud file ids before previewing", async () => {
    wxMock.cloud.getTempFileURL.mockImplementation(({ success }: { success: (res: any) => void }) => {
      success({
        fileList: [{ tempFileURL: "https://temp.cdn/avatar.jpg" }]
      });
    });

    await previewAvatar("cloud://env.bucket/avatar.jpg");

    expect(wxMock.cloud.getTempFileURL).toHaveBeenCalledWith(
      expect.objectContaining({
        fileList: ["cloud://env.bucket/avatar.jpg"]
      })
    );
    expect(wxMock.previewImage).toHaveBeenCalledWith({
      current: "https://temp.cdn/avatar.jpg",
      urls: ["https://temp.cdn/avatar.jpg"]
    });
  });
});
