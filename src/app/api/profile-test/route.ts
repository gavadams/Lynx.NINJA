import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: "Profile test route working",
    url: request.url
  })
}
