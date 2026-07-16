import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcrypt"

import { prisma } from "@/lib/prisma"

/**
 * Admin setup endpoint - development only.
 * Creates the first ADMIN user if none exists.
 *
 * POST /api/setup/admin
 * Body: { name: string, email: string, password: string }
 */
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Admin setup is only available in development mode" },
      { status: 403 }
    )
  }

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    })

    if (existingAdmin) {
      return NextResponse.json(
        {
          error: "Admin setup already completed",
          message: "An admin user already exists. Setup is complete.",
        },
        { status: 400 }
      )
    }

    // Parse request body
    const { name, email, password } = await request.json()

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      )
    }

    // Hash password using bcrypt (10 rounds)
    const hashedPassword = await hash(password, 10)

    // Create user with ADMIN role and account with password
    const user = await prisma.user.create({
      data: {
        name: name || email.split("@")[0],
        email,
        role: "ADMIN",
        emailVerified: true,
      },
    })

    // Create account with hashed password
    await prisma.account.create({
      data: {
        id: `email_${email}`,
        accountId: email,
        providerId: "credential",
        userId: user.id,
        password: hashedPassword,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: "Admin user created successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[v0] Admin setup error:", error)
    return NextResponse.json(
      {
        error: "Failed to create admin user",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/setup/admin
 * Returns whether admin setup has been completed.
 */
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Admin setup is only available in development mode" },
      { status: 403 }
    )
  }

  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    })

    return NextResponse.json({
      adminExists: !!existingAdmin,
      setupComplete: !!existingAdmin,
    })
  } catch (error) {
    console.error("[v0] Admin setup check error:", error)
    return NextResponse.json(
      { error: "Failed to check admin status" },
      { status: 500 }
    )
  }
}
