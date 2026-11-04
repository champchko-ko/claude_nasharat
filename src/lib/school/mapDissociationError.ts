import type { AppError } from "@/lib/errors/AppError";
import { ConflictError } from "@/lib/errors/ConflictError";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";
import { NotFoundError } from "@/lib/errors/NotFoundError";
import { ValidationError } from "@/lib/errors/ValidationError";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";

type RpcErrorLike = { code?: string; message?: string };

/**
 * Maps `dissociate_school_user` (0046) failures onto the app's error classes.
 *
 * The messages are the contract: P0002 means "not in a school / not found",
 * 22023 is the self-removal guard, and 42501 carries either the last-admin
 * guard or the platform-owner guard. Anything else is a genuine database
 * failure and is mapped generically.
 */
export function mapDissociationError(error: RpcErrorLike): AppError {
  if (error.code === "P0002") {
    return new NotFoundError("User not found in this school");
  }
  if (error.code === "22023") {
    return new ValidationError("Cannot delete your own account");
  }
  if (error.code !== "42501") {
    return mapDatabaseError(error);
  }

  const message = error.message ?? "";
  if (message.includes("last active school administrator")) {
    return new ConflictError("Cannot remove the last active school administrator");
  }
  if (message.includes("system-protected")) {
    return new ForbiddenError("Cannot modify system-protected account");
  }
  return new ForbiddenError("Unauthorized");
}
