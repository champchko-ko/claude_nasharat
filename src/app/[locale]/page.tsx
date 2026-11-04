import { setRequestLocale } from "next-intl/server";
import { getPublicSchoolProfile } from "@/lib/school/getPublicSchoolProfile";
import { getPublicCalendarEvents } from "@/lib/calendar/getPublicCalendarEvents";
import { getPublicCirculars } from "@/lib/circulars/getPublicCirculars";
import { getPublicSchoolDocuments } from "@/lib/documents/getPublicSchoolDocuments";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";
import { PublicTopBar } from "@/components/public/PublicTopBar";
import { PublicHero } from "@/components/public/PublicHero";
import { PublicEventsSection } from "@/components/public/PublicEventsSection";
import { PublicFooter } from "@/components/public/PublicFooter";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const profile = await getCurrentProfile().catch(() => null);
  const isOwner = profile?.id ? await isPlatformOwner(profile.id).catch(() => false) : false;

  const school = await getPublicSchoolProfile();
  const [events, documents, circulars] = await Promise.all([
    getPublicCalendarEvents(school?.id),
    getPublicSchoolDocuments(school?.id),
    getPublicCirculars(school?.id),
  ]);

  return (
    <div className="flex min-h-screen flex-col justify-between scroll-smooth bg-background text-foreground">
      <PublicTopBar school={school} events={events} isOwner={isOwner} />
      <main className="flex-1">
        <PublicHero school={school} documents={documents} />
        <PublicEventsSection events={events} circulars={circulars} />
      </main>
      <PublicFooter />
    </div>
  );
}
