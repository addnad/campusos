import { Modal } from "@/components/modal";
import { LegalDoc } from "@/components/legal-doc";

/// Shown over the current page when the link is clicked. Visiting
/// /privacy directly still renders the full page.
export default function Intercepted() {
  return (
    <Modal label="Privacy policy">
      <LegalDoc name="privacy" />
    </Modal>
  );
}
