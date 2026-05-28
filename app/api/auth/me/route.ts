import { forward } from "@/lib/forward";
import { AuthService } from "@/lib/services/auth.service";

export async function GET() {
  return forward(() => AuthService.me())
}