export function shouldThrottleNotification(
  lastCreatedAt: string | Date | null | undefined,
  windowMinutes = 15,
  now: Date = new Date(),
): boolean {
  if (!lastCreatedAt) return false;
  const lastTime =
    typeof lastCreatedAt === "string" ? new Date(lastCreatedAt).getTime() : lastCreatedAt.getTime();
  if (isNaN(lastTime)) return false;

  const windowMs = windowMinutes * 60 * 1000;
  return now.getTime() - lastTime < windowMs;
}
