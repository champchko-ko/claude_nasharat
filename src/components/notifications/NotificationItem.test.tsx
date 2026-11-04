import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NotificationItem } from "./NotificationItem";
import type { NotificationRow } from "@/lib/notifications/types";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      markRead: "Mark as read",
      viewDetails: "View Details",
      "types.circular": "Circular",
      "templates.circular_published.title": "New Administrative Circular",
      "templates.circular_published.body": "A new circular has been published",
      "templates.maintenance_assigned.title": "New Maintenance Request",
      "templates.maintenance_assigned.body": "A maintenance request has been assigned",
    };
    return translations[key] ?? key;
  },
}));

vi.mock("@/i18n", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock("@/actions/notifications/markNotificationReadAction", () => ({
  markNotificationReadAction: vi.fn(),
}));

describe("NotificationItem", () => {
  it("renders localized title and body for canonical template key", () => {
    const notification: NotificationRow = {
      id: "notif-1",
      user_id: "user-1",
      school_id: "school-1",
      type: "circular",
      title: "circular_published",
      body: "circular_published",
      entity_type: "circular",
      entity_id: "circ-123",
      read_at: null,
      created_at: new Date().toISOString(),
    };

    render(<NotificationItem notification={notification} />);

    expect(screen.getByText("New Administrative Circular")).toBeInTheDocument();
    expect(screen.getByText("A new circular has been published")).toBeInTheDocument();
  });

  it("renders localized title and body for maintenance template", () => {
    const notification: NotificationRow = {
      id: "notif-2",
      user_id: "user-1",
      school_id: "school-1",
      type: "maintenance",
      title: "maintenance_assigned",
      body: "maintenance_assigned",
      entity_type: "maintenance_request",
      entity_id: "req-123",
      read_at: null,
      created_at: new Date().toISOString(),
    };

    render(<NotificationItem notification={notification} />);

    expect(screen.getByText("New Maintenance Request")).toBeInTheDocument();
    expect(screen.getByText("A maintenance request has been assigned")).toBeInTheDocument();
  });
});
