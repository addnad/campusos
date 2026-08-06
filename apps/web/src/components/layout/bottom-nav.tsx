import Link from "next/link";

/// Inline rather than an icon package: four icons do not justify a
/// dependency, and currentColor makes the active state free.
/// Taken from the design file, not redrawn: stroke-only outlines at
/// weight 2.75, currentColor so the active state is free.
const ICONS: Record<string, React.ReactNode> = {
  today: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.6V20h13V9.6" />
    </>
  ),
  courses: (
    <>
      <path d="M12 7S9.5 4.8 3 5.4v13C9.5 17.8 12 20 12 20s2.5-2.2 9-1.6v-13C14.5 4.8 12 7 12 7Z" />
      <path d="M12 7v13" />
    </>
  ),
  community: (
    <>
      <circle cx="9" cy="9" r="3.1" />
      <path d="M3.6 19c1.1-2.9 3-4.2 5.4-4.2s4.3 1.3 5.4 4.2" />
      <path d="M15.5 6.2a3.1 3.1 0 0 1 0 5.9" />
      <path d="M17 14.9c1.7.5 3 1.8 3.8 4.1" />
    </>
  ),
  me: (
    <>
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M4.8 20c1.5-3.9 4-5.6 7.2-5.6s5.7 1.7 7.2 5.6" />
    </>
  ),
};

const TABS = [
  { href: "/today", key: "today", label: "Today" },
  { href: "/courses", key: "courses", label: "Courses" },
  { href: "/community", key: "community", label: "Rooms" },
  { href: "/me", key: "me", label: "Me" },
];

export function BottomNav({ active, unread = 0 }: { active: string; unread?: number }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t-2 border-ink/10 bg-ground pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-2xl">
        {TABS.map((t) => {
          const on = active === t.href;
          return (
            <Link key={t.href} href={t.href} aria-current={on ? "page" : undefined} className={`flex flex-1 flex-col items-center gap-1 py-3 ${on ? "text-ink" : "text-ink/40"}`}>
              <span className="relative">
              {t.key === "community" && unread > 0 && (
                <span aria-label={`${unread} unread`} className="absolute -right-1 -top-0.5 h-2.5 w-2.5 rounded-full bg-alarm ring-2 ring-ground" />
              )}
              <svg viewBox="0 0 24 24" aria-hidden className="h-[23px] w-[23px]" fill="none" stroke="currentColor" strokeWidth={2.75} strokeLinecap="round" strokeLinejoin="round"> {ICONS[t.key]} </svg> </span> <span className={`label text-[10px] ${on ?"font-bold" : ""}`}>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
