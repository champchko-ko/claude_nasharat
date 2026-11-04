import { createSupabaseServerClient } from "@/lib/supabase";
import { mapDissociationError } from "@/lib/school/mapDissociationError";

export async function tryDissociateUserRpc(userId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error: rpcError } = await supabase.rpc("dissociate_school_user", {
    p_user_id: userId,
  });

  if (!rpcError) {
    return true;
  }

  if (rpcError.code === "PGRST202" || rpcError.code === "42883") {
    return false;
  }

  throw mapDissociationError(rpcError);
}
