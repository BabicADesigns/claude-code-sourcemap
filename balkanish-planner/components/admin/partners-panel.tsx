"use client";

import type { LocalPartner, PartnerTrustLevel, CommercialRelationship } from "@/lib/types";

const TRUST_CLASS: Record<PartnerTrustLevel, string> = {
  founder_pick: "bg-terracotta/10 text-terracotta",
  verified_local: "bg-sage-dark/10 text-sage-dark",
  community_favourite: "bg-muted text-muted-foreground",
};

const TRUST_LABEL: Record<PartnerTrustLevel, string> = {
  founder_pick: "Founder's Pick",
  verified_local: "Verified Local",
  community_favourite: "Community Favourite",
};

const COMMERCIAL_LABEL: Record<CommercialRelationship, string> = {
  none: "No relationship",
  affiliate: "Affiliate",
  paid_partnership: "Paid partnership",
  founder_connection: "Founder connection",
  owned_or_affiliated_project: "Founder's project",
};

export function PartnersPanel({ partners }: { partners: LocalPartner[] }) {
  if (partners.length === 0) {
    return (
      <p className="font-serif text-sm text-muted-foreground">
        No partners yet. Add records to the <code>local_partners</code> table (Supabase) or{" "}
        <code>lib/data/partners-mock.ts</code> with <code>active: true</code>.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {partners.map((partner) => (
        <div
          key={partner.id}
          className="rounded-xl border border-border p-4 sm:p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <span className="font-sans text-[10px] uppercase tracking-widest text-muted-foreground">
                {partner.category} · {partner.country ?? "Any country"}
              </span>
              <h4 className="font-display text-lg text-sage-dark leading-tight">{partner.name}</h4>
              <span className="font-sans text-xs text-muted-foreground">{partner.slug}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-sans text-xs uppercase tracking-widest ${TRUST_CLASS[partner.trust_level]}`}
              >
                {TRUST_LABEL[partner.trust_level]}
              </span>
              {!partner.active && (
                <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 font-sans text-xs text-destructive uppercase tracking-widest">
                  Inactive
                </span>
              )}
              {partner.demo_only && (
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 font-sans text-xs text-muted-foreground uppercase tracking-widest">
                  Demo only
                </span>
              )}
            </div>
          </div>

          <p className="mt-2 font-serif text-sm text-foreground/85">{partner.short_description}</p>

          <dl className="mt-3 grid gap-x-4 gap-y-1 font-sans text-xs sm:grid-cols-2">
            <div className="flex gap-1.5">
              <dt className="text-muted-foreground">Commercial:</dt>
              <dd className="text-foreground">{COMMERCIAL_LABEL[partner.commercial_relationship]}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-muted-foreground">Priority:</dt>
              <dd className="text-foreground">{partner.priority}</dd>
            </div>
            {partner.website_url && (
              <div className="flex gap-1.5 sm:col-span-2">
                <dt className="text-muted-foreground">Website:</dt>
                <dd className="truncate text-foreground">{partner.website_url}</dd>
              </div>
            )}
          </dl>

          {partner.disclosure_text && (
            <p className="mt-2 font-sans text-xs italic text-muted-foreground/80">
              Disclosure: {partner.disclosure_text}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
