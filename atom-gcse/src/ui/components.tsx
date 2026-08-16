/** Small shared UI pieces used across screens. */

import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { colours, radius, spacing, type } from './theme';

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.buttonPrimary : styles.buttonSecondary,
        pressed && !disabled && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text style={isPrimary ? styles.buttonLabelPrimary : styles.buttonLabelSecondary}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Horizontal progress bar. `value` is 0..1 and is clamped. */
export function ProgressBar({
  value,
  colour = colours.primary,
}: {
  value: number;
  colour?: string;
}) {
  const percent = `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` as const;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: percent, backgroundColor: colour }]} />
    </View>
  );
}

/** Small coloured chip, used for mastery states and tags. */
export function Pill({ label, colour }: { label: string; colour: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: `${colour}1A` }]}>
      <Text style={[styles.pillLabel, { color: colour }]}>{label}</Text>
    </View>
  );
}

/** A big number with a caption, for the stat rows on Today and Progress. */
export function Stat({
  value,
  label,
  colour = colours.text,
}: {
  value: string | number;
  label: string;
  colour?: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: colour }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colours.primary} />
      <Text style={styles.loadingLabel}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Card style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colours.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colours.border,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: { backgroundColor: colours.primary },
  buttonSecondary: {
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.border,
  },
  buttonPressed: { opacity: 0.85 },
  buttonDisabled: { opacity: 0.4 },
  buttonLabelPrimary: { ...type.heading, color: colours.textInverse },
  buttonLabelSecondary: { ...type.heading, color: colours.text },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colours.border,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radius.pill },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  pillLabel: { ...type.caption },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { ...type.title },
  statLabel: { ...type.caption, color: colours.textMuted, marginTop: 2 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  loadingLabel: { ...type.caption, color: colours.textMuted },
  empty: { alignItems: 'center', gap: spacing.xs },
  emptyTitle: { ...type.heading, color: colours.text },
  emptyBody: { ...type.body, color: colours.textMuted, textAlign: 'center' },
});
