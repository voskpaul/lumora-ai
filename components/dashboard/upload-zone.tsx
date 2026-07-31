"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";

export default function UploadZone() {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } =
    useDropzone({
      onDrop,
      accept: {
        "video/*": [],
      },
    });

  return (
    <div
      {...getRootProps()}
      className={`glass rounded-3xl border-2 border-dashed p-14 text-center cursor-pointer transition
      ${
        isDragActive
          ? "border-cyan-400 bg-cyan-500/10"
          : "border-white/10"
      }`}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center">
        <div className="w-20 h-20 rounded-full glass flex items-center justify-center mb-6">
          <UploadCloud size={40} />
        </div>

        <h2 className="text-2xl font-bold mb-2">
          Upload Your Video
        </h2>

        <p className="text-gray-400 max-w-md">
          Drag and drop your long-form content here.
          ClipWizard AI will generate viral short clips automatically.
        </p>
      </div>
    </div>
  );
}