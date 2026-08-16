import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { getTopic } from '@/content/curriculum';
import { useLearner } from '@/state/LearnerContext';
import { takeLastSummary } from '@/state/lastSession';
import { Button, Card, EmptyState, Stat } from '@/ui/components';
import { colours, spacing, type } from '@/ui/theme';

export default function ResultsScreen() {
  const router = useRouter();
  const { refresh, nextTopic } = useLearner();

  // Read once on mount; the practice screen has already stored it.
  const summary = useMemo(() => takeLastSummary(), []);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  if (!summary) {
    return (
      <View style={styles.emptyWrap}>
        <EmptyState
          title="No session to show"
          body="Finish a practice session to see your results here."
        />
        <View style={styles.emptyAction}>
          <Button label="Back to Today" onPress={() => router.replace('/')} />
        </View>
      </View>
    );
  }

  const topic = getTopic(summary.topicId);
  const percent = summary.total
    ? Math.round((summary.correct / summary.total) * 100)
    : 0;
  const moved = summary.gradeAfter - summary.gradeBefore;
  const improved = summary.thetaDelta > 0;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card style={styles.hero}>
        <Ionicons
          name={percent >= 70 ? 'trophy' : 'flag'}
          size={40}
          color={percent >= 70 ? colours.warning : colours.primary}
        />
        <Text style={styles.heroTitle}>
          {summary.correct} out of {summary.total}
        </Text>
        <Text style={styles.heroSubtitle}>{topic?.title ?? 'Practice'} · {percent}%</Text>

        <View style={styles.stats}>
          <Stat value={`+${summary.xpEarned}`} label="XP earned" colour={colours.primary} />
          <Stat
            value={summary.gradeAfter}
            label="topic grade"
            colour={improved ? colours.success : colours.text}
          />
          <Stat
            value={moved === 0 ? '–' : `${moved > 0 ? '+' : ''}${moved}`}
            label="grade change"
            colour={moved > 0 ? colours.success : moved < 0 ? colours.error : colours.textMuted}
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.abilityTitle}>
          {improved
            ? 'Your ability estimate went up'
            : summary.thetaDelta < 0
              ? 'Your ability estimate came down slightly'
              : 'Your ability estimate held steady'}
        </Text>
        <Text style={styles.abilityBody}>
          {improved
            ? 'The next session on this topic will serve you harder questions.'
            : 'The next session will ease off a little so you can rebuild confidence.'}
        </Text>
      </Card>

      <Text style={styles.sectionTitle}>Question by question</Text>
      <Card>
        {summary.answered.map((entry, index) => (
          <View key={entry.question.id}>
            {index > 0 && <View style={styles.divider} />}
            <View style={styles.reviewRow}>
              <Ionicons
                name={entry.correct ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={entry.correct ? colours.success : colours.error}
              />
              <View style={styles.reviewMain}>
                <Text style={styles.reviewStem} numberOfLines={2}>
                  {entry.question.stem}
                </Text>
                <Text style={styles.reviewMeta}>
                  Grade {entry.question.grade}
                  {entry.usedHint ? ' · hint used' : ''}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </Card>

      <View style={styles.actions}>
        <Button
          label="Practise this topic again"
          onPress={() => router.replace(`/practice/${summary.topicId}`)}
        />
        {nextTopic && nextTopic.id !== summary.topicId && (
          <Button
            label={`Move on to ${nextTopic.title}`}
            variant="secondary"
            onPress={() => router.replace(`/practice/${nextTopic.id}`)}
          />
        )}
        <Button label="Back to Today" variant="secondary" onPress={() => router.replace('/')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  emptyWrap: { flex: 1, justifyContent: 'center', padding: spacing.md },
  emptyAction: { marginTop: spacing.md },
  hero: { alignItems: 'center', paddingVertical: spacing.lg },
  heroTitle: { ...type.display, color: colours.text, marginTop: spacing.sm },
  heroSubtitle: { ...type.body, color: colours.textMuted },
  stats: { flexDirection: 'row', marginTop: spacing.lg, alignSelf: 'stretch' },
  abilityTitle: { ...type.heading, color: colours.text },
  abilityBody: { ...type.body, color: colours.textMuted, marginTop: spacing.xs },
  sectionTitle: { ...type.label, color: colours.textMuted, textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: colours.border, marginVertical: spacing.sm },
  reviewRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  reviewMain: { flex: 1 },
  reviewStem: { ...type.body, color: colours.text },
  reviewMeta: { ...type.caption, color: colours.textMuted, marginTop: 2 },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
