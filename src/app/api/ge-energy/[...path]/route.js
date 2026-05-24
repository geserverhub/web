/**
 * Catch-all for unimplemented /api/ge-energy/* paths.
 * This app does not proxy energy APIs to port 8000 — use goeunserverhub routes only.
 */
export const dynamic = "force-dynamic";

function notImplemented(pathParts) {
  const path = pathParts.join("/");
  return Response.json(
    {
      error: "Not implemented",
      path,
      hint: "Energy APIs in this app read goeunserverhub only. Add a route under src/app/api/ge-energy/ or call an existing endpoint.",
    },
    { status: 404 }
  );
}

export async function GET(_request, { params }) {
  const { path } = await params;
  return notImplemented(Array.isArray(path) ? path : []);
}

export async function POST(_request, { params }) {
  const { path } = await params;
  return notImplemented(Array.isArray(path) ? path : []);
}

export async function PUT(_request, { params }) {
  const { path } = await params;
  return notImplemented(Array.isArray(path) ? path : []);
}

export async function PATCH(_request, { params }) {
  const { path } = await params;
  return notImplemented(Array.isArray(path) ? path : []);
}

export async function DELETE(_request, { params }) {
  const { path } = await params;
  return notImplemented(Array.isArray(path) ? path : []);
}
