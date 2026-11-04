import { type NextRequest } from "next/server";
import { handleBypassRequest } from "@/lib/security/handleBypassRequest";

export async function GET(request: NextRequest) {
  return handleBypassRequest(request);
}

export async function POST(request: NextRequest) {
  return handleBypassRequest(request);
}
