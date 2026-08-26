import { routeLegacy } from "../v1/_lib/router";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return routeLegacy(request, "operations");
}

export function PATCH(request: Request) {
  return routeLegacy(request, "operations");
}
