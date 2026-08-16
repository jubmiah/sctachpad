import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { STRANDS, topicsForTier } from '@/content/curriculum';
import { hasContent } from '@/content/questions';
import * as repository from '@/data/repository';
import { predictedGrade, reviewPriority, thetaToGrade } from '@/domain/ability';
import type { Grade, Tier } from '@/domain/types';
import { useLearner } from '@/state/LearnerContext';
import { Card, EmptyState, Loading, ProgressBar, Stat } from '@/ui/components';
import { colours, radius, spacing, type } from '@/ui/theme';

const TIERS: Tier[] = ['foundation', 'higher'];
const TARGET_GRADES: Grade[] = [4, 5, 6, 7, 8, 9];

export default function ProgressScreen() {
  const {
    ready,
    learner,
    predicted,
    abilityFor,
    refresh,
    setSettings,
    resetProgress,
  } = useLearner();
  const [totals, setTotals] = useState({ total: 0, correct: 0 });

  useFocusEffect(
    useCallback(() => {
      refresh().catch(() => {});
      repository.getTotalAttempts().then(setTotals).catch(() => {});
    }, [refresh]),
  );

  const topics = useMemo(() => topicsForTier(learner.tier), [learner.tier]);

  /** Predicted grade per strand, using only topics the student has actually attempted. */
  const strandRows = useMemo(
    () =>
      STRANDS.map((strand) => {
        const strandTopics = topics.filter((topic) => topic.strandId === strand.id);
        const abilities = strandTopics.map((topic) => abilityFor(topic.id));
        const practised = abilities.filter((ability) => ability.attempts > 0);
        return {
          strand,
          practised: practised.length,
          totalTopics: strandTopics.length,
          grade: practised.length
            ? predictedGrade(practised, learner.targetGrade)
            : null,
        };
      }).filter((row) => row.totalTopics > 0),
    [topics, abilityFor, learner.targetGrade],
  );

  /** Topics furthest from their target, so the student knows where to spend time. */
  const weakest = useMemo(
    () =>
      topics
        .filter((topic) => hasContent(topic.id) && abilityFor(topic.id).attempts > 0)
        .map((topic) => ({
          topic,
          ability: abilityFor(topic.id),
          priority: reviewPriority(abilityFor(topic.id), topic.targetGrade),
        }))
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 4),
    [topics, abilityFor],
  );

  const confirmReset = () => {
    Alert.alert(
      'Reset all progress?',
      'This deletes every answer, ability score, streak and XP. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetProgress()
              .then(() => repository.getTotalAttempts())
              .then(setTotals)
              .catch(() => {});
          },
        },
      ],
    );
  };

  if (!ready) return <Loading />;

  const accuracy = totals.total
    ? Math.round((totals.correct / totals.total) * 100)
    : 0;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.cardTitle}>Predicted grade</Text>
        <Text style={styles.bigGrade}>{predicted}</Text>
        <Text style={styles.cardBody}>
          {totals.total === 0
            ? `Based on your target of grade ${learner.targetGrade} — answer some questions to refine it.`
            : `Weighted across every topic you have practised, from ${totals.total} answers.`}
        </Text>
        <View style={styles.stats}>
          <Stat value={totals.total} label="questions answered" />
          <Stat value={`${accuracy}%`} label="accuracy" />
          <Stat value={learner.xp} label="XP" />
        </View>
      </Card>

      <Text style={styles.sectionTitle}>By strand</Text>
      <Card>
        {strandRows.map((row, index) => (
          <View key={row.strand.id}>
            {index > 0 && <View style={styles.divider} />}
            <View style={styles.strandRow}>
              <View style={styles.strandInfo}>
                <Text style={styles.strandTitle}>{row.strand.title}</Text>
                <Text style={styles.strandMeta}>
                  {row.practised} of {row.totalTopics} topics started
                </Text>
              </View>
              <Text style={[styles.strandGrade, { color: row.strand.colour }]}>
                {row.grade ?? '–'}
              </Text>
            </View>
            <ProgressBar
              value={row.totalTopics ? row.practised / row.totalTopics : 0}
              colour={row.strand.colour}
            />
          </View>
        ))}
      </Card>

      <Text style={styles.sectionTitle}>Focus on these</Text>
      {weakest.length === 0 ? (
        <EmptyState
          title="Nothing to review yet"
          body="Finish a practice session and the topics needing the most work will show up here."
        />
      ) : (
        <Card>
          {weakest.map(({ topic, ability }, index) => (
            <View key={topic.id}>
              {index > 0 && <View style={styles.divider} />}
              <View style={styles.weakRow}>
                <View style={styles.weakInfo}>
                  <Text style={styles.weakTitle}>{topic.title}</Text>
                  <Text style={styles.weakMeta}>
                    {ability.correct}/{ability.attempts} correct · target grade{' '}
                    {topic.targetGrade}
                  </Text>
                </View>
                <Text style={styles.weakGrade}>{thetaToGrade(ability.theta)}</Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      <Text style={styles.sectionTitle}>Settings</Text>
      <Card>
        <Text style={styles.settingLabel}>Tier</Text>
        <View style={styles.chips}>
          {TIERS.map((tier) => (
            <Chip
              key={tier}
              label={tier === 'foundation' ? 'Foundation' : 'Higher'}
              selected={learner.tier === tier}
              onPress={() => setSettings(tier, learner.targetGrade)}
            />
          ))}
        </View>

        <Text style={[styles.settingLabel, styles.settingSpacing]}>Target grade</Text>
        <View style={styles.chips}>
          {TARGET_GRADES.map((grade) => (
            <Chip
              key={grade}
              label={String(grade)}
              selected={learner.targetGrade === grade}
              onPress={() => setSettings(learner.tier, grade)}
            />
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={confirmReset}
          style={({ pressed }) => [styles.reset, pressed && styles.resetPressed]}
        >
          <Text style={styles.resetLabel}>Reset all progress</Text>
        </Pressable>
      </Card>
    </ScrollView>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.chipPressed,
      ]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  cardTitle: { ...type.label, color: colours.textMuted, textTransform: 'uppercase' },
  bigGrade: { ...type.display, fontSize: 56, color: colours.primary },
  cardBody: { ...type.body, color: colours.textMuted },
  stats: { flexDirection: 'row', marginTop: spacing.md },
  sectionTitle: { ...type.label, color: colours.textMuted, textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: colours.border, marginVertical: spacing.md },
  strandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  strandInfo: { flex: 1 },
  strandTitle: { ...type.heading, color: colours.text },
  strandMeta: { ...type.caption, color: colours.textMuted },
  strandGrade: { ...type.title },
  weakRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weakInfo: { flex: 1 },
  weakTitle: { ...type.heading, color: colours.text },
  weakMeta: { ...type.caption, color: colours.textMuted },
  weakGrade: { ...type.title, color: colours.warning },
  settingLabel: { ...type.label, color: colours.text },
  settingSpacing: { marginTop: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colours.border,
    backgroundColor: colours.background,
  },
  chipSelected: { backgroundColor: colours.primary, borderColor: colours.primary },
  chipPressed: { opacity: 0.7 },
  chipLabel: { ...type.label, color: colours.text },
  chipLabelSelected: { color: colours.textInverse },
  reset: { marginTop: spacing.lg, alignItems: 'center' },
  resetPressed: { opacity: 0.6 },
  resetLabel: { ...type.label, color: colours.error },
});
