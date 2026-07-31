import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ImagesClient from "./images-client";

export default async function ImagesPage() {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  const images = await prisma.generatedImage.findMany({
    where: {
      user: {
        email: session.user.email,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="p-8">
      <h1 className="mb-8 text-3xl font-bold">
        AI Images
      </h1>

      <ImagesClient initialImages={images} />
    </div>
  );
}