import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { IosInstallDialog } from "./IosInstallDialog";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      iosGuideTitle: "Install on iPhone & iPad",
      iosGuideSubtitle: "Follow these simple steps in Safari",
      safariNotice: "Make sure to open this page in Safari",
      step1Title: "Tap the Share button",
      step1Desc: "Tap the Share icon in the toolbar",
      step2Title: "Select Add to Home Screen",
      step2Desc: "Scroll down and tap Add to Home Screen",
      step3Title: "Confirm and Add",
      step3Desc: "Tap Add in top right corner",
      gotIt: "Got it",
      closeGuide: "Close guide",
    };
    return translations[key] || key;
  },
}));

describe("IosInstallDialog", () => {
  it("does not render when isOpen is false", () => {
    const { container } = render(<IosInstallDialog isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders steps and closes when Got it or close button is clicked", () => {
    const onClose = vi.fn();
    render(<IosInstallDialog isOpen={true} onClose={onClose} />);

    expect(screen.getByText("Install on iPhone & iPad")).toBeInTheDocument();
    expect(screen.getByText("Tap the Share button")).toBeInTheDocument();
    expect(screen.getByText("Select Add to Home Screen")).toBeInTheDocument();
    expect(screen.getByText("Confirm and Add")).toBeInTheDocument();

    const gotItBtn = screen.getByText("Got it");
    fireEvent.click(gotItBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    const closeBtn = screen.getByLabelText("Close guide");
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("closes when Escape key is pressed", () => {
    const onClose = vi.fn();
    render(<IosInstallDialog isOpen={true} onClose={onClose} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
