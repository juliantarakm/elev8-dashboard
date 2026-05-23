export type UpsellType = 'Vehicle Rental' | 'Airport Transport' | 'Private Chef' | 'Spa' | 'Activity' | 'Late Check-out' | 'Early Check-in' | 'Mid-stay Cleaning' | 'Office Equipment' | 'Baby' | 'Miscellaneous' | 'Pet'

export interface UpsellEntry {
  id: string
  date: string
  reservationId: string
  guest: string
  listing: string
  channel: string
  type: UpsellType
  amount: number
  currency: string
  invoice: string
  synced: boolean
  syncedAt?: string
  note?: string
}

export const mockUpsells: UpsellEntry[] = [
  // ── Synced (May 1–9) ─────────────────────────────────────────────────────
  { id: 'ups-001', date: '2026-05-01', reservationId: '86109494', guest: 'Thomas Wikes', listing: 'TAMBORA - The R Tambora: Stylish 3BR Tropical Escape', channel: 'Direct', type: 'Airport Transport', amount: 90.00, currency: 'CHF', invoice: 'inv_ups_001_wikes_transfer.pdf', synced: true, syncedAt: '2026-05-01T10:30:00Z', note: 'Ngurah Rai airport → villa, 2 passengers.' },
  { id: 'ups-002', date: '2026-05-01', reservationId: '83828094', guest: 'Mate Bezdek', listing: 'The R Apartment Mittelfelsen - Quiet, Free Parking', channel: 'Direct', type: 'Early Check-in', amount: 40.00, currency: 'CHF', invoice: 'inv_ups_002_bezdek_earlycheckin.pdf', synced: true, syncedAt: '2026-05-01T10:30:00Z', note: 'Early check-in at 10:00.' },
  { id: 'ups-003', date: '2026-05-01', reservationId: '85850379', guest: 'Lê Thương', listing: 'The R Apartment Uetliberg, Klima, Parken - Wallbox', channel: 'Airbnb', type: 'Miscellaneous', amount: 65.00, currency: 'CHF', invoice: 'inv_ups_003_thuong_welcome.pdf', synced: true, syncedAt: '2026-05-01T10:30:00Z', note: 'Flowers, local snacks, and wine bottle.' },
  { id: 'ups-004', date: '2026-05-01', reservationId: '85418022', guest: 'Reto Wyss', listing: 'The R Pererenan Mezzanine Studio + Plunge Pool', channel: 'Direct', type: 'Airport Transport', amount: 80.00, currency: 'CHF', invoice: 'inv_ups_004_wyss_transfer.pdf', synced: true, syncedAt: '2026-05-01T10:30:00Z', note: 'Ngurah Rai airport → Pererenan, 2 passengers.' },
  { id: 'ups-005', date: '2026-05-02', reservationId: '86069594', guest: 'Isabelle Brüsch', listing: 'The R Apartment Chrischona - free public transport', channel: 'Booking.com', type: 'Late Check-out', amount: 35.00, currency: 'CHF', invoice: 'inv_ups_005_brusch_latecheckout.pdf', synced: true, syncedAt: '2026-05-02T10:30:00Z', note: 'Late check-out at 14:00.' },
  { id: 'ups-006', date: '2026-05-02', reservationId: '86111741', guest: 'Volodymyr Shypka', listing: 'The R Loft - Cosy Suite Kalmantan incl Breakfast, Roof Top', channel: 'Airbnb', type: 'Activity', amount: 55.00, currency: 'CHF', invoice: 'inv_ups_006_shypka_activity.pdf', synced: true, syncedAt: '2026-05-02T10:30:00Z', note: 'Sunset BBQ activity package.' },
  { id: 'ups-007', date: '2026-05-03', reservationId: '83828094', guest: 'Mate Bezdek', listing: 'The R Apartment Mittelfelsen - Quiet, Free Parking', channel: 'Direct', type: 'Private Chef', amount: 120.00, currency: 'CHF', invoice: 'inv_ups_007_bezdek_chef.pdf', synced: true, syncedAt: '2026-05-03T10:30:00Z', note: 'Private chef dinner for 2, Balinese cuisine.' },
  { id: 'ups-008', date: '2026-05-03', reservationId: '86129132', guest: 'James Robert Briscoe', listing: 'The R Apartments Studio walk to the Beach', channel: 'Direct', type: 'Airport Transport', amount: 75.00, currency: 'CHF', invoice: 'inv_ups_008_briscoe_transfer.pdf', synced: true, syncedAt: '2026-05-03T10:30:00Z', note: 'Ngurah Rai airport → Canggu, 1 passenger.' },
  { id: 'ups-009', date: '2026-05-04', reservationId: '86266805', guest: 'Cameron Skillcorn', listing: 'BRATAN - The R Bratan | 3BR- Serene Getaway in Canggu', channel: 'Direct', type: 'Spa', amount: 95.00, currency: 'CHF', invoice: 'inv_ups_009_skillcorn_spa.pdf', synced: true, syncedAt: '2026-05-04T10:30:00Z', note: 'In-villa spa session for 2, 90 minutes.' },
  { id: 'ups-010', date: '2026-05-05', reservationId: '85678710', guest: 'Blessilda De Leon', listing: 'The R Apartment Bodensee - Old Town', channel: 'Airbnb', type: 'Early Check-in', amount: 40.00, currency: 'CHF', invoice: 'inv_ups_010_deleon_earlycheckin.pdf', synced: true, syncedAt: '2026-05-05T10:30:00Z' },
  { id: 'ups-011', date: '2026-05-06', reservationId: '86413147', guest: 'James Alizada', listing: 'KABA - Stylish 2BR the R Villa Kaba-Kerobokan+Pool/Bikes', channel: 'Booking.com', type: 'Vehicle Rental', amount: 30.00, currency: 'CHF', invoice: 'inv_ups_011_alizada_motorcycle.pdf', synced: true, syncedAt: '2026-05-06T10:30:00Z', note: 'Vehicle Rental rental for 3 days.' },
  { id: 'ups-012', date: '2026-05-07', reservationId: '86261346', guest: 'Robin Ronald Aeppli', listing: 'The R Loft Bali - Cosy Room incl Breakfast, Roof Top', channel: 'Direct', type: 'Baby', amount: 25.00, currency: 'CHF', invoice: 'inv_ups_012_aeppli_baby.pdf', synced: true, syncedAt: '2026-05-07T10:30:00Z', note: 'Baby cot and high chair setup.' },
  // ── Unsynced (May 10–12) ─────────────────────────────────────────────────
  { id: 'ups-013', date: '2026-05-10', reservationId: '86555874', guest: 'Cameron Skillcorn', listing: 'TAMBORA - The R Tambora: Stylish 3BR Tropical Escape', channel: 'Direct', type: 'Airport Transport', amount: 90.00, currency: 'CHF', invoice: 'inv_ups_013_skillcorn_transfer.pdf', synced: false, note: 'Ngurah Rai airport → Tambora, 2 passengers.' },
  { id: 'ups-014', date: '2026-05-11', reservationId: '84721653', guest: 'Amanda Healey', listing: 'Cozy 2BR- the R Villa Sinabung w/ Pool in Sanur', channel: 'Booking.com', type: 'Spa', amount: 80.00, currency: 'CHF', invoice: 'inv_ups_014_healey_spa.pdf', synced: false, note: 'In-villa massage session for 1.' },
  { id: 'ups-015', date: '2026-05-11', reservationId: '86596428', guest: 'Khasan Alshalabi', listing: 'BRATAN - The R Bratan | 3BR- Serene Getaway in Canggu', channel: 'Direct', type: 'Activity', amount: 55.00, currency: 'CHF', invoice: 'inv_ups_015_alshalabi_activity.pdf', synced: false, note: 'Surfing lesson, 2 hours.' },
  { id: 'ups-016', date: '2026-05-11', reservationId: '86612933', guest: 'Alexandr Reimer', listing: 'The R Loft - Cosy Suite incl Breakfast, Roof Top, Communal Kitchen and Bathroom', channel: 'Booking.com', type: 'Office Equipment', amount: 22.00, currency: 'CHF', invoice: 'inv_ups_016_reimer_office.pdf', synced: false, note: 'Monitor and keyboard setup.' },
  { id: 'ups-017', date: '2026-05-12', reservationId: '86470236', guest: 'Mikhail Batkovsky', listing: 'The R Apartments Studio walk to the Beach', channel: 'Direct', type: 'Mid-stay Cleaning', amount: 60.00, currency: 'CHF', invoice: 'inv_ups_017_batkovsky_cleaning.pdf', synced: false },
  { id: 'ups-018', date: '2026-05-12', reservationId: '85418022', guest: 'Reto Wyss', listing: 'The R Pererenan Mezzanine Studio + Plunge Pool', channel: 'Direct', type: 'Pet', amount: 35.00, currency: 'CHF', invoice: 'inv_ups_018_wyss_pet.pdf', synced: false, note: 'Pet fee for 1 small dog.' },
]
