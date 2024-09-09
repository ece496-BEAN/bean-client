"use client";

import { useState } from "react";

export default function Button() {
  const [imageUrl, setImageUrl] = useState("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>) => {
        setImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <label className="rounded-md px-4 py-2 border border-gray-300 placeholder-gray-400">
        Camera
        <input
          onChange={handleFileChange}
          style={{ display: "none" }}
          type="file"
          accept="image/*"
          capture="environment"
        />
      </label>
      <label className="rounded-md px-4 py-2 border border-gray-300 placeholder-gray-400">
        Upload
        <input
          onChange={handleFileChange}
          style={{ display: "none" }}
          type="file"
          accept="image/*"
        />
      </label>
      {imageUrl && <img src={imageUrl} alt="Uploaded image" />}
    </div>
  );
}
