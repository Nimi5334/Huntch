/**
 * lib/venue.ts — business-type → role mapping
 *
 * Single source of truth for which roles are relevant to each venue type.
 * Import this anywhere roles need to be listed (PostJobModal, GapTrigger,
 * pool filters, workforce filters, home page).
 */
import type { Role, VenueType } from './types';

export const ROLE_HE: Record<Role, string> = {
  barista:         'בריסטה',
  server:          'מלצר/ית',
  cook:            'טבח/ית',
  'line-cook':     'טבח קו',
  dishwasher:      'שטיפת כלים',
  bartender:       'ברמן/ית',
  cashier:         'קופאי/ת',
  host:            'מארח/ת',
  delivery:        'שליח/ה',
  'shift-manager': 'אחמ״ש',
};

export const ROLE_ICON: Record<Role, string> = {
  barista:         '☕',
  server:          '🍽',
  cook:            '👨‍🍳',
  'line-cook':     '🔥',
  dishwasher:      '🫧',
  bartender:       '🍸',
  cashier:         '💳',
  host:            '🤝',
  delivery:        '🛵',
  'shift-manager': '📋',
};

export const VENUE_HE: Record<VenueType, string> = {
  cafe:       'בית קפה',
  restaurant: 'מסעדה',
  bar:        'בר',
  'fast-food':'מזון מהיר',
  catering:   'קייטרינג',
  hotel:      'מלון',
};

/** Roles that make sense for each venue type — used everywhere roles are listed */
export const VENUE_ROLES: Record<VenueType, Role[]> = {
  cafe:        ['barista', 'server', 'cashier', 'host', 'shift-manager'],
  restaurant:  ['server', 'cook', 'line-cook', 'dishwasher', 'host', 'cashier', 'shift-manager'],
  bar:         ['bartender', 'server', 'host', 'cashier', 'shift-manager'],
  'fast-food': ['cashier', 'cook', 'line-cook', 'dishwasher', 'delivery', 'shift-manager'],
  catering:    ['cook', 'line-cook', 'dishwasher', 'server', 'shift-manager'],
  hotel:       ['server', 'host', 'cashier', 'bartender', 'delivery', 'shift-manager'],
};

/** Returns the relevant roles for a venue, falling back to all roles */
export function venueRoles(type: VenueType): Role[] {
  return VENUE_ROLES[type] ?? (Object.keys(ROLE_HE) as Role[]);
}
