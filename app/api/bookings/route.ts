import { routeLegacy } from "../v1/_lib/router";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return routeLegacy(request, "bookings");
}

export function POST(request: Request) {
  return routeLegacy(request, "bookings");
}

export function PATCH(request: Request) {
  return routeLegacy(request, "bookings");
}
