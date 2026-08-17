import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import * as XLSX from 'xlsx';
import { useToast, useConfirm } from '../common/AlertProvider';

const ManageQuestions = ({ exam, onBack }) => {
  const toast = useToast();
  const confirm = useConfirm();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    options: ['', '', '', ''],
    correct_option: 0,
    explanation: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [showJsonPaste, setShowJsonPaste] = useState(false);
  const [jsonInput, setJsonInput] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, [exam.id]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', exam.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
    setLoading(false);
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.question_text || newQuestion.options.some(opt => !opt)) {
      toast('Please fill all fields', 'warning');
      return;
    }

    try {
      const { error } = await supabase
        .from('questions')
        .insert([{
          exam_id: exam.id,
          question_text: newQuestion.question_text,
          options: newQuestion.options,
          correct_option: parseInt(newQuestion.correct_option),
          explanation: newQuestion.explanation
        }]);

      if (error) throw error;

      setNewQuestion({
        question_text: '',
        options: ['', '', '', ''],
        correct_option: 0,
        explanation: ''
      });
      fetchQuestions();
    } catch (error) {
      toast('Error adding question: ' + error.message, 'error');
    }
  };

  const handleDeleteQuestion = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Question',
      message: 'Are you sure you want to delete this question? This cannot be undone.',
      type: 'error',
      confirmText: 'Delete'
    });
    if (!isConfirmed) return;
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchQuestions();
    } catch (error) {
      toast('Error deleting question: ' + error.message, 'error');
    }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (jsonData.length < 2) throw new Error('File is empty or missing data rows');

        processImportData(jsonData);
      } catch (err) {
        console.error('Import parse error:', err);
        toast('Error: ' + err.message, 'error');
      } finally {
        setIsUploading(false);
        e.target.value = ''; 
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleJsonImport = async () => {
    if (!jsonInput.trim()) {
      toast('Please paste some JSON code', 'warning');
      return;
    }

    // 1. Aggressive Repair Logic for "Dirty" JSON
    const repairJson = (str) => {
      let cleaned = str.trim();
      
      // Extract main block
      const startIdx = Math.min(
        cleaned.indexOf('{') === -1 ? Infinity : cleaned.indexOf('{'),
        cleaned.indexOf('[') === -1 ? Infinity : cleaned.indexOf('[')
      );
      const endIdx = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
      
      if (startIdx !== Infinity && endIdx !== -1) {
        cleaned = cleaned.substring(startIdx, endIdx + 1);
      }

      // Remove trailing commas before closing braces/brackets
      cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');
      
      return cleaned;
    };

    try {
      setIsUploading(true);
      const sanitized = repairJson(jsonInput);
      const parsed = JSON.parse(sanitized);
      
      const sourceArray = parsed.data && Array.isArray(parsed.data) ? parsed.data : 
                          (Array.isArray(parsed) ? parsed : [parsed]);

      const formattedQuestions = sourceArray.map((q, idx) => {
        const questionText = q.question || q.question_text || q.text || q.ques || '';
        const options = Array.isArray(q.options) ? q.options.slice(0, 4) : 
                        [q.opt1 || q.a, q.opt2 || q.b, q.opt3 || q.c, q.opt4 || q.d].filter(o => o);
        
        let correctIdx = 0;
        const rawCorrect = q.correctOption ?? q.correct_option ?? q.answer ?? q.ans;
        
        if (rawCorrect !== undefined) {
          const val = typeof rawCorrect === 'string' ? parseInt(rawCorrect) : rawCorrect;
          
          // Heuristic: If value is 1-4 and matches length, assume 1-indexed
          if (val >= 1 && val <= options.length && (q.correctOption !== undefined || val === options.length)) {
            correctIdx = val - 1;
          } else {
            correctIdx = val;
          }
        }

        return {
          exam_id: exam.id,
          question_text: questionText,
          options: options,
          correct_option: Math.max(0, Math.min(3, isNaN(correctIdx) ? 0 : correctIdx)),
          explanation: q.explanation || q.desc || q.rationale || ''
        };
      }).filter(q => q.question_text && q.options.length >= 2);

      if (formattedQuestions.length === 0) {
        throw new Error('No valid questions identified. Check your keys (question, options, etc).');
      }

      const { error } = await supabase
        .from('questions')
        .insert(formattedQuestions);
      if (error) throw error;

      toast(`Success! Injected ${formattedQuestions.length} units into the database.`, 'success');
      setShowJsonPaste(false);
      setJsonInput('');
      fetchQuestions();
    } catch (err) {
      toast('Engine Error: ' + err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Helper for live validation preview
  const getJsonStats = () => {
    if (!jsonInput.trim()) return null;
    try {
      const sanitized = jsonInput.trim().replace(/,\s*([\]}])/g, '$1');
      const start = Math.min(sanitized.indexOf('{') === -1 ? Infinity : sanitized.indexOf('{'), sanitized.indexOf('[') === -1 ? Infinity : sanitized.indexOf('['));
      const end = Math.max(sanitized.lastIndexOf('}'), sanitized.lastIndexOf(']'));
      const final = (start !== Infinity && end !== -1) ? sanitized.substring(start, end + 1) : sanitized;
      
      const parsed = JSON.parse(final);
      const arr = parsed.data && Array.isArray(parsed.data) ? parsed.data : (Array.isArray(parsed) ? parsed : [parsed]);
      return { count: arr.length, valid: true };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  };

  const jsonStats = getJsonStats();

  const processImportData = async (jsonData) => {
    try {
      const headers = jsonData[0].map(h => String(h).trim().toLowerCase());
      const rows = jsonData.slice(1);

      // 1. Intelligent Column Mapping
      const findColumn = (keywords) => {
        return headers.findIndex(h => keywords.some(k => h.includes(k)));
      };

      const colIdx = {
        question: findColumn(['question', 'ques', 'text']),
        options: [
          findColumn(['opt1', 'option a', ' a', 'opt_1']),
          findColumn(['opt2', 'option b', ' b', 'opt_2']),
          findColumn(['opt3', 'option c', ' c', 'opt_3']),
          findColumn(['opt4', 'option d', ' d', 'opt_4'])
        ],
        answer: findColumn(['correct', 'answer', 'ans', 'right']),
        explanation: findColumn(['explanation', 'description', 'desc', 'solution', 'sol'])
      };

      // Fallback for options if direct keywords fail
      if (colIdx.options.some(idx => idx === -1)) {
        colIdx.options = [
          headers.findIndex(h => h === 'a' || h === '1'),
          headers.findIndex(h => h === 'b' || h === '2'),
          headers.findIndex(h => h === 'c' || h === '3'),
          headers.findIndex(h => h === 'd' || h === '4')
        ];
      }

      let successCount = 0;
      let skipCount = 0;

      const questionsToInsert = rows.map((row, rIdx) => {
        const rawQuestion = row[colIdx.question];
        const rawOptions = colIdx.options.map(idx => row[idx]);
        const rawAnswer = row[colIdx.answer];
        const rawExp = colIdx.explanation !== -1 ? row[colIdx.explanation] : '';

        const questionText = String(rawQuestion || '').trim();
        const options = rawOptions.map(opt => String(opt || '').trim());
        const explanation = String(rawExp || '').trim();

        if (!questionText || options.filter(o => o).length < 2) {
          skipCount++;
          return null;
        }

        let correctIdx = 0;
        if (rawAnswer !== undefined && rawAnswer !== null) {
          const cleanAns = String(rawAnswer).trim();
          const upperAns = cleanAns.toUpperCase();

          if (upperAns === 'A' || upperAns === '1') correctIdx = 0;
          else if (upperAns === 'B' || upperAns === '2') correctIdx = 1;
          else if (upperAns === 'C' || upperAns === '3') correctIdx = 2;
          else if (upperAns === 'D' || upperAns === '4') correctIdx = 3;
          else {
            const prefixMatch = cleanAns.match(/^([A-D])[.\)]/i);
            if (prefixMatch) {
              const letter = prefixMatch[1].toUpperCase();
              correctIdx = ['A', 'B', 'C', 'D'].indexOf(letter);
            } else {
              const matchIdx = options.findIndex(opt => 
                opt.toLowerCase() === cleanAns.toLowerCase()
              );
              if (matchIdx !== -1) {
                correctIdx = matchIdx;
              } else {
                const softMatchIdx = options.findIndex(opt => 
                  opt.toLowerCase().includes(cleanAns.toLowerCase()) || 
                  cleanAns.toLowerCase().includes(opt.toLowerCase())
                );
                correctIdx = softMatchIdx !== -1 ? softMatchIdx : 0;
              }
            }
          }
        }

        successCount++;
        return {
          exam_id: exam.id,
          question_text: questionText,
          options: options.slice(0, 4),
          correct_option: correctIdx,
          explanation: explanation
        };
      }).filter(q => q !== null);

      if (questionsToInsert.length > 0) {
        const { error } = await supabase
          .from('questions')
          .insert(questionsToInsert);
        if (error) throw error;
        toast(`Imported ${successCount} questions.${skipCount > 0 ? ` Skipped ${skipCount} invalid rows.` : ''}`, 'success');
        fetchQuestions();
      } else {
        toast('No valid questions found. Check column headers.', 'warning');
      }
    } catch (err) {
      console.error('Process error:', err);
      toast('Error: ' + err.message, 'error');
    }
  };

  return (
    <div className="manage-questions animate-fade-in relative z-10 w-full min-h-[500px] font-sans selection:bg-slate-100">
      {/* Header Container */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-50">
        <div>
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 mb-4 text-slate-400 hover:text-slate-900 transition-colors font-bold text-xs uppercase tracking-widest"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            Back to Exams
          </button>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            {exam.title} 
            <span className="font-medium text-slate-400 text-xl ml-2">Assessment Core</span>
          </h2>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 flex items-center justify-center gap-2 cursor-pointer px-6 py-4 rounded-2xl shadow-sm transition-all active:scale-95 group h-14 min-w-[200px]">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="text-slate-400 group-hover:text-slate-900 transition-colors"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
            <span className="font-bold text-sm tracking-wide">{isUploading ? 'Syncing...' : 'Upload File (Excel/CSV)'}</span>
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleExcelUpload} style={{ display: 'none' }} disabled={isUploading} />
          </label>

          <button 
            onClick={() => setShowJsonPaste(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 px-6 py-4 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95 group h-14 min-w-[160px]"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>
            <span className="font-bold text-sm tracking-wide">Paste JSON</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start relative max-w-full">
        {/* Add Question Form - Sticky on Desktop */}
        <div className="lg:col-span-5 bg-white p-8 lg:sticky lg:top-8 w-full order-2 lg:order-1 animate-slide-up rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40">
          <h3 className="text-xl font-bold tracking-tight mb-8 flex items-center gap-4 text-slate-900">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 shadow-sm">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            </div>
            Create Assessment Unit
          </h3>
          
          <form onSubmit={handleAddQuestion} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-2">Question Content</label>
              <textarea 
                placeholder="Formulate the assessment question..." 
                value={newQuestion.question_text}
                onChange={(e) => setNewQuestion({...newQuestion, question_text: e.target.value})}
                required
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all duration-300 min-h-[120px] text-sm font-medium leading-relaxed"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-2">Option Architecture</label>
              {newQuestion.options.map((opt, idx) => (
                <div key={idx} className="relative group">
                  <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center font-bold text-slate-300 pointer-events-none transition-colors group-focus-within:text-slate-900 border-r border-slate-100/50">
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <input 
                    type="text" 
                    placeholder={`Define alternative ${String.fromCharCode(65 + idx)}`}
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...newQuestion.options];
                      newOpts[idx] = e.target.value;
                      setNewQuestion({...newQuestion, options: newOpts});
                    }}
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-16 pr-5 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all duration-300 text-sm font-medium"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-2">Verification Key (Correct Option)</label>
              <div className="relative">
                <select 
                  value={newQuestion.correct_option}
                  onChange={(e) => setNewQuestion({...newQuestion, correct_option: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all duration-300 text-sm font-bold appearance-none cursor-pointer"
                >
                  {newQuestion.options.map((_, idx) => (
                    <option key={idx} value={idx}>Selection Alternative {String.fromCharCode(65 + idx)}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-slate-400">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-2">Rationale / Explanation</label>
              <textarea 
                placeholder="Provide a logical breakdown for the correct answer..." 
                value={newQuestion.explanation}
                onChange={(e) => setNewQuestion({...newQuestion, explanation: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all duration-300 min-h-[100px] text-sm font-medium leading-relaxed"
              />
            </div>
            
            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-5 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 tracking-wide uppercase text-xs">
              Commit Question
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            </button>
          </form>
          
          {/* Documentation Block */}
          <div className="mt-10 p-6 rounded-2xl bg-slate-50 border border-slate-100">
            <h4 className="font-bold text-slate-900 text-xs tracking-wide flex items-center gap-2 mb-4">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h.008v.008H12V7.5zM12 21a9 9 0 110-18 9 9 0 010 18zm0-9h.008v5.25H12V12z" /></svg>
              Standard Interface Specs
            </h4>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {['question', 'opt1', 'opt2', 'opt3', 'opt4', 'correct_option'].map(h => (
                  <span key={h} className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 font-bold text-[9px] font-mono shadow-sm">{h}</span>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Ensure Excel headers match exactly for perfect synchronization. Answer keys accept A-D, 0-3, or literal text matches.</p>
            </div>
          </div>
        </div>

        {/* Question Schema List */}
        <div className="lg:col-span-7 flex flex-col gap-6 order-1 lg:order-2 w-full">
          <div className="flex items-center justify-between mb-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Active Assessment Pool</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Population</span>
              <span className="text-xs font-bold bg-white text-slate-900 px-3 py-1 rounded-lg border border-slate-200 shadow-sm">{questions.length} Units</span>
            </div>
          </div>
          
          <div className="space-y-6 w-full animate-slide-up">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin mb-6"></div>
                <p className="text-sm font-bold text-slate-900">Synchronizing with question bank...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center bg-slate-50/30 border-2 border-dashed border-slate-200 rounded-[2.5rem] w-full text-center px-10">
                <div className="w-20 h-20 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-200 mb-6 shadow-sm">
                  <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" /></svg>
                </div>
                <p className="text-slate-900 font-bold text-xl mb-2">No Content Identified</p>
                <p className="text-slate-400 font-medium text-sm max-w-xs">Start building your assessment by adding individual questions or uploading a bulk dataset.</p>
              </div>
            ) : (
              questions.map((q, qIdx) => (
                <div key={q.id} className="bg-white p-8 rounded-3xl border border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 group relative">
                  <div className="flex justify-between items-start gap-6 mb-8">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Entry #{qIdx + 1}</span>
                        <div className="h-px w-8 bg-slate-100" />
                      </div>
                      <p className="text-xl font-bold text-slate-900 leading-snug break-words">{q.question_text}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="w-10 h-10 rounded-xl bg-white border border-slate-50 text-slate-300 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 shadow-sm"
                      title="Purge Entry"
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = q.correct_option === optIdx;
                      return (
                        <div 
                          key={optIdx} 
                          className={`px-5 py-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                            isCorrect 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm ring-2 ring-emerald-500/10' 
                              : 'bg-slate-50 border-slate-50 text-slate-500 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <span className={`text-[10px] font-bold ${isCorrect ? 'text-emerald-500' : 'text-slate-300'} shrink-0`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span> 
                            <span className="text-sm font-bold truncate">{opt}</span>
                          </div>
                          {isCorrect && (
                            <svg className="text-emerald-500 shrink-0" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {q.explanation && (
                    <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex gap-4 w-full">
                      <div className="shrink-0 mt-1 text-indigo-400">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-indigo-900 text-[10px] uppercase tracking-widest block mb-2">Scientific Rationale</span>
                        <p className="text-sm font-medium text-indigo-900 leading-relaxed italic break-words opacity-80">{q.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
        </div>
      </div>
    </div>

      {/* JSON Paste Modal */}
      {showJsonPaste && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-slide-up">
            <div className="p-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Direct Code Injection</h3>
                  <p className="text-slate-400 font-medium text-sm">Paste your JSON question array below</p>
                </div>
                <button 
                  onClick={() => setShowJsonPaste(false)}
                  className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center"
                >
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <textarea 
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder={`[
  {
    "question": "Sample Question?",
    "options": ["Opt 1", "Opt 2", "Opt 3", "Opt 4"],
    "correctOption": 1
  }
]`}
                    className={`w-full h-[300px] bg-slate-50 border ${jsonStats ? (jsonStats.valid ? 'border-emerald-200 ring-4 ring-emerald-500/5' : 'border-red-200 ring-4 ring-red-500/5') : 'border-slate-100'} rounded-2xl p-6 font-mono text-xs text-slate-700 focus:outline-none focus:border-slate-900 transition-all leading-relaxed mb-4`}
                  />
                  
                  {jsonStats && (
                    <div className={`absolute bottom-6 right-6 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm ${jsonStats.valid ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                      {jsonStats.valid ? (
                        <>
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          Structure Ready: {jsonStats.count} Units
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                          Parsing Error
                        </>
                      )}
                    </div>
                  )}
                </div>

                {jsonStats && !jsonStats.valid && (
                  <div className="bg-red-50 text-red-900 p-4 rounded-2xl text-[10px] font-bold border border-red-100 flex items-center gap-3 animate-shake">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 12.626zM12 17.25h.007v.008H12v-.008z" /></svg>
                    {jsonStats.error}
                  </div>
                )}

                <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100">
                  <h4 className="text-[10px] font-bold text-indigo-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                    Smarter Mapping Engine
                  </h4>
                  <p className="text-[10px] text-indigo-900/60 font-medium leading-relaxed">
                    Auto-detects: <code className="bg-white px-1 rounded">question/text</code>, <code className="bg-white px-1 rounded">options/opt1</code>, <code className="bg-white px-1 rounded">correctOption/ans</code>. 1-indexed and 0-indexed values are handled automatically.
                  </p>
                </div>

                <button 
                  onClick={handleJsonImport}
                  disabled={isUploading || (jsonStats && !jsonStats.valid)}
                  className={`w-full font-bold py-5 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase text-xs tracking-widest ${isUploading || (jsonStats && !jsonStats.valid) ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800'}`}
                >
                  {isUploading ? 'Executing Sync...' : 'Inject Code Into Database'}
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageQuestions;

