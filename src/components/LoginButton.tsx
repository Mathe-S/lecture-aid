"use client";

import { useAuth } from "@/context/AuthContext";

export default function LoginButton() {
  const { user, signInWithGitHub, signOut } = useAuth();

  return (
    <button
      onClick={() => (user ? signOut() : signInWithGitHub())}
      className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 cursor-pointer"
    >
      {user ? "Sign Out" : "Sign In with GitHub"}
    </button>
  );
}
