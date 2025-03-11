import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="max-w-3xl w-full text-center space-y-8">
        <h1 className="text-4xl md:text-6xl font-bold text-slate-900">
          Welcome to Lecture aid
        </h1>

        <p className="text-xl text-slate-700 max-w-2xl mx-auto">
          A collaborative platform for students, lecturers, and administrators
          to manage educational resources.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
          <Link href="/login" passHref>
            <Button size="lg" className="text-lg">
              Sign In
            </Button>
          </Link>

          <Link href="/dashboard" passHref>
            <Button variant="outline" size="lg" className="text-lg">
              View Dashboard
            </Button>
          </Link>
        </div>

        <div className="pt-12 text-slate-600">
          <p>Available roles: Admin, Lecturer, Student</p>
        </div>
      </div>
    </div>
  );
}
