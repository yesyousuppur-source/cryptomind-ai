import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email and message required." }, { status: 400 });
    }

    // Use Claude API to just acknowledge — in production you'd use Nodemailer/EmailJS/Resend
    // For now we return success and you can add email service later
    console.log("Contact form submission:", { name, email, subject, message });

    return NextResponse.json({
      success: true,
      message: "Message received! We'll reply within 24-48 hours.",
    });
  } catch {
    return NextResponse.json({ error: "Failed to send. Please email us directly." }, { status: 500 });
  }
}
