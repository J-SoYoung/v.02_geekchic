// ⭕클라우디너리에 이미 이미지가 있는 경우 그 데이터를 가져오는 것도 가능한가?
// 프로필 이미지
export async function uploadCloudImage(file: File): Promise<string> {
  const data = new FormData();
  data.append('file', file);
  data.append('upload_preset', 'thdud_preset');
  
  const cloudName = import.meta.env.VITE_APP_ClOUDINARY_NAME;
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
    {
      method: 'POST',
      body: data,
    },
  );
  const json = await res.json();
  return json.secure_url;
}

// 이미지 배열
export async function uploadCloudImagesArray(files: File[]): Promise<string[]> {
  console.log(files);
  const uploadPromise = files.map(async (file) => {
    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', 'thdud_preset');

    const cloudName = import.meta.env.VITE_APP_ClOUDINARY_NAME;
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
      {
        method: 'POST',
        body: data,
      },
    );
    const json = await res.json();
    return json.secure_url;
  });

  const uploadedUrls = await Promise.all(uploadPromise);
  return uploadedUrls;
}
