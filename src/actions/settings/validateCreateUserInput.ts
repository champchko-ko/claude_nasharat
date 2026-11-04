export function validateCreateUserInput(
  fullName: string,
  email: string,
  password: string,
  roleKey: string,
): { valid: boolean; error?: string; trimmedName: string; trimmedEmail: string } {
  const trimmedName = fullName.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedName || !trimmedEmail.includes("@")) {
    return {
      valid: false,
      error: "Valid full name and email are required",
      trimmedName,
      trimmedEmail,
    };
  }

  if (password.length < 6) {
    return {
      valid: false,
      error: "Password must be at least 6 characters",
      trimmedName,
      trimmedEmail,
    };
  }

  if (roleKey === "owner") {
    return {
      valid: false,
      error: "Invalid role selection",
      trimmedName,
      trimmedEmail,
    };
  }

  return { valid: true, trimmedName, trimmedEmail };
}
