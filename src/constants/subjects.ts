export const STANDARD_SUBJECTS: string[] = [
  'Matematik',
  'Geometri',
  'Türkçe',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'Tarih',
  'Coğrafya',
  'Felsefe',
  'Din Kültürü',
  'Edebiyat',
  'İngilizce',
  'Fen Bilimleri',
  'Sosyal Bilimler',
];

const SUBJECT_ALIAS_MAP: Record<string, string> = {
  'temel matematik': 'Matematik',
  'tyt matematik': 'Matematik',
  'ayt matematik': 'Matematik',
  'matematik': 'Matematik',
  'mat': 'Matematik',
  'geometri': 'Geometri',
  'geo': 'Geometri',
  'türkçe': 'Türkçe',
  'turkce': 'Türkçe',
  'tyt türkçe': 'Türkçe',
  'paragraf': 'Türkçe',
  'türk dili ve edebiyatı': 'Edebiyat',
  'edebiyat': 'Edebiyat',
  'ayt edebiyat': 'Edebiyat',
  'fizik': 'Fizik',
  'tyt fizik': 'Fizik',
  'ayt fizik': 'Fizik',
  'kimya': 'Kimya',
  'tyt kimya': 'Kimya',
  'ayt kimya': 'Kimya',
  'biyoloji': 'Biyoloji',
  'tyt biyoloji': 'Biyoloji',
  'ayt biyoloji': 'Biyoloji',
  'tarih': 'Tarih',
  'inkılap tarihi': 'Tarih',
  't.c. inkılap tarihi': 'Tarih',
  'coğrafya': 'Coğrafya',
  'cografya': 'Coğrafya',
  'felsefe': 'Felsefe',
  'din kültürü': 'Din Kültürü',
  'din kültürü ve ahlak bilgisi': 'Din Kültürü',
  'ingilizce': 'İngilizce',
  'yabancı dil': 'İngilizce',
  'fen bilimleri': 'Fen Bilimleri',
  'tyt fen': 'Fen Bilimleri',
  'fen': 'Fen Bilimleri',
  'sosyal bilimler': 'Sosyal Bilimler',
  'tyt sosyal': 'Sosyal Bilimler',
  'sosyal': 'Sosyal Bilimler',
};

export function normalizeSubjectName(raw?: string | null): string {
  if (!raw) return 'Matematik';
  const trimmed = raw.trim();
  if (!trimmed) return 'Matematik';
  const lower = trimmed.toLocaleLowerCase('tr-TR');
  if (SUBJECT_ALIAS_MAP[lower]) {
    return SUBJECT_ALIAS_MAP[lower];
  }
  const exactMatch = STANDARD_SUBJECTS.find(
    (s) => s.toLocaleLowerCase('tr-TR') === lower
  );
  if (exactMatch) return exactMatch;
  return trimmed;
}

export const EXAM_TYPE_DEFAULT_SECTIONS: Record<
  'TYT' | 'AYT' | 'LGS' | 'Branş' | 'MSÜ',
  string[]
> = {
  TYT: ['Türkçe', 'Matematik', 'Geometri', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya', 'Felsefe', 'Din Kültürü'],
  AYT: ['Matematik', 'Geometri', 'Fizik', 'Kimya', 'Biyoloji', 'Edebiyat', 'Tarih', 'Coğrafya'],
  LGS: ['Türkçe', 'Matematik', 'Fen Bilimleri', 'Tarih', 'Din Kültürü', 'İngilizce'],
  Branş: ['Matematik'],
  MSÜ: ['Türkçe', 'Matematik', 'Geometri', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya'],
};
