import { NextResponse } from "next/server"
import { registerUser } from "@/lib/actions/auth"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const result = await registerUser(body)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, tenantId: result.tenantId })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
