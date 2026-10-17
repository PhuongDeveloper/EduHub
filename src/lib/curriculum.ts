/**
 * Subject names for project tagging in the current Vietnamese general education
 * curriculum (GDPT 2018, including the 2022 high-school subject adjustment).
 * Integrated areas are split into their useful teaching topics for search.
 */
export const SCHOOL_STAGES = [
  { id: 'tieuhoc', label: 'Tiểu học', gradeLabels: ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'] },
  { id: 'thcs', label: 'THCS', gradeLabels: ['Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9'] },
  { id: 'thpt', label: 'THPT', gradeLabels: ['Lớp 10', 'Lớp 11', 'Lớp 12'] },
] as const;

const PRIMARY_COMMON = ['Tiếng Việt', 'Toán', 'Đạo đức', 'Giáo dục thể chất', 'Âm nhạc', 'Mĩ thuật', 'Nghệ thuật', 'Hoạt động trải nghiệm'];
const PRIMARY_LANGUAGES = ['Tiếng Anh (tự chọn)', 'Tiếng dân tộc thiểu số'];
const PRIMARY_COMPUTING = ['Tin học', 'Công nghệ'];
const SECONDARY_BASE = [
  'Ngữ văn', 'Toán', 'Giáo dục công dân', 'Vật lí', 'Hóa học', 'Sinh học', 'Lịch sử', 'Địa lí',
  'Công nghệ', 'Tin học', 'Giáo dục thể chất', 'Âm nhạc', 'Mĩ thuật',
  'Hoạt động trải nghiệm, hướng nghiệp', 'Giáo dục địa phương',
];
const FOREIGN_LANGUAGES = ['Tiếng Anh', 'Tiếng Pháp', 'Tiếng Nga', 'Tiếng Trung Quốc', 'Tiếng Nhật', 'Tiếng Đức', 'Tiếng Hàn'];
const HIGH_SCHOOL_SUBJECTS = [
  'Giáo dục kinh tế và pháp luật', 'Giáo dục quốc phòng và an ninh',
];

export const CURRICULUM_SUBJECTS_BY_GRADE: Record<string, string[]> = {
  'Lớp 1': [...PRIMARY_COMMON, 'Tự nhiên và Xã hội', ...PRIMARY_LANGUAGES],
  'Lớp 2': [...PRIMARY_COMMON, 'Tự nhiên và Xã hội', ...PRIMARY_LANGUAGES],
  'Lớp 3': [...PRIMARY_COMMON, 'Tự nhiên và Xã hội', 'Ngoại ngữ 1', 'Tin học và Công nghệ', ...PRIMARY_COMPUTING, ...FOREIGN_LANGUAGES, 'Tiếng dân tộc thiểu số'],
  'Lớp 4': [...PRIMARY_COMMON, 'Khoa học', 'Lịch sử', 'Địa lí', 'Lịch sử và Địa lí', 'Ngoại ngữ 1', 'Tin học và Công nghệ', ...PRIMARY_COMPUTING, ...FOREIGN_LANGUAGES, 'Tiếng dân tộc thiểu số'],
  'Lớp 5': [...PRIMARY_COMMON, 'Khoa học', 'Lịch sử', 'Địa lí', 'Lịch sử và Địa lí', 'Ngoại ngữ 1', 'Tin học và Công nghệ', ...PRIMARY_COMPUTING, ...FOREIGN_LANGUAGES, 'Tiếng dân tộc thiểu số'],
  'Lớp 6': [...SECONDARY_BASE, 'Khoa học tự nhiên', 'Lịch sử và Địa lí', 'Nghệ thuật', ...FOREIGN_LANGUAGES, 'Tiếng dân tộc thiểu số'],
  'Lớp 7': [...SECONDARY_BASE, 'Khoa học tự nhiên', 'Lịch sử và Địa lí', 'Nghệ thuật', ...FOREIGN_LANGUAGES, 'Tiếng dân tộc thiểu số'],
  'Lớp 8': [...SECONDARY_BASE, 'Khoa học tự nhiên', 'Lịch sử và Địa lí', 'Nghệ thuật', ...FOREIGN_LANGUAGES, 'Tiếng dân tộc thiểu số'],
  'Lớp 9': [...SECONDARY_BASE, 'Khoa học tự nhiên', 'Lịch sử và Địa lí', 'Nghệ thuật', ...FOREIGN_LANGUAGES, 'Tiếng dân tộc thiểu số'],
  'Lớp 10': ['Ngữ văn', 'Toán', ...FOREIGN_LANGUAGES, 'Tiếng dân tộc thiểu số', 'Lịch sử', 'Địa lí', 'Giáo dục kinh tế và pháp luật', 'Vật lí', 'Hóa học', 'Sinh học', 'Công nghệ', 'Tin học', 'Âm nhạc', 'Mĩ thuật', 'Giáo dục thể chất', ...HIGH_SCHOOL_SUBJECTS, 'Hoạt động trải nghiệm, hướng nghiệp', 'Giáo dục địa phương'],
  'Lớp 11': ['Ngữ văn', 'Toán', ...FOREIGN_LANGUAGES, 'Tiếng dân tộc thiểu số', 'Lịch sử', 'Địa lí', 'Giáo dục kinh tế và pháp luật', 'Vật lí', 'Hóa học', 'Sinh học', 'Công nghệ', 'Tin học', 'Âm nhạc', 'Mĩ thuật', 'Giáo dục thể chất', ...HIGH_SCHOOL_SUBJECTS, 'Hoạt động trải nghiệm, hướng nghiệp', 'Giáo dục địa phương'],
  'Lớp 12': ['Ngữ văn', 'Toán', ...FOREIGN_LANGUAGES, 'Tiếng dân tộc thiểu số', 'Lịch sử', 'Địa lí', 'Giáo dục kinh tế và pháp luật', 'Vật lí', 'Hóa học', 'Sinh học', 'Công nghệ', 'Tin học', 'Âm nhạc', 'Mĩ thuật', 'Giáo dục thể chất', ...HIGH_SCHOOL_SUBJECTS, 'Hoạt động trải nghiệm, hướng nghiệp', 'Giáo dục địa phương'],
};

export const GRADE_LABELS = SCHOOL_STAGES.flatMap((stage) => [...stage.gradeLabels]);

export const SUBJECT_NAMES = [...new Set(Object.values(CURRICULUM_SUBJECTS_BY_GRADE).flat())]
  .sort((a, b) => a.localeCompare(b, 'vi'));

const LEGACY_SUBJECT_NAMES: Record<string, string[]> = {
  'toán học': ['Toán'], 'vật lý': ['Vật lí'], 'khtn': ['Khoa học tự nhiên'],
  'lịch sử & địa lí': ['Lịch sử', 'Địa lí'], 'lịch sử và địa lí': ['Lịch sử', 'Địa lí'],
  'tin học & công nghệ': ['Tin học', 'Công nghệ'], 'tin học và công nghệ': ['Tin học', 'Công nghệ'],
  'gdcd': ['Giáo dục công dân'], 'đạo đức': ['Đạo đức'], 'đa môn học': ['Liên môn / nhiều môn'],
};

export function normalizeSubjectNames(subjects: unknown): string[] {
  if (!Array.isArray(subjects)) return [];
  return [...new Set(subjects.flatMap((value) => {
    if (typeof value !== 'string') return [];
    return LEGACY_SUBJECT_NAMES[value.trim().toLocaleLowerCase('vi')] || [value.trim()];
  }).filter(Boolean))];
}

export function subjectsForGrades(grades: string[]): string[] {
  const subjects = new Set(grades.flatMap((grade) => CURRICULUM_SUBJECTS_BY_GRADE[grade] || []));
  return [...subjects].sort((a, b) => a.localeCompare(b, 'vi'));
}

export function schoolLevelsForGrades(grades: string[]): string[] {
  return SCHOOL_STAGES.filter((stage) => grades.some((grade) => (stage.gradeLabels as readonly string[]).includes(grade))).map((stage) => stage.id);
}
