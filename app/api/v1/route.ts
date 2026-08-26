import { routeV1 } from "./_lib/router";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return routeV1(request, []);
}
