import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { createQuestion, Question } from './QuestionApi';

interface Props {
  bankId: string;
  onSuccess?: (questionsFromExcel: any) => void;
  onClose: () => void;
}

const excelSample = [
  ['Nội dung câu hỏi', 'Loại', 'Độ khó', 'Đáp án 1', 'Đúng 1', 'Đáp án 2', 'Đúng 2', 'Đáp án 3', 'Đúng 3', 'Đáp án 4', 'Đúng 4'],
  ['Câu hỏi mẫu', 'single', 'easy', 'Đáp án A', 'TRUE', 'Đáp án B', 'FALSE', 'Đáp án C', 'FALSE', 'Đáp án D', 'FALSE']
];

const ImportQuestionExcel: React.FC<Props> = ({ bankId, onSuccess, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<Question[]>([]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    // Bỏ header
    const questions: Question[] = rows.slice(1).map(row => {
      const [content, type, level, ...rest] = row;
      const options: { text: string; correct: boolean }[] = [];
      for (let i = 0; i < rest.length; i += 2) {
        if (rest[i]) {
          options.push({ text: rest[i], correct: String(rest[i + 1]).toLowerCase() === 'true' });
        }
      }
      return {
        questionBankId: bankId,
        bankId: bankId,
        content: content || '',
        type: (type || 'single') as any,
        level: (level || 'easy') as any,
        options
      };
    });
    setParsed(questions);
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      for (const q of parsed) {
        await createQuestion(bankId, q);
      }
      onSuccess && onSuccess(parsed);
    } catch (err) {
      console.error('Lỗi khi import câu hỏi:', err);
      alert('Lỗi khi import câu hỏi!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg relative">
        <button className="absolute top-2 right-2 text-slate-400 hover:text-slate-700" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold mb-4">Import câu hỏi từ Excel</h2>
        <input type="file" accept=".xlsx,.xls" ref={fileInputRef} onChange={handleFile} className="mb-4" />
        <div className="mb-4">
          <div className="font-semibold mb-2">Bảng mẫu Excel:</div>
          <table className="w-full border text-xs">
            <tbody>
              {excelSample.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="border px-2 py-1">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {parsed.length > 0 && (
          <div className="mb-4">
            <div className="font-semibold mb-2">Xem trước dữ liệu import ({parsed.length} câu hỏi):</div>
            <ul className="max-h-32 overflow-y-auto text-xs list-decimal pl-4">
              {parsed.map((q, idx) => (
                <li key={idx}>{q.content} ({q.type}, {q.level})</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" className="px-4 py-2 bg-slate-200 rounded" onClick={onClose}>Hủy</button>
          <button type="button" className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700" onClick={handleImport} disabled={loading || parsed.length === 0}>Import</button>
        </div>
      </div>
    </div>
  );
};

export default ImportQuestionExcel; 