import { useColorScheme } from 'react-native';
import { useSettings } from './hooks/useSettings';

export const Colors = {
  light: {
    background:      '#FFF8F0',
    surface:         '#FFFFFF',
    surfaceAlt:      '#FFF3E4',
    primary:         '#B5451B',   // deep saffron
    primaryLight:    '#E07B39',
    accent:          '#8B6914',   // turmeric gold
    accentLight:     '#D4A843',
    text:            '#2C1810',
    textSecondary:   '#6B4226',
    textMuted:       '#9E7A5A',
    border:          '#E8D5BE',
    sanskrit:        '#1A3A5C',   // deep blue for Devanagari
    transliteration: '#5C3D2E',
    tabBar:          '#FFFFFF',
    tabBarBorder:    '#E8D5BE',
    card:            '#FFFFFF',
    cardBorder:      '#F0E0CC',
    heartActive:     '#C0392B',
    heartInactive:   '#CCBBAA',
  },
  dark: {
    background:      '#1A0800', // updated: deeper pure dark brown (was #1A0F0A)
    surface:         '#2E1700', // updated: richer dark brown card bg (was #2A1A10)
    surfaceAlt:      '#231508',
    primary:         '#F7A05B', // updated: warmer orange for numbers/badges (was #E07B39)
    primaryLight:    '#F0A060',
    accent:          '#EECE67', // updated: brighter yellow-gold (was #D4A843)
    accentLight:     '#E8C060',
    text:            '#E8D5BE', // updated: softer parchment, less harsh (was #FAF1EA)
    textSecondary:   '#F0CFAC', // updated: warm italic/secondary text (was #D4A87A)
    textMuted:       '#C1A181', // updated: chapter label text (was #9E7A5A)
    border:          '#3D2510',
    sanskrit:        '#A5CBE8', // updated: softer lighter blue (was #7BA7D0)
    transliteration: '#C4A882',
    tabBar:          '#1E0F08',
    tabBarBorder:    '#3D2510',
    card:            '#2E1700', // updated: matches surface (was #2A1A10)
    cardBorder:      '#2E1700', // no border — same as card (was #3D2510)
    heartActive:     '#E05040',
    heartInactive:   '#5A3A2A',
  },
};

export function useTheme() {
  const systemScheme = useColorScheme();
  const { settings } = useSettings();
  const effective = settings.theme === 'system' ? systemScheme : settings.theme;
  return effective === 'dark' ? Colors.dark : Colors.light;
}
