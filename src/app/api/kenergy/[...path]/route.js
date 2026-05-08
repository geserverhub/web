const backendBaseUrl =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export const dynamic = "force-dynamic";

async function proxyToBackend(request, params, method) {
  const { path } = await params;
  const pathParts = Array.isArray(path) ? path : [];
  const backendUrl = new URL(`/api/${pathParts.join("/")}`, backendBaseUrl);

  request.nextUrl.searchParams.forEach((value, key) => {
    backendUrl.searchParams.append(key, value);
  });

  const init = {
    method,
    cache: "no-store",
    headers: {
      accept: request.headers.get("accept") || "application/json",
    },
  };

  if (method !== "GET" && method !== "HEAD") {
    const contentType = request.headers.get("content-type");
    if (contentType) init.headers["content-type"] = contentType;
    try { init.body = await request.text(); } catch { /* empty body */ }
  }

  try {
    const response = await fetch(backendUrl, init);
    const contentType = response.headers.get("content-type");
    const payload = await response.arrayBuffer();
    const headers = new Headers();
    if (contentType) headers.set("content-type", contentType);
    return new Response(payload, { status: response.status, headers });
  } catch {
    return Response.json({ error: "Backend unavailable" }, { status: 502 });
  }
}

export async function GET(request, { params }) {
  return proxyToBackend(request, params, "GET");
}

export async function POST(request, { params }) {
  return proxyToBackend(request, params, "POST");
}

export async function PUT(request, { params }) {
  return proxyToBackend(request, params, "PUT");
}

export async function PATCH(request, { params }) {
  return proxyToBackend(request, params, "PATCH");
}

export async function DELETE(request, { params }) {
  return proxyToBackend(request, params, "DELETE");
}
