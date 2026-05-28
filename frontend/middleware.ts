import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/login(.*)",
  "/signup(.*)",
]);

const isStudent = createRouteMatcher(["/dashboard(.*)"]);
const isTutor = createRouteMatcher(["/tutor(.*)"]);
const isAdmin = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.publicMetadata as Record<string, string>)?.role;

  if (isStudent(req) || isTutor(req) || isAdmin(req)) {
    if (!userId) return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAdmin(req) && role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isTutor(req) && role !== "tutor" && role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
