"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FaUser, FaGithub, FaEnvelope, FaIdBadge } from "react-icons/fa";

export default function DashboardPage() {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-indigo-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              User Dashboard
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Welcome to your personal dashboard
            </p>
          </div>

          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FaUser className="mr-2" /> Name
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {user.user_metadata?.full_name ||
                    user.user_metadata?.name ||
                    "Not provided"}
                </dd>
              </div>

              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FaEnvelope className="mr-2" /> Email address
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {user.email || "Not provided"}
                </dd>
              </div>

              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FaIdBadge className="mr-2" /> Role
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                    {role || "Loading..."}
                  </span>
                </dd>
              </div>

              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FaGithub className="mr-2" /> GitHub
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {user.user_metadata?.preferred_username ||
                    user.user_metadata?.user_name ||
                    "Not available"}
                </dd>
              </div>

              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">User ID</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 break-all">
                  {user.id}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {role === "admin" && (
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-purple-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Admin Actions
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Special actions available to administrators
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <a
                href="/admin"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Go to Admin Panel
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
