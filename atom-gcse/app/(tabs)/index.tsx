import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { getStrand } from '@/content/curriculum';
import { useLearner } from '@/state/LearnerContext';
import { Button, Card, EmptyState, Loading, Pill, ProgressBar, Stat } from '@/ui/components';
import { MASTERY_COLOURS, MASTERY_LABELS, colours, spacing, type } from '@/ui/theme';

export default function TodayScreen() {
  const router = useRouter();
  const { ready, learner, predicted, nextTopic, masteryFor, progressFor, refresh } =
    useLearner();

  // Progress changes while a session is running, so re-read it on return.
  useFocusEffect(
    useCallback(() => {
      refresh().catch(() => {});
    }, [refresh]),
  );

  if (!ready) return <Loading label="Getting things ready…" />;

  const strand = nextTopic ? getStrand(nextTopic.strandId) : undefined;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.greeting}>Ready for a session?</Text>
        <Text style={styles.subGreeting}>
          Ten questions, picked to sit just past what you can already do.
        </Text>
        <View style={styles.stats}>
          <Stat value={`🔥 ${learner.streakDays}`} label="day streak" colour={colours.streak} />
          <Stat value={learner.xp} label="total XP" />
          <Stat value={predicted} label="predicted grade" colour={colours.primary} />
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Up next</Text>

      {nextTopic ? (
        <Card>
          <View style={styles.nextHeader}>
            <View style={styles.nextHeading}>
              <Text style={styles.strandLabel}>{strand?.title}</Text>
              <Text style={styles.topicTitle}>{nextTopic.title}</Text>
            </View>
            <Pill
              label={MASTERY_LABELS[masteryFor(nextTopic)]}
              colour={MASTERY_COLOURS[masteryFor(nextTopic)]}
            />
          </View>

          <Text style={styles.topicBlurb}>{nextTopic.blurb}</Text>

          <View style={styles.progressRow}>
            <ProgressBar
              value={progressFor(nextTopic)}
              colour={strand?.colour ?? colours.primary}
            />
            <Text style={styles.progressLabel}>
              {Math.round(progressFor(nextTopic) * 100)}% toward grade {nextTopic.targetGrade}
            </Text>
          </View>

          <View style={styles.cta}>
            <Button
              label="Start practice"
              onPress={() => router.push(`/practice/${nextTopic.id}`)}
            />
          </View>
        </Card>
      ) : (
        <EmptyState
          title="Everything is mastered"
          body="You have cleared every topic with questions available. Add more content, or switch tier in Progress to unlock harder material."
        />
      )}

      <Text style={styles.sectionTitle}>How this works</Text>
      <Card>
        <Explainer
          icon="trending-up-outline"
          title="It adapts as you go"
          body="Every answer updates an estimate of what you can do, and the next question is chosen to give you about a 75% chance of getting it right."
        />
        <View style={styles.divider} />
        <Explainer
          icon="git-network-outline"
          title="Topics unlock in order"
          body="A topic is suggested once the ones underneath it are secure, so you are never thrown in at the deep end."
        />
        <View style={styles.divider} />
        <Explainer
          icon="school-outline"
          title="Grades, not scores"
          body="Your ability on each topic is shown as a predicted GCSE grade, so you know exactly where you stand."
        />
      </Card>
    </ScrollView>
  );
}

function Explainer({
  icon,
  title,
  body,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.explainer}>
      <Ionicons name={icon} size={22} color={colours.primary} />
      <View style={styles.explainerText}>
        <Text style={styles.explainerTitle}>{title}</Text>
        <Text style={styles.explainerBody}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  greeting: { ...type.title, color: colours.text },
  subGreeting: { ...type.body, color: colours.textMuted, marginTop: spacing.xs },
  stats: { flexDirection: 'row', marginTop: spacing.md },
  sectionTitle: { ...type.label, color: colours.textMuted, textTransform: 'uppercase' },
  nextHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  nextHeading: { flex: 1 },
  strandLabel: { ...type.caption, color: colours.textMuted },
  topicTitle: { ...type.title, color: colours.text },
  topicBlurb: { ...type.body, color: colours.textMuted, marginTop: spacing.sm },
  progressRow: { marginTop: spacing.md, gap: spacing.xs },
  progressLabel: { ...type.caption, color: colours.textMuted },
  cta: { marginTop: spacing.md },
  explainer: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  explainerText: { flex: 1 },
  explainerTitle: { ...type.heading, color: colours.text },
  explainerBody: { ...type.body, color: colours.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: colours.border, marginVertical: spacing.md },
});
