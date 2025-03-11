"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Navbar() {
  const { user, role, signOut } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-indigo-600">
              Learning Platform
            </Link>

            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              <Link
                href="/"
                className="px-3 py-2 text-gray-700 hover:text-indigo-600"
              >
                Home
              </Link>

              {user && (
                <Link
                  href="/dashboard"
                  className="px-3 py-2 text-gray-700 hover:text-indigo-600"
                >
                  Dashboard
                </Link>
              )}

              {role === "admin" && (
                <Link
                  href="/admin"
                  className="px-3 py-2 text-gray-700 hover:text-indigo-600"
                >
                  Admin
                </Link>
              )}

              {(role === "admin" || role === "lecturer") && (
                <Link
                  href="/courses"
                  className="px-3 py-2 text-gray-700 hover:text-indigo-600"
                >
                  Courses
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {role && (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                      {role}
                    </span>
                  )}
                </span>
                <Button
                  variant="outline"
                  onClick={() => signOut()}
                  className="text-sm"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link href="/login" passHref>
                <Button className="text-sm">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
