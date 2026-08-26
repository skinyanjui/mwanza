import { routeLegacy } from "../v1/_lib/router";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return routeLegacy(request, "account-profile");
}

export function POST(request: Request) {
  return routeLegacy(request, "account-profile");
}
