import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { toast } from "sonner";
import { RealtimeNotificationListener } from "./RealtimeNotificationListener";

const mockRefresh = vi.fn();
const mockPush = vi.fn();

vi.mock("@/i18n", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
    push: mockPush,
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
  },
}));

const mockRemoveChannel = vi.fn().mockResolvedValue("ok");
let postgresChangesHandler: ((payload: unknown) => void) | null = null;

const mockChannel = {
  on: vi.fn().mockImplementation((_type, _filter, callback) => {
    postgresChangesHandler = callback;
    return mockChannel;
  }),
  subscribe: vi.fn().mockReturnThis(),
};

vi.mock("@/lib/supabase/createSupabaseBrowserClient", () => ({
  createSupabaseBrowserClient: () => ({
    channel: vi.fn().mockReturnValue(mockChannel),
    removeChannel: mockRemoveChannel,
  }),
}));

describe("RealtimeNotificationListener", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    postgresChangesHandler = null;
  });

  it("subscribes to realtime channel on mount and removes on unmount", () => {
    const { unmount } = render(<RealtimeNotificationListener userId="usr-123" />);

    expect(mockChannel.on).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: "user_id=eq.usr-123",
      }),
      expect.any(Function),
    );
    expect(mockChannel.subscribe).toHaveBeenCalled();

    unmount();
    expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel);
  });

  it("triggers toast and router.refresh when notification payload is received", () => {
    render(<RealtimeNotificationListener userId="usr-123" />);

    expect(postgresChangesHandler).not.toBeNull();
    postgresChangesHandler!({
      new: {
        id: "notif-1",
        user_id: "usr-123",
        title: "تعميم عاجل",
        body: "يرجى الاطلاع والرد",
        entity_type: "circular",
        entity_id: "circ-456",
      },
    });

    expect(toast.info).toHaveBeenCalledWith(
      "تعميم عاجل",
      expect.objectContaining({
        description: "يرجى الاطلاع والرد",
        action: expect.objectContaining({
          label: "view",
          onClick: expect.any(Function),
        }),
      }),
    );

    const callArgs = vi.mocked(toast.info).mock.calls[0];
    const options = callArgs?.[1] as { action?: { onClick?: () => void } } | undefined;
    options?.action?.onClick?.();
    expect(mockPush).toHaveBeenCalledWith("/circulars/circ-456");
    expect(mockRefresh).toHaveBeenCalled();
  });
});
