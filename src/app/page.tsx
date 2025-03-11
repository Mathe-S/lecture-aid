import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100 p-4">
      <div className="max-w-3xl w-full text-center space-y-8">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
          Welcome to Learning Platform
        </h1>

        <p className="text-xl text-gray-700 max-w-2xl mx-auto">
          A collaborative platform for students, lecturers, and administrators
          to manage educational resources.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
          <Link href="/login" passHref>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg text-lg font-medium">
              Sign In
            </Button>
          </Link>

          <Link href="/dashboard" passHref>
            <Button
              variant="outline"
              className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-8 py-3 rounded-lg text-lg font-medium"
            >
              View Dashboard
            </Button>
          </Link>
        </div>

        <div className="pt-12 text-gray-600">
          <p>Available roles: Admin, Lecturer, Student</p>
        </div>
      </div>
    </div>
  );
}
