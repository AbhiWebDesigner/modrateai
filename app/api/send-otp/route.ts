import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Store OTPs temporarily (in production use Redis or Firestore)
const otpStore = new Map<string, { otp: string; expires: number }>();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email, action } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    if (action === 'send') {
      // Generate OTP
      const otp = generateOTP();
      const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

      // Store OTP
      otpStore.set(email, { otp, expires });

      // Send email
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"ModrateAI Security" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔐 Your ModrateAI Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">ModrateAI</h1>
              <p style="color: #bfdbfe; margin: 8px 0 0;">Security Verification</p>
            </div>
            <h2 style="color: #1f2937; text-align: center;">Your verification code</h2>
            <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0;">
              <div style="font-size: 48px; font-weight: 900; color: #3b82f6; letter-spacing: 8px;">${otp}</div>
            </div>
            <p style="color: #6b7280; text-align: center; font-size: 14px;">This code expires in <strong>10 minutes</strong>.</p>
            <p style="color: #6b7280; text-align: center; font-size: 12px;">If you didn't request this, please ignore this email.</p>
            <div style="border-top: 1px solid #e5e7eb; margin-top: 24px; padding-top: 16px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px;">ModrateAI — AI YouTube Comment Moderation 🛡️</p>
            </div>
          </div>
        `,
      });

      return NextResponse.json({ success: true, message: 'OTP sent successfully' });
    }

    if (action === 'verify') {
      const { otp } = await req.json();
      const stored = otpStore.get(email);

      if (!stored) {
        return NextResponse.json({ error: 'OTP expired or not found' }, { status: 400 });
      }

      if (Date.now() > stored.expires) {
        otpStore.delete(email);
        return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
      }

      if (stored.otp !== otp) {
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
      }

      otpStore.delete(email);
      return NextResponse.json({ success: true, message: 'OTP verified successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('OTP error:', error);
    return NextResponse.json({ error: 'Failed to process OTP' }, { status: 500 });
  }
}