import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { topicsByStrand } from '@/content/curriculum';
import { hasContent, questionsForTopic } from '@/content/questions';
import { useLearner } from '@/state/LearnerContext';
import { Loading, Pill, ProgressBar } from '@/ui/components';
import {
  MASTERY_COLOURS,
  MASTERY_LABELS,
  colours,
  radius,
  spacing,
  type,
} from '@/ui/theme';

export default function LearnScreen() {
  const router = useRouter();
  const { ready, learner, masteryFor, progressFor, refresh } = useLearner();

  useFocusEffect(
    useCallback(() => {
      refresh().catch(() => {});
    }, [refresh]),
  );

  const groups = useMemo(() => topicsByStrand(learner.tier), [learner.tier]);

  if (!ready) return <Loading />;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        {learner.tier === 'higher' ? 'Higher' : 'Foundation'} tier · tap a topic to
        practise it
      </Text>

      {groups.map(({ strand, topics }) => (
        <View key={strand.id} style={styles.group}>
          <View style={styles.strandHeader}>
            <View style={[styles.strandDot, { backgroundColor: strand.colour }]} />
            <Text style={styles.strandTitle}>{strand.title}</Text>
          </View>
          <Text style={styles.strandBlurb}>{strand.blurb}</Text>

          <View style={styles.topics}>
            {topics.map((topic) => {
              const available = hasContent(topic.id);
              const mastery = masteryFor(topic);

              return (
                <Pressable
                  key={topic.id}
                  accessibilityRole="button"
                  disabled={!available}
                  onPress={() => router.push(`/practice/${topic.id}`)}
                  style={({ pressed }) => [
                    styles.topicRow,
                    pressed && styles.topicPressed,
                    !available && styles.topicUnavailable,
                  ]}
                >
                  <View style={styles.topicMain}>
                    <View style={styles.topicTitleRow}>
                      <Text style={styles.topicTitle}>{topic.title}</Text>
                      {topic.tier === 'higher' && <Pill label="Higher" colour={colours.warning} />}
                    </View>
                    <Text style={styles.topicBlurb} numberOfLines={2}>
                      {topic.blurb}
                    </Text>

                    {available ? (
                      <>
                        <View style={styles.progressWrap}>
                          <ProgressBar value={progressFor(topic)} colour={strand.colour} />
                        </View>
                        <View style={styles.topicMeta}>
                          <Pill
                            label={MASTERY_LABELS[mastery]}
                            colour={MASTERY_COLOURS[mastery]}
                          />
                          <Text style={styles.metaText}>
                            {questionsForTopic(topic.id).length} questions · target grade{' '}
                            {topic.targetGrade}
                          </Text>
                        </View>
                      </>
                    ) : (
                      <Text style={styles.comingSoon}>Questions coming soon</Text>
                    )}
                  </View>

                  {available && (
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colours.textMuted}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.lg, paddingBottom: spacing.xl },
  intro: { ...type.caption, color: colours.textMuted },
  group: { gap: spacing.sm },
  strandHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  strandDot: { width: 10, height: 10, borderRadius: radius.pill },
  strandTitle: { ...type.title, color: colours.text },
  strandBlurb: { ...type.caption, color: colours.textMuted },
  topics: { gap: spacing.sm, marginTop: spacing.xs },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colours.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colours.border,
    padding: spacing.md,
  },
  topicPressed: { opacity: 0.7 },
  topicUnavailable: { opacity: 0.55 },
  topicMain: { flex: 1, gap: 2 },
  topicTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  topicTitle: { ...type.heading, color: colours.text },
  topicBlurb: { ...type.caption, color: colours.textMuted },
  progressWrap: { marginTop: spacing.sm },
  topicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  metaText: { ...type.caption, color: colours.textMuted, flexShrink: 1 },
  comingSoon: { ...type.caption, color: colours.textMuted, marginTop: spacing.sm },
});
