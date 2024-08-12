"use client";
import React, { useRef, useState } from "react";

export const ImageUpload: React.FC = () => {
  const [image, setImage] = useState<string | null>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();

      reader.onloadend = () => {
        // Should be fine to assert as string since `result` from a `readAsDataURL` call is always a string
        // Source: https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL
        setImage(reader.result as string);
      };

      reader.readAsDataURL(file);
    }
  };
  const resetFileInput = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setImage(null);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
      />
      {image && (
        <div>
          <h3>Uploaded Image:</h3>
          <img src={image} alt="test" />
          <button
            onClick={resetFileInput}
            className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
          >
            Remove Image
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
