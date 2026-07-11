/// <reference path="../../typings/index.d.ts" />

function getTempPreviewUrl(fileId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    wx.cloud.getTempFileURL({
      fileList: [fileId],
      success(res: any) {
        const file = res.fileList && res.fileList[0];
        if (file && "tempFileURL" in file && file.tempFileURL) {
          resolve(file.tempFileURL);
          return;
        }
        reject(new Error("TEMP_URL_MISSING"));
      },
      fail(error) {
        reject(error);
      }
    });
  });
}

export async function resolveAvatarPreviewUrl(url: string): Promise<string> {
  if (!url) {
    throw new Error("EMPTY_AVATAR_URL");
  }
  if (url.indexOf("cloud://") === 0) {
    return getTempPreviewUrl(url);
  }
  return url;
}

export async function previewAvatar(url: string): Promise<void> {
  const previewUrl = await resolveAvatarPreviewUrl(url);
  wx.previewImage({
    current: previewUrl,
    urls: [previewUrl]
  });
}
