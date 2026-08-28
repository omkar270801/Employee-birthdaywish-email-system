import { useState, useRef } from 'react';
import { api } from '../services/api';
import * as XLSX from 'xlsx';

export function UploadEmployees() {
  const [file, setFile] = useState<File | null>(null);
  const [sheetName, setSheetName] = useState<string>('');
  const [sheets, setSheets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setResult(null);
    setError('');
    setSheetName('');

    if (selected) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const wb = XLSX.read(evt.target?.result as ArrayBuffer, { type: 'array' });
          setSheets(wb.SheetNames);
          setSheetName(wb.SheetNames[0] || '');
        } catch {
          setSheets([]);
        }
      };
      reader.readAsArrayBuffer(selected);
    } else {
      setSheets([]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await api.employees.upload(file, sheetName);
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      ['Name', 'Designation', 'DOB', 'Email'],
      ['Rahul Sharma', 'Professor', '15/08/1990', 'rahul@example.com'],
      ['Priya Patil', 'Assistant Professor', '22/08/1988', 'priya@example.com'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, 'employee_template.xlsx');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Upload Employees</h1>
        <p className="text-sm text-slate-500 mt-1">Import employee data from Excel file</p>
      </div>

      <div className="card p-6">
        <div className="mb-6">
          <h3 className="text-base font-semibold text-slate-900 mb-2">Excel Format</h3>
          <p className="text-sm text-slate-600 mb-4">Upload an Excel file (.xlsx) with the following columns:</p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 border-b border-slate-200">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 border-b border-slate-200">Designation</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 border-b border-slate-200">DOB</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 border-b border-slate-200">Email</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-2 text-slate-700">Rahul Sharma</td>
                  <td className="px-4 py-2 text-slate-500">Professor</td>
                  <td className="px-4 py-2 text-slate-500">15/08/1990</td>
                  <td className="px-4 py-2 text-slate-500">rahul@example.com</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-slate-700">Priya Patil</td>
                  <td className="px-4 py-2 text-slate-500">Assistant Professor</td>
                  <td className="px-4 py-2 text-slate-500">22/08/1988</td>
                  <td className="px-4 py-2 text-slate-500">priya@example.com</td>
                </tr>
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={downloadTemplate}
            className="mt-4 btn-secondary"
          >
            Download Template
          </button>
        </div>

        <form onSubmit={handleUpload} className="space-y-5">
          <div>
            <label className="label">Select Excel File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          {sheets.length > 1 && (
            <div>
              <label className="label">Select Sheet</label>
              <select
                value={sheetName}
                onChange={e => setSheetName(e.target.value)}
                className="input"
              >
                {sheets.map(sheet => (
                  <option key={sheet} value={sheet}>{sheet}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">File contains {sheets.length} sheets</p>
            </div>
          )}

          {file && (
            <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-3 rounded-lg text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-medium">{file.name}</span>
              <span className="text-indigo-500">({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className={`border px-4 py-3 rounded-lg ${result.success ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
              <p className="font-medium">{result.message}</p>
              <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                <div className="bg-white/60 rounded-lg px-3 py-2">
                  <span className="text-xs text-slate-500 block">Added</span>
                  <span className="text-lg font-bold">{result.added ?? 0}</span>
                </div>
                <div className="bg-white/60 rounded-lg px-3 py-2">
                  <span className="text-xs text-slate-500 block">Duplicates</span>
                  <span className="text-lg font-bold">{result.duplicates ?? 0}</span>
                </div>
                <div className="bg-white/60 rounded-lg px-3 py-2">
                  <span className="text-xs text-slate-500 block">Invalid</span>
                  <span className="text-lg font-bold">{result.invalid ?? 0}</span>
                </div>
              </div>
              {result.errors && result.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-1">Invalid rows:</p>
                  <ul className="list-disc list-inside text-sm max-h-40 overflow-y-auto scrollbar-thin space-y-1">
                    {result.errors.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={!file || loading}
            className="btn-primary w-full"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Uploading...
              </span>
            ) : (
              'Upload Employees'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
