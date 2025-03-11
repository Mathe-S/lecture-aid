"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, LogOut, User, BookOpen, Shield } from "lucide-react";

export default function Navbar() {
  const { user, role, signOut } = useAuth();

  // Get avatar URL and initials from user metadata
  const avatarUrl = user?.user_metadata?.avatar_url || "";
  const userName =
    user?.user_metadata?.full_name || user?.user_metadata?.name || "User";
  const userInitials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-blue-600">
              Lecture aid
            </Link>

            <nav className="hidden md:ml-10 md:flex md:space-x-8">
              <Link
                href="/"
                className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium"
              >
                Home
              </Link>

              {user && (
                <Link
                  href="/dashboard"
                  className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
              )}

              {role === "admin" && (
                <Link
                  href="/admin"
                  className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatarUrl} alt={userName} />
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>{role}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => (window.location.href = "/dashboard")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  {role === "admin" && (
                    <DropdownMenuItem
                      onClick={() => (window.location.href = "/admin")}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Admin</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login" passHref>
                <Button>Sign In</Button>
              </Link>
            )}

            <div className="md:hidden ml-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => (window.location.href = "/")}
                  >
                    Home
                  </DropdownMenuItem>
                  {user && (
                    <DropdownMenuItem
                      onClick={() => (window.location.href = "/dashboard")}
                    >
                      Dashboard
                    </DropdownMenuItem>
                  )}
                  {role === "admin" && (
                    <DropdownMenuItem
                      onClick={() => (window.location.href = "/admin")}
                    >
                      Admin
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
