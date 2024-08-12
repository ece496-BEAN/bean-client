"use client";
import React, { useRef, useCallback, useState } from "react";
import Webcam from "react-webcam";

export const WebcamCapture = () => {
  const webcamRef = useRef<Webcam>(null);
  const [imageSrc, setImageSrc] = useState<string | null>();
  const [facingMode, setFacingMode] = useState<string>("user");
  const [mirrored, setMirrored] = useState<boolean>(false);

  const toggleFacingMode = () => {
    setFacingMode((prevFacingMode) =>
      prevFacingMode === "user" ? "environment" : "user",
    );
  };
  const toggleMirrored = () => {
    setMirrored((prevMirrored) => !prevMirrored);
  };

  const capture = () => {
    const base64Image = webcamRef.current?.getScreenshot();
    setImageSrc(base64Image);
    console.log(base64Image);
  };

  return (
    <div>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/png"
        mirrored={mirrored}
        videoConstraints={{ facingMode }}
        screenshotQuality={1}
      />
      <button
        onClick={capture}
        className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
      >
        Capture photo
      </button>
      <button
        onClick={toggleFacingMode}
        className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
      >
        Toggle Camera
      </button>
      <button
        onClick={toggleMirrored}
        className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
      >
        Mirror Image
      </button>
      <h1>Captured Image</h1>
      {imageSrc && (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageSrc} alt="Captured Webcam Screenshot" />
          <button
            onClick={() => setImageSrc(null)}
            className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
          >
            Remove Image
          </button>
        </div>
      )}
    </div>
  );
};
