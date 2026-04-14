import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { NextResponse } from "next/server";
import { UserRole } from "@/lib/constants";


const { auth } = NextAuth(authConfig);


export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;
  const role = req.auth?.user?.role;

  const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard");
  const isPortalRoute = nextUrl.pathname.startsWith("/client-portal");
  const isLoginRoute = nextUrl.pathname === "/login";

  if (isLoginRoute && isLoggedIn) {
    if (role === UserRole.CLIENT) {
      return NextResponse.redirect(new URL("/client-portal", nextUrl));
    }
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (isDashboardRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (role === UserRole.CLIENT) {
      return NextResponse.redirect(new URL("/client-portal", nextUrl));
    }
  }

  if (isPortalRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    // Employees can access portal to see what clients see if needed, 
    // but usually clients only.
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/client-portal/:path*", "/login"],
};
