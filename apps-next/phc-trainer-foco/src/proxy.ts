import { NextResponse, type NextRequest } from "next/server";

/**
 * Identidade anónima: sem registo nem password para começar.
 * Porquê (TDAH): cada passo antes da primeira vitória é um ponto de abandono.
 * O id vive num cookie httpOnly; é também injetado no pedido atual para que o
 * primeiro render já o veja.
 */
export const LEARNER_COOKIE = "phc_uid";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function proxy(request: NextRequest) {
  const current = request.cookies.get(LEARNER_COOKIE)?.value;
  if (current && UUID_RE.test(current)) return NextResponse.next();

  const id = crypto.randomUUID();
  request.cookies.set(LEARNER_COOKIE, id);
  const response = NextResponse.next({ request: { headers: request.headers } });
  response.cookies.set({
    name: LEARNER_COOKIE,
    value: id,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
  return response;
}

export const config = {
  matcher: ["/((?!api/health|_next/static|_next/image|favicon.ico).*)"],
};
