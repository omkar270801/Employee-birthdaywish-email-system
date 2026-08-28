import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { EmailTemplate } from '../types';

export function Templates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    isActive: true,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await api.templates.getAll();
      setTemplates(response.data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await api.templates.update(editingTemplate.id, formData);
      } else {
        await api.templates.create(formData);
      }
      setShowModal(false);
      setEditingTemplate(null);
      setFormData({ name: '', subject: '', body: '', isActive: true });
      loadTemplates();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      isActive: template.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await api.templates.delete(id);
      loadTemplates();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Email Templates</h1>
          <p className="text-sm text-slate-500 mt-1">Create and manage birthday email templates</p>
        </div>
        <button
          onClick={() => {
            setEditingTemplate(null);
            setFormData({ name: '', subject: '', body: '', isActive: true });
            setShowModal(true);
          }}
          className="btn-primary"
        >
          Add Template
        </button>
      </div>

      <div className="grid gap-4">
        {templates.map(template => (
          <div key={template.id} className="card p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-base font-semibold text-slate-900">{template.name}</h3>
                  <span className={`badge ${template.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {template.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  <span className="font-medium">Subject:</span> {template.subject}
                </p>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{template.body}</p>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Supported variables: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">{'{{employeeName}}'}</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">{'{{department}}'}</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">{'{{designation}}'}</code>
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button onClick={() => handleEdit(template)} className="btn-secondary btn-sm">
                  Edit
                </button>
                <button onClick={() => handleDelete(template.id)} className="btn-danger btn-sm">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="card p-12 text-center">
            <p className="text-slate-500">No templates found. Create your first template to get started.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">{editingTemplate ? 'Edit Template' : 'Add Template'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Template Name</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Standard Birthday Wish"
                />
              </div>
              <div>
                <label className="label">Subject</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Happy Birthday, {{employeeName}}! 🎂"
                />
              </div>
              <div>
                <label className="label">Body</label>
                <textarea
                  required
                  rows={8}
                  className="input resize-none"
                  value={formData.body}
                  onChange={e => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Dear {{employeeName}},&#10;&#10;Wishing you a very Happy Birthday! 🎂&#10;&#10;Best wishes,&#10;IIM Admin"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                />
                <label htmlFor="isActive" className="text-sm text-slate-700">Active</label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingTemplate ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
