import { useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { SCHOOL_STAGES, subjectsForGrades } from '../lib/curriculum';

interface CurriculumPickerProps {
  grades: string[];
  subjects: string[];
  onGradesChange: (grades: string[]) => void;
  onSubjectsChange: (subjects: string[]) => void;
}

export function CurriculumPicker({ grades, subjects, onGradesChange, onSubjectsChange }: CurriculumPickerProps) {
  const [subjectSearch, setSubjectSearch] = useState('');
  const availableSubjects = useMemo(() => subjectsForGrades(grades), [grades]);
  const visibleSubjects = availableSubjects.filter((subject) => subject.toLocaleLowerCase('vi').includes(subjectSearch.toLocaleLowerCase('vi')));

  const toggleGrade = (grade: string) => {
    const nextGrades = grades.includes(grade) ? grades.filter((item) => item !== grade) : [...grades, grade].sort((a, b) => Number(a.slice(5)) - Number(b.slice(5)));
    onGradesChange(nextGrades);
    const validSubjects = subjectsForGrades(nextGrades);
    onSubjectsChange(subjects.filter((subject) => validSubjects.includes(subject)));
  };

  const toggleStage = (stageGrades: readonly string[]) => {
    const allSelected = stageGrades.every((grade) => grades.includes(grade));
    const nextGrades = allSelected
      ? grades.filter((grade) => !stageGrades.includes(grade))
      : [...new Set([...grades, ...stageGrades])].sort((a, b) => Number(a.slice(5)) - Number(b.slice(5)));
    onGradesChange(nextGrades);
    const validSubjects = subjectsForGrades(nextGrades);
    onSubjectsChange(subjects.filter((subject) => validSubjects.includes(subject)));
  };

  const toggleSubject = (subject: string) => {
    onSubjectsChange(subjects.includes(subject) ? subjects.filter((item) => item !== subject) : [...subjects, subject]);
  };

  return <section className="curriculum-picker" aria-label="Chọn cấp học, lớp và môn học">
    <div className="curriculum-picker-heading">
      <div><b>Áp dụng cho khối lớp nào?</b><small>Chọn một hoặc nhiều lớp. Danh sách môn sẽ đổi theo lựa chọn.</small></div>
      <span>{grades.length ? `${grades.length} lớp` : 'Chưa chọn lớp'}</span>
    </div>
    <div className="curriculum-stages">
      {SCHOOL_STAGES.map((stage) => {
        const allSelected = stage.gradeLabels.every((grade) => grades.includes(grade));
        return <fieldset className="curriculum-stage" key={stage.id}>
          <legend>{stage.label}</legend>
          <button className={`curriculum-stage-all${allSelected ? ' active' : ''}`} type="button" onClick={() => toggleStage(stage.gradeLabels)}>{allSelected ? 'Bỏ chọn cấp' : 'Chọn cả cấp'}</button>
          <div className="curriculum-grade-options">{stage.gradeLabels.map((grade) => <button key={grade} type="button" aria-pressed={grades.includes(grade)} className={grades.includes(grade) ? 'active' : ''} onClick={() => toggleGrade(grade)}>{grade.replace('Lớp ', '')}</button>)}</div>
        </fieldset>;
      })}
    </div>

    <div className="curriculum-picker-heading curriculum-subject-heading">
      <div><b>Chọn môn học *</b><small>Không gộp môn tích hợp; chọn nhiều môn nếu học liệu có nội dung liên môn.</small></div>
      <span>{subjects.length} đã chọn</span>
    </div>
    <label className="curriculum-subject-search"><Search size={15} /><input value={subjectSearch} onChange={(event) => setSubjectSearch(event.target.value)} placeholder={grades.length ? 'Tìm tên môn học…' : 'Chọn khối lớp để xem môn học'} disabled={!grades.length} /><kbd>⌕</kbd></label>
    {visibleSubjects.length ? <div className="curriculum-subject-options">{visibleSubjects.map((subject) => <button key={subject} type="button" aria-pressed={subjects.includes(subject)} className={subjects.includes(subject) ? 'active' : ''} onClick={() => toggleSubject(subject)}><span className="curriculum-check">{subjects.includes(subject) && <Check size={13} />}</span><span>{subject}</span></button>)}</div> : <div className="curriculum-empty">{grades.length ? 'Không tìm thấy môn phù hợp.' : 'Hãy chọn ít nhất một khối lớp trước.'}</div>}
    <p className="curriculum-selection-summary">{subjects.length ? <>Đang chọn: <strong>{subjects.join(', ')}</strong></> : 'Chọn ít nhất một môn để gửi dự án.'}</p>
  </section>;
}
