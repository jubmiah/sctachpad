/**
 * The GCSE Maths curriculum graph.
 *
 * Six strands following the DfE subject content, shared across AQA / Edexcel / OCR.
 * Topics declare prerequisites, which is what turns a flat list into a learning journey:
 * the recommender only offers a topic once the ones underneath it are secure.
 *
 * `tier` is the lowest tier the topic is examined on — `higher` topics are hidden from
 * a student sitting Foundation.
 */

import type { Strand, StrandId, Topic } from '@/domain/types';

export const STRANDS: Strand[] = [
  {
    id: 'number',
    title: 'Number',
    blurb: 'Fractions, decimals, percentages, indices, surds and standard form.',
    colour: '#2563EB',
  },
  {
    id: 'algebra',
    title: 'Algebra',
    blurb: 'Manipulating expressions, solving equations, sequences and graphs.',
    colour: '#7C3AED',
  },
  {
    id: 'ratio',
    title: 'Ratio & Proportion',
    blurb: 'Sharing, scaling, compound measures and rates of change.',
    colour: '#059669',
  },
  {
    id: 'geometry',
    title: 'Geometry & Measures',
    blurb: 'Angles, shape, Pythagoras, trigonometry, area and volume.',
    colour: '#EA580C',
  },
  {
    id: 'probability',
    title: 'Probability',
    blurb: 'Single and combined events, tree diagrams and Venn diagrams.',
    colour: '#DB2777',
  },
  {
    id: 'statistics',
    title: 'Statistics',
    blurb: 'Averages, charts, scatter graphs and interpreting data.',
    colour: '#0891B2',
  },
];

export const TOPICS: Topic[] = [
  // ---------------------------------------------------------------- Number
  {
    id: 'number.integers',
    strandId: 'number',
    title: 'Integers & Place Value',
    blurb: 'Ordering, rounding and the four operations with negatives.',
    tier: 'foundation',
    prerequisites: [],
    targetGrade: 3,
  },
  {
    id: 'number.factors',
    strandId: 'number',
    title: 'Factors, Multiples & Primes',
    blurb: 'HCF, LCM and writing a number as a product of its prime factors.',
    tier: 'foundation',
    prerequisites: ['number.integers'],
    targetGrade: 4,
  },
  {
    id: 'number.fractions',
    strandId: 'number',
    title: 'Fractions',
    blurb: 'Simplifying, comparing and calculating with fractions.',
    tier: 'foundation',
    prerequisites: ['number.factors'],
    targetGrade: 4,
  },
  {
    id: 'number.decimals',
    strandId: 'number',
    title: 'Decimals & Rounding',
    blurb: 'Decimal arithmetic, significant figures and estimation.',
    tier: 'foundation',
    prerequisites: ['number.integers'],
    targetGrade: 4,
  },
  {
    id: 'number.percentages',
    strandId: 'number',
    title: 'Percentages',
    blurb: 'Percentage of an amount, increase and decrease, reverse percentages.',
    tier: 'foundation',
    prerequisites: ['number.fractions', 'number.decimals'],
    targetGrade: 5,
  },
  {
    id: 'number.indices',
    strandId: 'number',
    title: 'Indices & Roots',
    blurb: 'Index laws, negative and fractional indices.',
    tier: 'foundation',
    prerequisites: ['number.factors'],
    targetGrade: 5,
  },
  {
    id: 'number.standard-form',
    strandId: 'number',
    title: 'Standard Form',
    blurb: 'Writing and calculating with numbers in standard form.',
    tier: 'foundation',
    prerequisites: ['number.indices'],
    targetGrade: 5,
  },
  {
    id: 'number.surds',
    strandId: 'number',
    title: 'Surds',
    blurb: 'Simplifying surds and rationalising denominators.',
    tier: 'higher',
    prerequisites: ['number.indices'],
    targetGrade: 7,
  },
  {
    id: 'number.bounds',
    strandId: 'number',
    title: 'Bounds & Accuracy',
    blurb: 'Upper and lower bounds and error intervals.',
    tier: 'higher',
    prerequisites: ['number.decimals'],
    targetGrade: 6,
  },

  // --------------------------------------------------------------- Algebra
  {
    id: 'algebra.notation',
    strandId: 'algebra',
    title: 'Algebraic Notation',
    blurb: 'Collecting like terms, substitution and simple manipulation.',
    tier: 'foundation',
    prerequisites: ['number.integers'],
    targetGrade: 3,
  },
  {
    id: 'algebra.expanding',
    strandId: 'algebra',
    title: 'Expanding & Factorising',
    blurb: 'Single and double brackets, factorising linear and quadratic expressions.',
    tier: 'foundation',
    prerequisites: ['algebra.notation'],
    targetGrade: 5,
  },
  {
    id: 'algebra.linear-equations',
    strandId: 'algebra',
    title: 'Linear Equations',
    blurb: 'Solving equations with unknowns on both sides and with brackets.',
    tier: 'foundation',
    prerequisites: ['algebra.notation'],
    targetGrade: 4,
  },
  {
    id: 'algebra.formulae',
    strandId: 'algebra',
    title: 'Formulae & Rearranging',
    blurb: 'Substituting into formulae and changing the subject.',
    tier: 'foundation',
    prerequisites: ['algebra.linear-equations'],
    targetGrade: 5,
  },
  {
    id: 'algebra.sequences',
    strandId: 'algebra',
    title: 'Sequences',
    blurb: 'Term-to-term rules, nth term of linear and quadratic sequences.',
    tier: 'foundation',
    prerequisites: ['algebra.notation'],
    targetGrade: 5,
  },
  {
    id: 'algebra.straight-line',
    strandId: 'algebra',
    title: 'Straight Line Graphs',
    blurb: 'Gradient, intercept, y = mx + c, parallel and perpendicular lines.',
    tier: 'foundation',
    prerequisites: ['algebra.linear-equations'],
    targetGrade: 5,
  },
  {
    id: 'algebra.inequalities',
    strandId: 'algebra',
    title: 'Inequalities',
    blurb: 'Solving and representing inequalities on a number line.',
    tier: 'foundation',
    prerequisites: ['algebra.linear-equations'],
    targetGrade: 5,
  },
  {
    id: 'algebra.simultaneous',
    strandId: 'algebra',
    title: 'Simultaneous Equations',
    blurb: 'Solving pairs of equations by elimination and substitution.',
    tier: 'foundation',
    prerequisites: ['algebra.linear-equations', 'algebra.straight-line'],
    targetGrade: 6,
  },
  {
    id: 'algebra.quadratics',
    strandId: 'algebra',
    title: 'Quadratic Equations',
    blurb: 'Solving by factorising, the formula and completing the square.',
    tier: 'foundation',
    prerequisites: ['algebra.expanding'],
    targetGrade: 6,
  },
  {
    id: 'algebra.graphs',
    strandId: 'algebra',
    title: 'Quadratic & Other Graphs',
    blurb: 'Recognising and sketching quadratic, cubic and reciprocal graphs.',
    tier: 'higher',
    prerequisites: ['algebra.quadratics', 'algebra.straight-line'],
    targetGrade: 7,
  },
  {
    id: 'algebra.functions',
    strandId: 'algebra',
    title: 'Functions',
    blurb: 'Function notation, composite and inverse functions.',
    tier: 'higher',
    prerequisites: ['algebra.formulae'],
    targetGrade: 7,
  },

  // ------------------------------------------------- Ratio and proportion
  {
    id: 'ratio.basics',
    strandId: 'ratio',
    title: 'Ratio',
    blurb: 'Simplifying ratios and sharing an amount in a given ratio.',
    tier: 'foundation',
    prerequisites: ['number.fractions'],
    targetGrade: 4,
  },
  {
    id: 'ratio.proportion',
    strandId: 'ratio',
    title: 'Direct & Inverse Proportion',
    blurb: 'Recipe problems, best buys and proportional reasoning.',
    tier: 'foundation',
    prerequisites: ['ratio.basics'],
    targetGrade: 5,
  },
  {
    id: 'ratio.compound-measures',
    strandId: 'ratio',
    title: 'Compound Measures',
    blurb: 'Speed, density and pressure, and converting their units.',
    tier: 'foundation',
    prerequisites: ['ratio.proportion'],
    targetGrade: 5,
  },
  {
    id: 'ratio.growth-decay',
    strandId: 'ratio',
    title: 'Growth & Decay',
    blurb: 'Compound interest, depreciation and repeated percentage change.',
    tier: 'foundation',
    prerequisites: ['number.percentages'],
    targetGrade: 6,
  },

  // ------------------------------------------------------------- Geometry
  {
    id: 'geometry.angles',
    strandId: 'geometry',
    title: 'Angles',
    blurb: 'Angles on lines, in triangles, in polygons and with parallel lines.',
    tier: 'foundation',
    prerequisites: [],
    targetGrade: 4,
  },
  {
    id: 'geometry.area-perimeter',
    strandId: 'geometry',
    title: 'Area & Perimeter',
    blurb: 'Rectangles, triangles, parallelograms, trapezia and circles.',
    tier: 'foundation',
    prerequisites: ['number.decimals'],
    targetGrade: 4,
  },
  {
    id: 'geometry.volume',
    strandId: 'geometry',
    title: 'Volume & Surface Area',
    blurb: 'Prisms, cylinders, cones, spheres and compound solids.',
    tier: 'foundation',
    prerequisites: ['geometry.area-perimeter'],
    targetGrade: 5,
  },
  {
    id: 'geometry.pythagoras',
    strandId: 'geometry',
    title: 'Pythagoras',
    blurb: "Finding missing sides in right-angled triangles.",
    tier: 'foundation',
    prerequisites: ['number.indices', 'geometry.angles'],
    targetGrade: 5,
  },
  {
    id: 'geometry.trigonometry',
    strandId: 'geometry',
    title: 'Trigonometry',
    blurb: 'SOHCAHTOA, exact values and finding angles.',
    tier: 'foundation',
    prerequisites: ['geometry.pythagoras'],
    targetGrade: 6,
  },
  {
    id: 'geometry.transformations',
    strandId: 'geometry',
    title: 'Transformations',
    blurb: 'Reflection, rotation, translation and enlargement.',
    tier: 'foundation',
    prerequisites: ['geometry.angles'],
    targetGrade: 5,
  },
  {
    id: 'geometry.similarity',
    strandId: 'geometry',
    title: 'Congruence & Similarity',
    blurb: 'Similar shapes, scale factors for length, area and volume.',
    tier: 'foundation',
    prerequisites: ['ratio.basics', 'geometry.transformations'],
    targetGrade: 6,
  },
  {
    id: 'geometry.circle-theorems',
    strandId: 'geometry',
    title: 'Circle Theorems',
    blurb: 'Angle rules in circles and their proofs.',
    tier: 'higher',
    prerequisites: ['geometry.angles', 'geometry.area-perimeter'],
    targetGrade: 7,
  },
  {
    id: 'geometry.vectors',
    strandId: 'geometry',
    title: 'Vectors',
    blurb: 'Column vectors, vector arithmetic and geometric proof.',
    tier: 'higher',
    prerequisites: ['geometry.transformations'],
    targetGrade: 7,
  },

  // ---------------------------------------------------------- Probability
  {
    id: 'probability.basics',
    strandId: 'probability',
    title: 'Basic Probability',
    blurb: 'Probability scale, single events and expected frequency.',
    tier: 'foundation',
    prerequisites: ['number.fractions'],
    targetGrade: 4,
  },
  {
    id: 'probability.combined',
    strandId: 'probability',
    title: 'Combined Events',
    blurb: 'Sample space diagrams and the and/or rules.',
    tier: 'foundation',
    prerequisites: ['probability.basics'],
    targetGrade: 5,
  },
  {
    id: 'probability.trees',
    strandId: 'probability',
    title: 'Tree Diagrams',
    blurb: 'Independent and conditional probability with tree diagrams.',
    tier: 'foundation',
    prerequisites: ['probability.combined'],
    targetGrade: 6,
  },
  {
    id: 'probability.venn',
    strandId: 'probability',
    title: 'Venn Diagrams & Sets',
    blurb: 'Set notation, unions, intersections and conditional probability.',
    tier: 'higher',
    prerequisites: ['probability.combined'],
    targetGrade: 6,
  },

  // ----------------------------------------------------------- Statistics
  {
    id: 'statistics.averages',
    strandId: 'statistics',
    title: 'Averages & Range',
    blurb: 'Mean, median, mode and range, including from tables.',
    tier: 'foundation',
    prerequisites: ['number.decimals'],
    targetGrade: 4,
  },
  {
    id: 'statistics.charts',
    strandId: 'statistics',
    title: 'Charts & Diagrams',
    blurb: 'Bar charts, pie charts, pictograms and frequency tables.',
    tier: 'foundation',
    prerequisites: ['statistics.averages'],
    targetGrade: 4,
  },
  {
    id: 'statistics.scatter',
    strandId: 'statistics',
    title: 'Scatter Graphs',
    blurb: 'Correlation, lines of best fit and interpolation.',
    tier: 'foundation',
    prerequisites: ['statistics.charts'],
    targetGrade: 5,
  },
  {
    id: 'statistics.cumulative',
    strandId: 'statistics',
    title: 'Cumulative Frequency & Box Plots',
    blurb: 'Medians, quartiles and comparing distributions.',
    tier: 'higher',
    prerequisites: ['statistics.averages'],
    targetGrade: 6,
  },
  {
    id: 'statistics.histograms',
    strandId: 'statistics',
    title: 'Histograms',
    blurb: 'Frequency density and unequal class widths.',
    tier: 'higher',
    prerequisites: ['statistics.cumulative'],
    targetGrade: 7,
  },
];

const TOPICS_BY_ID = new Map(TOPICS.map((topic) => [topic.id, topic]));

export function getTopic(id: string): Topic | undefined {
  return TOPICS_BY_ID.get(id);
}

export function getStrand(id: StrandId): Strand | undefined {
  return STRANDS.find((strand) => strand.id === id);
}

/** Topics a student on the given tier is examined on. */
export function topicsForTier(tier: 'foundation' | 'higher'): Topic[] {
  return tier === 'higher'
    ? TOPICS
    : TOPICS.filter((topic) => topic.tier === 'foundation');
}

export function topicsByStrand(tier: 'foundation' | 'higher'): {
  strand: Strand;
  topics: Topic[];
}[] {
  const available = topicsForTier(tier);
  return STRANDS.map((strand) => ({
    strand,
    topics: available.filter((topic) => topic.strandId === strand.id),
  })).filter((group) => group.topics.length > 0);
}
