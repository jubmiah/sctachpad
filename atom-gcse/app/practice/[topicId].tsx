import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getStrand, getTopic } from '@/content/curriculum';
import { correctAnswerText, parseNumericInput } from '@/domain/marking';
import type { StudentAnswer } from '@/domain/marking';
import { useLearner } from '@/state/LearnerContext';
import { setLastSummary } from '@/state/lastSession';
import { usePracticeSession } from '@/state/usePracticeSession';
import { Button, Card, EmptyState, Loading, ProgressBar } from '@/ui/components';
import { colours, radius, spacing, type } from '@/ui/theme';

export default function PracticeScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const router = useRouter();
  const { learner } = useLearner();

  const session = usePracticeSession(topicId, learner.targetGrade);
  const {
    status,
    question,
    questionNumber,
    totalQuestions,
    usedHint,
    lastCorrect,
    summary,
    revealHint,
    submit,
    advance,
  } = session;

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [numericInput, setNumericInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const topic = getTopic(topicId);
  const strand = topic ? getStrand(topic.strandId) : undefined;
  const answered = lastCorrect !== null;

  // Clear the input when a new question arrives.
  useEffect(() => {
    setSelectedOption(null);
    setNumericInput('');
  }, [question?.id]);

  // The session writes its summary, then we hand it to the results screen.
  useEffect(() => {
    if (status === 'finished' && summary) {
      setLastSummary(summary);
      router.replace('/practice/results');
    }
  }, [status, summary, router]);

  if (status === 'loading') return <Loading label="Choosing your questions…" />;

  if (status === 'empty' || !topic) {
    return (
      <View style={styles.emptyWrap}>
        <EmptyState
          title="No questions yet"
          body="This topic is in the curriculum but has no questions written for it. Pick another topic from Learn."
        />
      </View>
    );
  }

  if (status === 'finished' || !question) return <Loading label="Wrapping up…" />;

  const buildAnswer = (): StudentAnswer | null => {
    if (question.kind === 'multiple-choice') {
      return selectedOption === null
        ? null
        : { kind: 'multiple-choice', optionIndex: selectedOption };
    }
    const value = parseNumericInput(numericInput);
    return value === null ? null : { kind: 'numeric', value };
  };

  const answer = buildAnswer();

  const onSubmit = async () => {
    if (!answer || submitting) return;
    setSubmitting(true);
    try {
      const correct = await submit(answer);
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(
          correct
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Error,
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onNext = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await advance();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: topic.title }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            Question {questionNumber} of {totalQuestions}
          </Text>
          <Text style={styles.gradeTag}>Grade {question.grade}</Text>
        </View>
        <ProgressBar
          value={(questionNumber - 1) / Math.max(totalQuestions, 1)}
          colour={strand?.colour ?? colours.primary}
        />

        <Card style={styles.questionCard}>
          <Text style={styles.stem}>{question.stem}</Text>
          {question.calculator && (
            <View style={styles.calculatorTag}>
              <Ionicons name="calculator-outline" size={14} color={colours.textMuted} />
              <Text style={styles.calculatorText}>Calculator allowed</Text>
            </View>
          )}
        </Card>

        {question.kind === 'multiple-choice' ? (
          <View style={styles.options}>
            {question.options.map((option, index) => {
              const isChosen = selectedOption === index;
              const isAnswer = index === question.answerIndex;
              const showAsCorrect = answered && isAnswer;
              const showAsWrong = answered && isChosen && !isAnswer;

              return (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isChosen, disabled: answered }}
                  disabled={answered}
                  onPress={() => setSelectedOption(index)}
                  style={({ pressed }) => [
                    styles.option,
                    isChosen && !answered && styles.optionChosen,
                    showAsCorrect && styles.optionCorrect,
                    showAsWrong && styles.optionWrong,
                    pressed && !answered && styles.optionPressed,
                  ]}
                >
                  <Text style={styles.optionText}>{option}</Text>
                  {showAsCorrect && (
                    <Ionicons name="checkmark-circle" size={20} color={colours.success} />
                  )}
                  {showAsWrong && (
                    <Ionicons name="close-circle" size={20} color={colours.error} />
                  )}
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.numericWrap}>
            <TextInput
              style={[
                styles.numericInput,
                answered && (lastCorrect ? styles.inputCorrect : styles.inputWrong),
              ]}
              value={numericInput}
              onChangeText={setNumericInput}
              editable={!answered}
              keyboardType="numbers-and-punctuation"
              placeholder="Your answer"
              placeholderTextColor={colours.textMuted}
              accessibilityLabel="Your answer"
              onSubmitEditing={onSubmit}
              returnKeyType="done"
            />
            {question.unit && <Text style={styles.unit}>{question.unit}</Text>}
          </View>
        )}

        {!answered && question.hint && (
          <Pressable
            accessibilityRole="button"
            onPress={revealHint}
            disabled={usedHint}
            style={styles.hintButton}
          >
            <Ionicons name="bulb-outline" size={16} color={colours.warning} />
            <Text style={styles.hintButtonText}>
              {usedHint ? 'Hint shown' : 'Show a hint (worth half credit)'}
            </Text>
          </Pressable>
        )}

        {usedHint && question.hint && !answered && (
          <Card style={styles.hintCard}>
            <Text style={styles.hintText}>{question.hint}</Text>
          </Card>
        )}

        {answered && (
          <Card
            style={[
              styles.feedbackCard,
              lastCorrect ? styles.feedbackCorrect : styles.feedbackWrong,
            ]}
          >
            <Text
              style={[
                styles.feedbackTitle,
                { color: lastCorrect ? colours.success : colours.error },
              ]}
            >
              {lastCorrect ? 'Correct' : `Not quite — the answer is ${correctAnswerText(question)}`}
            </Text>
            {question.solution.map((step, index) => (
              <Text key={index} style={styles.solutionStep}>
                {index + 1}. {step}
              </Text>
            ))}
          </Card>
        )}

        <View style={styles.actions}>
          {answered ? (
            <Button
              label={questionNumber === totalQuestions ? 'Finish session' : 'Next question'}
              onPress={onNext}
              disabled={submitting}
            />
          ) : (
            <Button label="Check answer" onPress={onSubmit} disabled={!answer || submitting} />
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  emptyWrap: { flex: 1, justifyContent: 'center', padding: spacing.md },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { ...type.caption, color: colours.textMuted },
  gradeTag: { ...type.caption, color: colours.textMuted },
  questionCard: { paddingVertical: spacing.lg },
  stem: { ...type.title, fontSize: 20, color: colours.text, lineHeight: 28 },
  calculatorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  calculatorText: { ...type.caption, color: colours.textMuted },
  options: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colours.surface,
    borderWidth: 2,
    borderColor: colours.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  optionChosen: { borderColor: colours.primary },
  optionCorrect: { borderColor: colours.success, backgroundColor: colours.successSurface },
  optionWrong: { borderColor: colours.error, backgroundColor: colours.errorSurface },
  optionPressed: { opacity: 0.75 },
  optionText: { ...type.body, color: colours.text, flex: 1 },
  numericWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  numericInput: {
    flex: 1,
    ...type.title,
    color: colours.text,
    backgroundColor: colours.surface,
    borderWidth: 2,
    borderColor: colours.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  inputCorrect: { borderColor: colours.success, backgroundColor: colours.successSurface },
  inputWrong: { borderColor: colours.error, backgroundColor: colours.errorSurface },
  unit: { ...type.heading, color: colours.textMuted },
  hintButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  hintButtonText: { ...type.label, color: colours.warning },
  hintCard: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  hintText: { ...type.body, color: '#92400E' },
  feedbackCard: { gap: spacing.xs },
  feedbackCorrect: { borderColor: colours.success, backgroundColor: colours.successSurface },
  feedbackWrong: { borderColor: colours.error, backgroundColor: colours.errorSurface },
  feedbackTitle: { ...type.heading, marginBottom: spacing.xs },
  solutionStep: { ...type.body, color: colours.text, lineHeight: 22 },
  actions: { marginTop: spacing.sm },
});
