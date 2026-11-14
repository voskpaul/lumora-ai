import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  type Row = Record<string, unknown>;

  const state = {
    currentEmail: null as string | null,
    users: [] as Row[],
    projects: [] as Row[],
    videos: [] as Row[],
    images: [] as Row[],
    scenes: [] as Row[],
    nextId: 1,
  };

  const matches = (record: Row, where?: Row): boolean => {
    if (!where) return true;

    return Object.entries(where).every(([key, condition]) => {
      if (key === "OR") {
        return (condition as Row[]).some((clause) => matches(record, clause));
      }

      if (key === "AND") {
        return (condition as Row[]).every((clause) => matches(record, clause));
      }

      if (key === "user") {
        const owner = state.users.find((user) => user.id === record.userId);
        return owner ? matches(owner, condition as Row) : false;
      }

      const value = record[key];
      if (condition && typeof condition === "object" && !Array.isArray(condition) && !(condition instanceof Date)) {
        const filter = condition as Row;
        if ("not" in filter) return value !== filter.not;
        if ("in" in filter) return (filter.in as unknown[]).includes(value);
        if ("gte" in filter) return value instanceof Date && filter.gte instanceof Date && value >= filter.gte;
      }

      return value === condition;
    });
  };

  const prisma = {
    user: {
      findUnique: vi.fn(async ({ where }: { where: Row }) => {
        const user = state.users.find((row) => matches(row, where));
        return user ? { ...user } : null;
      }),
    },
    project: {
      findMany: vi.fn(async ({ where }: { where?: Row }) =>
        state.projects.filter((row) => matches(row, where)).map((row) => ({ ...row })),
      ),
      findFirst: vi.fn(async ({ where, include }: { where?: Row; include?: Row }) => {
        const project = state.projects.find((row) => matches(row, where));
        if (!project) return null;
        const videoInclude = include?.videos as Row | undefined;
        if (!videoInclude) return { ...project };
        return {
          ...project,
          videos: state.videos
            .filter((video) => video.projectId === project.id && matches(video, videoInclude.where as Row | undefined))
            .map((video) => ({ ...video })),
        };
      }),
      create: vi.fn(async ({ data }: { data: Row }) => {
        const project = {
          ...data,
          id: `project-created-${state.nextId++}`,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
        };
        state.projects.push(project);
        return { ...project };
      }),
      deleteMany: vi.fn(async ({ where }: { where?: Row }) => {
        const deleted = state.projects.filter((row) => matches(row, where));
        state.projects = state.projects.filter((row) => !matches(row, where));
        for (const project of deleted) {
          for (const video of state.videos) {
            if (video.projectId === project.id) video.projectId = null;
          }
        }
        return { count: deleted.length };
      }),
    },
    video: {
      findMany: vi.fn(async ({ where }: { where?: Row }) =>
        state.videos.filter((row) => matches(row, where)).map((row) => ({ ...row })),
      ),
      findFirst: vi.fn(async ({ where }: { where?: Row }) => {
        const video = state.videos.find((row) => matches(row, where));
        return video ? { ...video } : null;
      }),
      count: vi.fn(async ({ where }: { where?: Row }) =>
        state.videos.filter((row) => matches(row, where)).length,
      ),
      create: vi.fn(async ({ data }: { data: Row }) => {
        const video = {
          ...data,
          id: `video-created-${state.nextId++}`,
          projectId: data.projectId ?? null,
          createdAt: new Date(),
        };
        state.videos.push(video);
        return { ...video };
      }),
      delete: vi.fn(async ({ where }: { where: Row }) => {
        const video = state.videos.find((row) => matches(row, where));
        if (!video) throw new Error("Record not found");
        state.videos = state.videos.filter((row) => row.id !== video.id);
        state.scenes = state.scenes.filter((row) => row.videoId !== video.id);
        state.images = state.images.filter((row) => row.videoId !== video.id);
        return { ...video };
      }),
      update: vi.fn(async ({ where, data }: { where: Row; data: Row }) => {
        const video = state.videos.find((row) => matches(row, where));
        if (!video) throw new Error("Record not found");
        Object.assign(video, data);
        return { ...video };
      }),
    },
    generatedImage: {
      findMany: vi.fn(async ({ where }: { where?: Row }) =>
        state.images.filter((row) => matches(row, where)).map((row) => ({ ...row })),
      ),
      findFirst: vi.fn(async ({ where }: { where?: Row }) => {
        const image = state.images.find((row) => matches(row, where));
        return image ? { ...image } : null;
      }),
      create: vi.fn(async ({ data }: { data: Row }) => {
        const image = {
          ...data,
          id: `image-created-${state.nextId++}`,
          createdAt: new Date(),
        };
        state.images.push(image);
        return { ...image };
      }),
      deleteMany: vi.fn(async ({ where }: { where?: Row }) => {
        const deleted = state.images.filter((row) => matches(row, where));
        state.images = state.images.filter((row) => !matches(row, where));
        return { count: deleted.length };
      }),
      count: vi.fn(async ({ where }: { where?: Row }) =>
        state.images.filter((row) => matches(row, where)).length,
      ),
    },
    scene: {
      findMany: vi.fn(async ({ where }: { where?: Row }) =>
        state.scenes.filter((row) => matches(row, where)).map((row) => ({ ...row })),
      ),
      createMany: vi.fn(async ({ data }: { data: Row[] }) => {
        const scenes = data.map((row) => ({ ...row, id: `scene-created-${state.nextId++}` }));
        state.scenes.push(...scenes);
        return { count: scenes.length };
      }),
      deleteMany: vi.fn(async ({ where }: { where?: Row }) => {
        const deleted = state.scenes.filter((row) => matches(row, where));
        state.scenes = state.scenes.filter((row) => !matches(row, where));
        for (const scene of deleted) {
          for (const image of state.images) {
            if (image.sceneId === scene.id) image.sceneId = null;
          }
        }
        return { count: deleted.length };
      }),
    },
    subscription: {
      update: vi.fn(async () => ({})),
    },
    $transaction: vi.fn(async (operation: (tx: unknown) => unknown) => operation(prisma)),
  };

  const auth = vi.fn();

  return { state, prisma, auth };
});

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("next/navigation", () => ({
  redirect: (destination: string) => {
    throw new Error(`NEXT_REDIRECT:${destination}`);
  },
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import { GET as listProjects, POST as createProject } from "../../app/api/projects/route";
import { DELETE as deleteProject } from "../../app/api/projects/[id]/route";
import { POST as generateImage } from "../../app/api/images/generate/route";
import { DELETE as deleteImage } from "../../app/api/images/[id]/route";
import { GET as listVideos, POST as createVideo } from "../../app/api/videos/route";
import { POST as generateVideo } from "../../app/api/generate-video/route";
import { POST as generateScript } from "../../app/api/videos/generate-script/route";
import { DELETE as deleteVideo } from "../../app/api/videos/[videoId]/route";
import { GET as getScenes, PUT as saveScenes } from "../../app/api/videos/[videoId]/scenes/route";
import ProjectPage from "../../app/dashboard/projects/[id]/page";

const date = new Date("2025-01-01T00:00:00.000Z");

function resetFixtures() {
  Object.assign(mocks.state, {
    currentEmail: "user-a@example.test",
    users: [
      { id: "user-a", email: "user-a@example.test", subscriptions: null },
      { id: "user-b", email: "user-b@example.test", subscriptions: null },
    ],
    projects: [
      { id: "project-a", title: "A project", description: null, userId: "user-a", createdAt: date },
      { id: "project-b", title: "B project", description: null, userId: "user-b", createdAt: date },
    ],
    videos: [
      { id: "video-a", title: "A title", prompt: "A prompt", script: "A private script", status: "draft", userId: "user-a", projectId: "project-a", createdAt: date },
      { id: "video-b", title: "B title", prompt: "B prompt", script: "B private script", status: "draft", userId: "user-b", projectId: "project-b", createdAt: date },
    ],
    images: [
      { id: "image-a", prompt: "A image prompt", imageUrl: "/images/a.jpg", userId: "user-a", videoId: "video-a", sceneId: "scene-a", createdAt: date },
      { id: "image-b", prompt: "B image prompt", imageUrl: "/images/b.jpg", userId: "user-b", videoId: "video-b", sceneId: "scene-b", createdAt: date },
    ],
    scenes: [
      { id: "scene-a", order: 0, text: "A scene", imagePrompt: "A scene prompt", duration: 5, videoId: "video-a", createdAt: date },
      { id: "scene-b", order: 0, text: "B scene", imagePrompt: "B scene prompt", duration: 5, videoId: "video-b", createdAt: date },
    ],
    nextId: 1,
  });

  mocks.auth.mockImplementation(async () => {
    const user = mocks.state.users.find((row) => row.email === mocks.state.currentEmail);
    return user ? { user: { id: user.id, email: user.email } } : null;
  });
}

function jsonRequest(body: unknown, method = "POST") {
  return new Request("http://localhost/api/test", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function malformedRequest(method = "POST") {
  return new Request("http://localhost/api/test", {
    method,
    headers: { "content-type": "application/json" },
    body: "{",
  });
}

function routeContext<T extends Record<string, string>>(params: T) {
  return { params: Promise.resolve(params) };
}

async function responseBody(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

beforeEach(() => {
  vi.clearAllMocks();
  resetFixtures();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("project ownership", () => {
  it("lists projects only for the authenticated user", async () => {
    const response = await listProjects();
    const projects = await response.json();

    expect(response.status).toBe(200);
    expect(projects.map((project: { id: string }) => project.id)).toEqual(["project-a"]);
  });

  it("allows each owner to read their project and hides cross-linked foreign videos", async () => {
    mocks.state.videos.find((video) => video.id === "video-b")!.projectId = "project-a";

    const ownPage = await ProjectPage({ params: Promise.resolve({ id: "project-a" }) });
    const ownMarkup = renderToStaticMarkup(ownPage);
    expect(ownMarkup).toContain("A project");
    expect(ownMarkup).toContain("A private script");
    expect(ownMarkup).not.toContain("B private script");

    mocks.state.currentEmail = "user-b@example.test";
    const otherOwnerPage = await ProjectPage({ params: Promise.resolve({ id: "project-b" }) });
    expect(renderToStaticMarkup(otherOwnerPage)).toContain("B project");

    mocks.state.currentEmail = "user-a@example.test";
    await expect(
      ProjectPage({ params: Promise.resolve({ id: "project-b" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("creates and deletes the caller's project while ignoring client-supplied ownership", async () => {
    const created = await createProject(jsonRequest({
      title: "  New project  ",
      description: "A test project",
      userId: "user-b",
    }));
    const createdBody = await responseBody(created);

    expect(created.status).toBe(200);
    expect(createdBody.userId).toBe("user-a");
    expect(createdBody.title).toBe("New project");

    const createdId = String(createdBody.id);
    const listed = await listProjects();
    const listedProjects = await listed.json();
    expect(listedProjects.some((project: { id: string }) => project.id === createdId)).toBe(true);

    const removed = await deleteProject(new Request("http://localhost"), routeContext({ id: createdId }));
    expect(removed.status).toBe(200);
    expect(mocks.state.projects.some((project) => project.id === createdId)).toBe(false);
  });

  it("rejects cross-user deletes and preserves projects and linked videos", async () => {
    const crossUser = await deleteProject(new Request("http://localhost"), routeContext({ id: "project-b" }));
    expect(crossUser.status).toBe(404);
    expect(mocks.state.projects.some((project) => project.id === "project-b")).toBe(true);

    mocks.state.videos.find((video) => video.id === "video-b")!.projectId = "project-a";
    const protectedLink = await deleteProject(new Request("http://localhost"), routeContext({ id: "project-a" }));
    expect(protectedLink.status).toBe(409);
    expect(mocks.state.projects.some((project) => project.id === "project-a")).toBe(true);
    expect(mocks.state.videos.find((video) => video.id === "video-b")?.projectId).toBe("project-a");
  });

  it("rejects malformed bodies, missing IDs, and unknown projects without mutation", async () => {
    expect((await createProject(malformedRequest())).status).toBe(400);
    expect((await createProject(jsonRequest({ description: "no title" }))).status).toBe(400);
    expect((await deleteProject(new Request("http://localhost"), routeContext({ id: " " }))).status).toBe(400);
    expect((await deleteProject(new Request("http://localhost"), routeContext({ id: "missing" }))).status).toBe(404);
    expect(mocks.state.projects).toHaveLength(2);
  });
});

describe("image ownership", () => {
  it("creates an image for the session owner and allows that owner to delete it", async () => {
    const response = await generateImage(jsonRequest({ prompt: "a safe test image", userId: "user-b" }));
    const body = await responseBody(response);
    const image = body.image as { id: string; userId: string };

    expect(response.status).toBe(200);
    expect(image.userId).toBe("user-a");

    const deletion = await deleteImage(new Request("http://localhost"), routeContext({ id: image.id }));
    expect(deletion.status).toBe(200);
    expect(mocks.state.images.some((row) => row.id === image.id)).toBe(false);
  });

  it("rejects cross-user image deletion without changing the record", async () => {
    const response = await deleteImage(new Request("http://localhost"), routeContext({ id: "image-b" }));

    expect(response.status).toBe(404);
    expect(mocks.state.images.find((image) => image.id === "image-b")).toMatchObject({
      userId: "user-b",
      imageUrl: "/images/b.jpg",
    });
  });

  it("rejects malformed generation input and missing image IDs", async () => {
    expect((await generateImage(malformedRequest())).status).toBe(400);
    expect((await generateImage(jsonRequest({ prompt: " " }))).status).toBe(400);
    expect((await deleteImage(new Request("http://localhost"), routeContext({ id: "" }))).status).toBe(400);
    expect((await deleteImage(new Request("http://localhost"), routeContext({ id: "missing" }))).status).toBe(404);
    expect(mocks.state.images).toHaveLength(2);
  });
});

describe("video and nested resource ownership", () => {
  it("lists only the authenticated user's videos and ignores supplied user IDs on create", async () => {
    const listed = await listVideos();
    const videos = await listed.json();
    expect(listed.status).toBe(200);
    expect(videos.map((video: { id: string }) => video.id)).toEqual(["video-a"]);

    const created = await createVideo(jsonRequest({
      title: "A new title",
      prompt: "A new prompt",
      script: "A new script",
      userId: "user-b",
    }));
    const createdVideo = await responseBody(created);
    expect(created.status).toBe(200);
    expect(createdVideo.userId).toBe("user-a");
  });

  it("rejects malformed requests and invalid project IDs before writes", async () => {
    expect((await createVideo(malformedRequest())).status).toBe(400);
    expect((await generateScript(malformedRequest())).status).toBe(400);
    expect((await generateVideo(jsonRequest({ prompt: "test", projectId: { id: "project-a" } }))).status).toBe(400);
    expect(mocks.state.videos).toHaveLength(2);
    expect(mocks.state.scenes).toHaveLength(2);
  });

  it("rejects a foreign projectId in both video-creation workflows", async () => {
    const generated = await generateVideo(jsonRequest({ prompt: "test prompt", projectId: "project-b" }));
    const scripted = await generateScript(jsonRequest({ prompt: "test prompt", projectId: "project-b" }));

    expect(generated.status).toBe(404);
    expect(scripted.status).toBe(404);
    expect(mocks.state.videos).toHaveLength(2);
    expect(mocks.state.scenes).toHaveLength(2);
  });

  it("allows video creation against the caller's project", async () => {
    const generated = await generateVideo(jsonRequest({ prompt: "generated for A", projectId: "project-a" }));
    const scripted = await generateScript(jsonRequest({ prompt: "script for A", projectId: "project-a" }));

    expect(generated.status).toBe(201);
    expect(scripted.status).toBe(200);
    expect(mocks.state.videos).toHaveLength(4);
    expect(mocks.state.videos.slice(2).every((video) => video.userId === "user-a" && video.projectId === "project-a")).toBe(true);
  });

  it("returns only the video owner's images from scene reads", async () => {
    mocks.state.images.push({
      id: "cross-linked-image",
      prompt: "must remain private",
      imageUrl: "/images/private.jpg",
      userId: "user-b",
      videoId: "video-a",
      sceneId: "scene-a",
      createdAt: date,
    });

    const response = await getScenes(new Request("http://localhost"), routeContext({ videoId: "video-a" }));
    const body = await responseBody(response);
    const scenes = body.scenes as Array<{ generatedImage: { id: string } | null }>;

    expect(response.status).toBe(200);
    expect(scenes[0].generatedImage?.id).toBe("image-a");
    expect(JSON.stringify(body)).not.toContain("cross-linked-image");
    expect(JSON.stringify(body)).not.toContain("must remain private");
  });

  it("blocks scene edits when a linked image belongs to another account", async () => {
    mocks.state.images.push({
      id: "cross-linked-image",
      prompt: "B image",
      imageUrl: "/images/private.jpg",
      userId: "user-b",
      videoId: "video-a",
      sceneId: "scene-a",
      createdAt: date,
    });

    const response = await saveScenes(jsonRequest({
      scenes: [{ id: "scene-a", text: "edited", imagePrompt: "edited", duration: 5 }],
    }, "PUT"), routeContext({ videoId: "video-a" }));

    expect(response.status).toBe(409);
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
    expect(mocks.state.images.find((image) => image.id === "cross-linked-image")?.sceneId).toBe("scene-a");
  });

  it("rejects cross-user video deletion and preserves foreign linked images", async () => {
    const crossUser = await deleteVideo(new Request("http://localhost"), routeContext({ videoId: "video-b" }));
    expect(crossUser.status).toBe(404);
    expect(mocks.state.videos.some((video) => video.id === "video-b")).toBe(true);

    mocks.state.images.push({
      id: "cross-linked-image",
      prompt: "B image",
      imageUrl: "/images/private.jpg",
      userId: "user-b",
      videoId: "video-a",
      sceneId: "scene-a",
      createdAt: date,
    });
    const protectedDelete = await deleteVideo(new Request("http://localhost"), routeContext({ videoId: "video-a" }));

    expect(protectedDelete.status).toBe(409);
    expect(mocks.state.videos.some((video) => video.id === "video-a")).toBe(true);
    expect(mocks.state.images.find((image) => image.id === "cross-linked-image")?.sceneId).toBe("scene-a");
    expect(mocks.prisma.scene.deleteMany).not.toHaveBeenCalled();
  });
});

describe("authentication and error behavior", () => {
  it("returns 401 from protected project, image, video, and nested-video APIs", async () => {
    mocks.state.currentEmail = null;
    const cases = [
      listProjects(),
      createProject(jsonRequest({ title: "x" })),
      deleteProject(new Request("http://localhost"), routeContext({ id: "project-a" })),
      generateImage(jsonRequest({ prompt: "x" })),
      deleteImage(new Request("http://localhost"), routeContext({ id: "image-a" })),
      listVideos(),
      createVideo(jsonRequest({ title: "x", prompt: "x" })),
      generateVideo(jsonRequest({ prompt: "x" })),
      generateScript(jsonRequest({ prompt: "x" })),
      getScenes(new Request("http://localhost"), routeContext({ videoId: "video-a" })),
    ];

    const responses = await Promise.all(cases);
    expect(responses.map((response) => response.status)).toEqual(Array(10).fill(401));
  });

  it("does not include internal errors or filesystem paths in script-generation responses", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.prisma.user.findUnique.mockRejectedValueOnce(new Error("/srv/private/database-record"));

    const response = await generateScript(jsonRequest({ prompt: "safe test" }));
    const body = await responseBody(response);

    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to generate script");
    expect(JSON.stringify(body)).not.toContain("/srv/private");
    log.mockRestore();
  });
});
