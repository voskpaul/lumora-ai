import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function authorizeDevelopmentDiagnostic() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  try {
    const session = await auth();

    if (session?.user?.email) {
      return null;
    }
  } catch {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  );
}
