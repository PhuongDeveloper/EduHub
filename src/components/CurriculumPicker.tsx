import { useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { SCHOOL_STAGES, subjectsForGrades } from '../lib/curriculum';

interface CurriculumPickerProps {
  grades: string[];
  subjects: string[];
  onGradesChange: (grades: string[]) => void;
  onSubjectsChange: (subjects: string[]) => void;
  allSubjects?: boolean;
  onAllSubjectsChange?: (all: boolean) => void;
}

export function CurriculumPicker({ grades, subjects, onGradesChange, onSubjectsChange, allSubjects = false, onAllSubjectsChange }: CurriculumPickerProps) {
  const [subjectSearch, setSubjectSearch] = useState('');
  const availableSubjects = useMemo(() => subjectsForGrades(grades), [grades]);
  const visibleSubjects = availableSubjects.filter((subject) => subject.toLocaleLowerCase('vi').includes(subjectSearch.toLocaleLowerCase('vi')));

  const toggleGrade = (grade: string) => {
    const nextGrades = grades.includes(grade) ? grades.filter((item) => item !== grade) : [...grades, grade].sort((a, b) => Number(a.slice(5)) - Number(b.slice(5)));
    onGradesChange(nextGrades);
    const validSubjects = subjectsForGrades(nextGrades);
    if (!allSubjects) onSubjectsChange(subjects.filter((subject) => validSubjects.includes(subject)));
  };

  const toggleStage = (stageGrades: readonly string[]) => {
    const allSelected = stageGrades.every((grade) => grades.includes(grade));
    const nextGrades = allSelected
      ? grades.filter((grade) => !stageGrades.includes(grade))
      : [...new Set([...grades, ...stageGrades])].sort((a, b) => Number(a.slice(5)) - Number(b.slice(5)));
    onGradesChange(nextGrades);
    const validSubjects = subjectsForGrades(nextGrades);
    if (!allSubjects) onSubjectsChange(subjects.filter((subject) => validSubjects.includes(subject)));
  };

  const toggleSubject = (subject: string) => {
    onAllSubjectsChange?.(false);
    onSubjectsChange(subjects.includes(subject) ? subjects.filter((item) => item !== subject) : [...subjects.filter((item) => item !== 'Mọi môn'), subject]);
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
          <button className={`curriculum-stage-all${allSelected ? ' active' : ''}`} type="button" onClick={() => toggleStage(stage.gradeLabels)}>{allSelected ? 'Bỏ chọn' : 'Chọn tất cả'}</button>
          <div className="curriculum-grade-options">{stage.gradeLabels.map((grade) => <button key={grade} type="button" aria-pressed={grades.includes(grade)} className={grades.includes(grade) ? 'active' : ''} onClick={() => toggleGrade(grade)}>{grade.replace('Lớp ', '')}</button>)}</div>
        </fieldset>;
      })}
    </div>

    <div className="curriculum-picker-heading curriculum-subject-heading">
      <div><b>Chọn môn học *</b><small>Chọn môn cụ thể hoặc đánh dấu dùng được cho mọi môn học.</small></div>
      <span>{allSubjects ? 'Mọi môn' : `${subjects.length} đã chọn`}</span>
    </div>
    {onAllSubjectsChange && <button type="button" className={`curriculum-all-subjects${allSubjects ? ' active' : ''}`} aria-pressed={allSubjects} onClick={() => { const next = !allSubjects; onAllSubjectsChange(next); onSubjectsChange(next ? ['Mọi môn'] : []); }}><span className="curriculum-check">{allSubjects && <Check size={13} />}</span><span><b>Dùng cho mọi môn / liên môn</b><small>Phù hợp với website tiện ích, công cụ chung hoặc học liệu tích hợp nhiều môn.</small></span></button>}
    {!allSubjects && <><label className="curriculum-subject-search"><Search size={15} /><input value={subjectSearch} onChange={(event) => setSubjectSearch(event.target.value)} placeholder={grades.length ? 'Tìm tên môn học…' : 'Chọn khối lớp để xem môn học'} disabled={!grades.length} /><kbd>⌕</kbd></label>
      {visibleSubjects.length ? <div className="curriculum-subject-options">{visibleSubjects.map((subject) => <button key={subject} type="button" aria-pressed={subjects.includes(subject)} className={subjects.includes(subject) ? 'active' : ''} onClick={() => toggleSubject(subject)}><span className="curriculum-check">{subjects.includes(subject) && <Check size={13} />}</span><span>{subject}</span></button>)}</div> : <div className="curriculum-empty">{grades.length ? 'Không tìm thấy môn phù hợp.' : 'Hãy chọn ít nhất một khối lớp trước.'}</div>}</>}
    <p className="curriculum-selection-summary">{allSubjects ? <>Đang chọn: <strong>Dùng cho mọi môn học</strong></> : subjects.length ? <>Đang chọn: <strong>{subjects.join(', ')}</strong></> : 'Chọn ít nhất một môn để gửi dự án.'}</p>
  </section>;
}
