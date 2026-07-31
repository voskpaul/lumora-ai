"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface ImageItem {
  id: string;
  prompt: string;
  imageUrl: string;
}

export default function ImagesClient({
  initialImages,
}: {
  initialImages: ImageItem[];
}) {
  const [images, setImages] = useState<ImageItem[]>(
    (initialImages || []).filter(
      (img) => img?.id && img?.imageUrl
    )
  );

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast.error("Enter an image prompt");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        "/api/images/generate",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            prompt,
          }),
        }
      );

      const responseText =
        await res.text();

      console.log(
        "RAW API RESPONSE:",
        responseText
      );

      let data: any = {};

      try {
        data = JSON.parse(
          responseText
        );
      } catch (e) {
        console.error(
          "Response is not JSON:",
          responseText
        );
      }

      if (!res.ok) {
        console.error(
          "API ERROR:",
          data
        );

        throw new Error(
          data?.error ||
            "Generation failed"
        );
      }

      if (!data?.image) {
        throw new Error(
          "No image returned from API"
        );
      }

      setImages((prev) => [
        data.image,
        ...prev,
      ]);

      setPrompt("");

      toast.success(
        "Image generated successfully"
      );
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate image"
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (
    id: string
  ) => {
    try {
      await fetch(`/api/images/${id}`, {
        method: "DELETE",
      });

      setImages((prev) =>
        prev.filter(
          (img) => img.id !== id
        )
      );

      toast.success(
        "Image deleted"
      );
    } catch {
      toast.error(
        "Delete failed"
      );
    }
  };

  const validImages =
    images.filter(
      (image) =>
        image &&
        image.id &&
        image.imageUrl
    );

  return (
    <>
      <div className="mb-8 flex gap-3">
        <input
          value={prompt}
          onChange={(e) =>
            setPrompt(e.target.value)
          }
          placeholder="Describe an image..."
          className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-3"
        />

        <button
          onClick={generateImage}
          disabled={loading}
          className="rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-500 px-6 py-3 font-medium disabled:opacity-50"
        >
          {loading
            ? "Generating..."
            : "Generate"}
        </button>
      </div>

      {validImages.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center text-white/60">
          No images generated yet
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {validImages.map(
            (image, index) => (
              <div
                key={
                  image.id ||
                  `image-${index}`
                }
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/5"
              >
                <img
                  src={image.imageUrl}
                  alt={
                    image.prompt ||
                    "Generated image"
                  }
                  className="h-64 w-full object-cover"
                />

                <div className="p-4">
                  <p className="line-clamp-3 text-sm text-white/70">
                    {image.prompt ||
                      "No prompt available"}
                  </p>

                  <div className="mt-4 flex gap-2">
                    <a
                      href={
                        image.imageUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-cyan-500 px-4 py-2 text-sm text-cyan-400"
                    >
                      View
                    </a>

                    <button
                      onClick={() =>
                        deleteImage(
                          image.id
                        )
                      }
                      className="rounded-xl border border-red-500 px-4 py-2 text-sm text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </>
  );
}