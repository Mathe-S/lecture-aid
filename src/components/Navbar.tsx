"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  LogOut,
  User,
  BookOpen,
  Shield,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import NProgress from "nprogress";

export default function Navbar() {
  const { user, role, signOut } = useAuth();
  const router = useRouter();

  // Get avatar URL and initials from user metadata
  const avatarUrl = user?.user_metadata?.avatar_url || "";
  const userName =
    user?.user_metadata?.full_name || user?.user_metadata?.name || "User";
  const userInitials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  // Navigation items - defined once and used for both desktop and mobile
  const navItems = [
    // Always visible
    { label: "Home", href: "/", showWhen: !user },
    // Only when logged in
    { label: "Dashboard", href: "/dashboard", showWhen: !!user },
    { label: "Quizzes", href: "/quizzes", showWhen: !!user },
    // Add Chat item
    { label: "Chat", href: "/chat", showWhen: !!user },
    { label: "Assignments", href: "/assignments", showWhen: !!user },
    // Admin only
    { label: "Admin", href: "/admin", showWhen: role === "admin" },
    { label: "Results", href: "/admin/results", showWhen: role === "admin" },
  ];

  // User menu items - used in dropdown
  const userMenuItems = [
    { label: "Dashboard", href: "/dashboard", icon: User },
    { label: "Quizzes", href: "/quizzes", icon: BookOpen },
    // Add Chat item to the dropdown menu
    { label: "Chat", href: "/chat", icon: MessageSquare },
    { label: "Assignments", href: "/assignments", icon: BookOpen },
    // Admin only items
    { label: "Admin", href: "/admin", icon: Shield, adminOnly: true },
    {
      label: "Quiz Management",
      href: "/admin/quizzes",
      icon: Shield,
      adminOnly: true,
    },
  ];

  // Helper function to navigate
  const navigateTo = (href: string) => {
    router.push(href);
  };

  const handleSignOut = async () => {
    // Show loading indicator
    NProgress.start();

    try {
      await signOut();
      // The redirect will be handled in the onSuccess callback
    } catch (error) {
      console.error("Error signing out:", error);
      // Force reload as a fallback
      window.location.href = "/";
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link
              href={user ? "/dashboard" : "/"}
              className="text-xl font-bold text-blue-600 cursor-pointer"
            >
              Lecture+
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:ml-10 md:flex md:space-x-8">
              {navItems
                .filter((item) => item.showWhen)
                .map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium cursor-pointer"
                  >
                    {item.label}
                  </Link>
                ))}
            </nav>
          </div>

          <div className="flex items-center">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full p-0 overflow-hidden  justify-center"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatarUrl} alt={userName} />
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" sideOffset={4}>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuItem className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>{role}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />

                  {userMenuItems
                    .filter(
                      (item) =>
                        !item.adminOnly || (item.adminOnly && role === "admin")
                    )
                    .map((item, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={() => navigateTo(item.href)}
                        className="cursor-pointer"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.label}</span>
                      </DropdownMenuItem>
                    ))}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/" passHref>
                <Button className="cursor-pointer">Sign In</Button>
              </Link>
            )}

            {/* Mobile Menu */}
            <div className="md:hidden ml-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="cursor-pointer">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {navItems
                    .filter((item) => item.showWhen)
                    .map((item, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={() => navigateTo(item.href)}
                        className="cursor-pointer"
                      >
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
