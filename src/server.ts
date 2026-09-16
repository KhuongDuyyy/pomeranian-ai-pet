import { createServer, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { Pet } from "./pet/pet.js";
import { loadState, saveState } from "./pet/persistence.js";
import { commandSchema, PetService } from "./webApi.js";

function json(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}
export function createPetServer(service: PetService, publicDir: string) {
  const timer = setInterval(() => {
    void service
      .pulse()
      .catch((error) => console.error("Autonomy save failed:", error));
  }, 1000);
  timer.unref();
  const server = createServer(async (request, response) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'",
    );
    const host = request.headers.host ?? "";
    const expectedHost = `127.0.0.1:${(request.socket.address() as { port?: number }).port}`;
    if (
      host !== expectedHost &&
      host !== expectedHost.replace("127.0.0.1", "localhost")
    ) {
      json(response, 403, { error: "Địa chỉ truy cập không hợp lệ." });
      return;
    }
    if (request.headers.origin && request.headers.origin !== `http://${host}`) {
      json(response, 403, {
        error: "Chỉ nhận thao tác từ giao diện cùng địa chỉ.",
      });
      return;
    }
    try {
      const pathname = new URL(request.url ?? "/", `http://${host}`).pathname;
      if (pathname === "/api/pet" && request.method === "GET") {
        json(response, 200, service.read());
        return;
      }
      if (pathname === "/api/command" && request.method === "POST") {
        if (!request.headers["content-type"]?.startsWith("application/json")) {
          json(response, 415, { error: "Cần dữ liệu JSON." });
          return;
        }
        let body = "";
        for await (const part of request) {
          body += String(part);
          if (Buffer.byteLength(body) > 4096) {
            json(response, 413, { error: "Yêu cầu quá dài." });
            return;
          }
        }
        let parsed: unknown;
        try {
          parsed = JSON.parse(body);
        } catch {
          json(response, 400, { error: "JSON không hợp lệ." });
          return;
        }
        const command = commandSchema.safeParse(parsed);
        if (!command.success) {
          json(response, 400, {
            error: "Thao tác không hợp lệ. Tên pet cần từ 1 đến 30 ký tự.",
          });
          return;
        }
        try {
          json(response, 200, await service.command(command.data));
        } catch (error) {
          const unavailable =
            error instanceof Error && error.message.startsWith("Action ");
          if (!unavailable) console.error("Unable to save pet state:", error);
          json(response, unavailable ? 409 : 500, {
            error: unavailable
              ? "Pet chưa sẵn sàng cho hành động này. Hãy kiểm tra năng lượng và môi trường."
              : "Chưa lưu được thay đổi. Vui lòng thử lại.",
          });
        }
        return;
      }
      if (request.method !== "GET" || pathname.startsWith("/api/")) {
        json(response, 404, { error: "Không tìm thấy." });
        return;
      }
      const file = resolve(
        publicDir,
        "." + (pathname === "/" ? "/index.html" : decodeURIComponent(pathname)),
      );
      if (!file.startsWith(resolve(publicDir) + sep)) {
        json(response, 403, { error: "Không hợp lệ." });
        return;
      }
      const mime: Record<string, string> = {
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".svg": "image/svg+xml",
        ".png": "image/png",
      };
      try {
        const content = await readFile(file);
        response.writeHead(200, {
          "Content-Type": mime[extname(file)] ?? "application/octet-stream",
          "Cache-Control": "no-cache",
        });
        response.end(content);
      } catch {
        json(response, 404, {
          error: "Không tìm thấy file giao diện. Hãy chạy npm run ui.",
        });
      }
    } catch {
      if (!response.headersSent)
        json(response, 400, { error: "Yêu cầu không hợp lệ." });
      else response.end();
    }
  });
  server.on("close", () => clearInterval(timer));
  return server;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("PORT must be 1–65535.");
  const path = resolve(process.env.PET_STATE_PATH ?? "data/pet-state.json");
  const state = await loadState(path);
  await saveState(path, state);
  const service = new PetService(new Pet(state), path);
  const server = createPetServer(service, resolve("dist/ui"));
  server.on("error", (error) => {
    console.error("Không mở được giao diện:", error.message);
    process.exitCode = 1;
  });
  server.listen(port, "127.0.0.1", () =>
    console.log(
      `Pet UI: http://127.0.0.1:${port}\nState: ${path}\nCtrl+C để dừng. Không chạy terminal simulation cùng file state khi UI đang mở.`,
    ),
  );
}
