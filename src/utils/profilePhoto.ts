// Student profile photo: compress on device (max 300px, JPEG 70%) then upload to Cloudinary
// (same unsigned preset the admin app uses). The returned URL is saved via StudentApi.updateProfile.
const CLOUD_NAME = "vosr6w5p";
const UPLOAD_PRESET = "school_erp_files";

const compress = (file: File): Promise<File> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the photo"));
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = () => reject(new Error("This file is not a valid image"));
      img.onload = () => {
        const MAX = 300;
        let { width, height } = img;
        if (width > height) { if (width > MAX) { height *= MAX / width; width = MAX; } }
        else if (height > MAX) { width *= MAX / height; height = MAX; }
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(width); canvas.height = Math.round(height);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (b) => (b ? resolve(new File([b], "photo.jpg", { type: "image/jpeg" })) : reject(new Error("Compression failed"))),
          "image/jpeg", 0.7
        );
      };
      img.src = ev.target!.result as string;
    };
    reader.readAsDataURL(file);
  });

export async function uploadProfilePhoto(file: File): Promise<string> {
  const small = await compress(file);
  const fd = new FormData();
  fd.append("file", small);
  fd.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: fd });
  const data = await res.json();
  if (data.secure_url) return data.secure_url as string;
  throw new Error(data.error?.message || "Upload failed");
}
