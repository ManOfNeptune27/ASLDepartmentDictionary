export type Source = 'naturally' | 'trueway' | 'miscellaneous';

export type WordEntry =
  | string
  | {
      word: string;
      gloss: string;
    };

export type Unit = {
  id: string;
  name: string;
  words: WordEntry[];
};

type SourceGroup = {
  label: string;
  units: Unit[];
};

export const sourceData: Record<Source, SourceGroup> = {
  naturally: {
    label: 'Spread the Sign',
    units: [
      { id: 'naturally-u1', name: 'Unit 1: Greetings', words: ['Hello', 'Good Morning', 'How Are You'] },
      { id: 'naturally-u2', name: 'Unit 2: Family', words: ['Mother', 'Father', 'Sister', 'Brother'] },
      { id: 'naturally-u3', name: 'Unit 3: School', words: ['Teacher', 'Student', 'Class', 'Homework'] }
    ]
  },
  trueway: {
    label: 'TRUE WAY ASL',
    units: [
      { id: 'trueway-u1', name: 'Unit 1: Basics', words: ['Name', 'Nice', 'Meet', 'You'] },
      { id: 'trueway-u2', name: 'Unit 2: Numbers', words: ['One', 'Two', 'Three', 'Ten'] },
      { id: 'trueway-u3', name: 'Unit 3: Food', words: ['Eat', 'Drink', 'Apple', 'Water'] }
    ]
  },
  miscellaneous: {
    label: 'MISCELLANEOUS',
    units: []
  }
};

export const sources: { id: Source; label: string }[] = [
  { id: 'naturally', label: 'Signing Naturally' },
  { id: 'trueway', label: 'True Way ASL' },
  { id: 'miscellaneous', label: 'MISCELLANEOUS' }
];
