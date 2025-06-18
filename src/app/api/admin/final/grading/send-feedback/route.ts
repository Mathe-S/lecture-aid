import { NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import { getUserRole } from "@/lib/userService";
import { z } from "zod";

const sendFeedbackSchema = z.object({
  taskId: z.string(),
  studentIds: z.array(z.string()),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
});

export async function POST(request: Request) {
  const supabase = await supabaseForServer();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if user is admin
    const userRole = await getUserRole(userData.user.id);
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { taskId, studentIds, subject, message } =
      sendFeedbackSchema.parse(body);

    // Get student emails
    const { data: students, error: studentsError } = await supabase
      .from("users")
      .select("email, fullName")
      .in("id", studentIds);

    if (studentsError) {
      throw new Error("Failed to fetch student emails");
    }

    // Send emails to each student
    const emailPromises = students.map(async (student) => {
      try {
        // Use Supabase's built-in email service or your preferred email service
        // For now, we'll log the email content and simulate sending
        console.log(`Sending feedback email to ${student.email}:`);
        console.log(`Subject: ${subject}`);
        console.log(`Message: ${message}`);

        // In a real implementation, you would use an email service like:
        // - Resend
        // - SendGrid
        // - AWS SES
        // - Nodemailer with SMTP

        // Example with a hypothetical email service:
        /*
        await emailService.send({
          to: student.email,
          subject: subject,
          html: `
            <h3>Feedback for Task</h3>
            <p>Dear ${student.fullName},</p>
            <p>${message}</p>
            <hr>
            <p>Best regards,<br>Your Instructor</p>
          `,
        });
        */

        return { success: true, email: student.email };
      } catch (error) {
        console.error(`Failed to send email to ${student.email}:`, error);
        return { success: false, email: student.email, error: error };
      }
    });

    const results = await Promise.all(emailPromises);
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    // Log the feedback activity (optional - you could store this in a feedback_logs table)
    console.log(
      `Feedback sent for task ${taskId} to ${successful} students, ${failed} failed`
    );

    return NextResponse.json({
      success: true,
      message: `Feedback sent to ${successful} student(s)${
        failed > 0 ? `, ${failed} failed` : ""
      }`,
      results,
    });
  } catch (error) {
    console.error("[API_ADMIN_FINAL_GRADING_SEND_FEEDBACK_POST] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send feedback" },
      { status: 500 }
    );
  }
}
