import { openApiSpecification } from "../_lib/openapi";

export async function GET() {
  return Response.json(openApiSpecification, { headers: { "cache-control": "public, max-age=3600", "access-control-allow-origin": "*" } });
}
