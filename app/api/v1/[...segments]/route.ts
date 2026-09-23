import { routeV1 } from "../_lib/router";

export const dynamic = "force-dynamic";

type RouteParameters = { params: Promise<{ segments: string[] }> };

async function route(request: Request, parameters: RouteParameters) {
  return routeV1(request, (await parameters.params).segments);
}

export const GET = route;
export const POST = route;
export const PATCH = route;
export const DELETE = route;
