"use client";

import { Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { AvailableProjectsList } from "@/components/final/available-projects-list";

// Placeholder for Admin Project Management Panel - to be created
import { AdminProjectPanel } from "@/components/final/admin-project-panel";
import { MyFinalGroupPanel } from "@/components/final/my-final-group-panel";

// Placeholder for loading skeletons if needed
// function FinalPageLoadingSkeleton() {
//   return <div>Loading final page content...</div>;
// }

export default function FinalPage() {
  const { user, role } = useAuth();

  // TODO: Add state and hooks for final projects and groups as needed

  return (
    <main className="container mx-auto py-10 px-4 md:px-6">
      <div className="space-y-8">
        {/* Static Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight mb-6">
            Final Project Hub
          </h1>
          <p className="text-muted-foreground">
            Manage final projects, form groups, and select projects for the
            semester.
          </p>
        </div>

        {/* Admin Section */}
        {user && role === "admin" && (
          <section className="mb-8 p-6 bg-slate-50 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4 text-slate-800">
              Admin: Project Management
            </h2>
            <Suspense
              fallback={
                <p className="text-muted-foreground">Loading admin panel...</p>
              }
            >
              <AdminProjectPanel />
            </Suspense>
          </section>
        )}

        {/* Available Projects List - Visible to ALL LOGGED-IN USERS */}
        {user && (
          <section className="mb-8">
            {/* This heading can be part of AvailableProjectsList or kept here */}
            {/* <h2 className="text-2xl font-semibold mb-4">Available Projects</h2> */}
            <AvailableProjectsList />
          </section>
        )}

        {/* Student Group Management & Project Selection - Visible to logged-in non-admins */}
        {user && role !== "admin" && (
          <section className="mb-8 p-6 bg-sky-50 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4 text-sky-800">
              My Group & Project
            </h2>
            <Suspense
              fallback={
                <p className="text-muted-foreground">Loading group panel...</p>
              }
            >
              <MyFinalGroupPanel />
            </Suspense>
            {/* 
              The MyFinalGroupPanel will internally decide to show 
              group creation form or group details.
            */}
          </section>
        )}

        {/* Fallback for non-logged-in users or when auth state is not yet determined */}
        {!user && (
          <div className="text-center py-10">
            <p className="text-muted-foreground">
              Please log in to view final project details.
            </p>
            {/* Optionally, add a login button here */}
          </div>
        )}

        {/* 
          TODO: Add other sections based on the UI ideas:
          - Hero section (if any)
          - Your Group Dashboard (if in a group)
          - Project Selection Area (if not in a group/no project selected)
          - Available Projects browser
          - List of Other Active Groups
        */}

        <p className="text-center text-muted-foreground py-8">
          Further content for the final project page will be added here.
        </p>
      </div>
    </main>
  );
}
