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
  GitBranch,
  Home,
  LayoutDashboard,
  CheckSquare,
  Trophy,
  Users,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import NProgress from "nprogress";
import { ActiveUsers } from "./ActiveUsers";
import { AdminActiveUsersList } from "./AdminActiveUsersList";
import { Logo } from "./svg/Logo";
import { HangoutUsersCountMinimal } from "./HangoutUsersCountMinimal";
import { useInitializeHangoutStore } from "@/store/hangoutStore";

export default function Navbar() {
  const { user, role, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize the Hangout store based on auth state
  useInitializeHangoutStore();

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
    { label: "Home", href: "/", showWhen: !user, icon: Home },
    // Only when logged in
    {
      label: "Dashboard",
      href: "/dashboard",
      showWhen: !!user,
      icon: LayoutDashboard,
    },
    { label: "Quizzes", href: "/quizzes", showWhen: !!user, icon: CheckSquare },
    {
      label: "Assignments",
      href: "/assignments",
      showWhen: !!user,
      icon: CheckSquare,
    },
    { label: "Midterm", href: "/midterm", showWhen: !!user, icon: GitBranch },
    { label: "Chat", href: "/chat", showWhen: !!user, icon: MessageSquare },
    { label: "Hangout", href: "/hangout", showWhen: !!user, icon: Users },
    {
      label: "Leaderboard",
      href: "/leaderboard",
      showWhen: !!user,
      icon: Trophy,
    },
    // Admin only
    {
      label: "Admin",
      href: "/admin",
      showWhen: role === "admin",
      icon: Shield,
    },
  ];

  // User menu items - used in dropdown
  const userMenuItems = [
    { label: "Dashboard", href: "/dashboard", icon: User },
    { label: "Quizzes", href: "/quizzes", icon: BookOpen },
    { label: "Assignments", href: "/assignments", icon: BookOpen },
    // Add Midterm item to the dropdown menu
    { label: "Midterm", href: "/midterm", icon: GitBranch },
    // Add Chat item to the dropdown menu
    { label: "Chat", href: "/chat", icon: MessageSquare },
    {
      label: "Leaderboard",
      href: "/leaderboard",
      icon: Trophy,
    },
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
              className="text-xl font-bold text-blue-600 cursor-pointer mr-4 flex items-center gap-2"
            >
              <Logo />
            </Link>

            {/* Desktop Navigation with Highlighting */}
            <nav className="hidden md:ml-6 md:flex md:space-x-1">
              {navItems
                .filter((item) => item.showWhen)
                .map((item, index) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={index}
                      href={item.href}
                      className={`flex items-center rounded-md px-3 py-2 text-sm font-medium cursor-pointer transition-colors duration-150 ease-in-out ${
                        isActive
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                      {item.label}
                      {/* Conditionally render the count for Hangout link */}
                      {item.label === "Hangout" && <HangoutUsersCountMinimal />}
                    </Link>
                  );
                })}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* Show ActiveUsers count or Admin list based on role */}
            {user && (
              <>
                {role === "admin" ? <AdminActiveUsersList /> : <ActiveUsers />}
              </>
            )}

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

            {/* Mobile Menu with Highlighting */}
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
                    .map((item, index) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== "/" && pathname.startsWith(item.href));
                      return (
                        <DropdownMenuItem
                          key={index}
                          onClick={() => navigateTo(item.href)}
                          className={`cursor-pointer ${
                            isActive ? "bg-slate-100 font-medium" : ""
                          }`}
                          aria-current={isActive ? "page" : undefined}
                        >
                          {item.label}
                        </DropdownMenuItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
