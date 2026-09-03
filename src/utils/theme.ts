import { ThemeMode } from '../types';

export interface ThemeConfig {
  id: ThemeMode;
  nameFa: string;
  nameEn: string;
  colorHex: string;
  bgClass: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  glowClass: string;
  badgeBg: string;
  badgeText: string;
  gradientBg: string;
  headerBg: string;
  iconColor: string;
  activeIndicator: string;
}

export const THEMES: Record<ThemeMode, ThemeConfig> = {
  pink: {
    id: 'pink',
    nameFa: 'صورتی نئونی (Cyber Pink)',
    nameEn: 'Neon Pink',
    colorHex: '#f43f5e',
    bgClass: 'bg-[#120613] text-pink-50',
    cardBg: 'bg-[#1e0a21]/90 backdrop-blur-xl',
    cardBorder: 'border-pink-900/50 hover:border-pink-500/60',
    textPrimary: 'text-pink-100',
    textSecondary: 'text-pink-300/70',
    accent: 'text-pink-400',
    accentBg: 'bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 text-white shadow-lg shadow-pink-600/30 hover:shadow-pink-500/50',
    accentBorder: 'border-pink-500/70',
    glowClass: 'shadow-[0_0_25px_rgba(244,63,94,0.35)]',
    badgeBg: 'bg-pink-950/80 border border-pink-500/40 text-pink-300',
    badgeText: 'text-pink-300',
    gradientBg: 'from-[#200a23] via-[#120613] to-[#0a030b]',
    headerBg: 'bg-[#18071a]/95 border-b border-pink-900/60',
    iconColor: 'text-pink-400',
    activeIndicator: 'bg-pink-500 shadow-[0_0_12px_#ec4899]',
  },
  black: {
    id: 'black',
    nameFa: 'سیاه مات عمیق (OLED Black)',
    nameEn: 'OLED Black',
    colorHex: '#27272a',
    bgClass: 'bg-[#050507] text-zinc-100',
    cardBg: 'bg-[#0f0f13]/95 backdrop-blur-xl',
    cardBorder: 'border-zinc-800 hover:border-zinc-600',
    textPrimary: 'text-zinc-100',
    textSecondary: 'text-zinc-400',
    accent: 'text-zinc-100',
    accentBg: 'bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-300 text-zinc-950 shadow-lg shadow-white/10 hover:shadow-white/20 font-bold',
    accentBorder: 'border-zinc-400',
    glowClass: 'shadow-[0_0_25px_rgba(255,255,255,0.15)]',
    badgeBg: 'bg-zinc-900 border border-zinc-700 text-zinc-200',
    badgeText: 'text-zinc-200',
    gradientBg: 'from-[#121217] via-[#08080a] to-[#020203]',
    headerBg: 'bg-[#09090d]/95 border-b border-zinc-800/80',
    iconColor: 'text-zinc-300',
    activeIndicator: 'bg-zinc-100 shadow-[0_0_12px_#ffffff]',
  },
  yellow: {
    id: 'yellow',
    nameFa: 'زرد سایبرپانک (Cyber Yellow)',
    nameEn: 'Cyber Yellow',
    colorHex: '#eab308',
    bgClass: 'bg-[#121004] text-yellow-50',
    cardBg: 'bg-[#1f1a08]/90 backdrop-blur-xl',
    cardBorder: 'border-yellow-900/50 hover:border-yellow-500/60',
    textPrimary: 'text-yellow-100',
    textSecondary: 'text-yellow-200/70',
    accent: 'text-yellow-400',
    accentBg: 'bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-400 text-black font-extrabold shadow-lg shadow-yellow-500/30 hover:shadow-yellow-400/50',
    accentBorder: 'border-yellow-500/70',
    glowClass: 'shadow-[0_0_25px_rgba(234,179,8,0.35)]',
    badgeBg: 'bg-yellow-950/80 border border-yellow-500/40 text-yellow-300',
    badgeText: 'text-yellow-300',
    gradientBg: 'from-[#241e06] via-[#121004] to-[#080701]',
    headerBg: 'bg-[#181404]/95 border-b border-yellow-900/60',
    iconColor: 'text-yellow-400',
    activeIndicator: 'bg-yellow-400 shadow-[0_0_12px_#facc15]',
  },
};
