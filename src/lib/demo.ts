/**
 * Seeded testimonials, reviews and homepage stats are demo content.
 * They show in development, and in production only when DEMO_CONTENT="true"
 * (e.g. a staging preview for the client). Real launches never show them by accident.
 */
export function showDemoContent() {
  if (process.env.DEMO_CONTENT === "true") return true;
  if (process.env.DEMO_CONTENT === "false") return false;
  return process.env.NODE_ENV !== "production";
}
