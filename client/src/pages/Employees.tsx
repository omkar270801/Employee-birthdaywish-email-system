import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Employee } from '../types';

export function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    designation: '',
    dateOfBirth: '',
    isActive: true,
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await api.employees.getAll();
      setEmployees(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, department: 'General' };
      if (editingEmployee) {
        await api.employees.update(editingEmployee.id, payload);
      } else {
        await api.employees.create(payload);
      }
      setShowModal(false);
      setEditingEmployee(null);
      resetForm();
      loadEmployees();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      designation: emp.designation,
      dateOfBirth: emp.dateOfBirth.split('T')[0],
      isActive: emp.isActive,
    });
    setShowModal(true);
  };

  const handleDeleteAll = async () => {
    if (!confirm(`Are you sure you want to delete ALL ${employees.length} employees? This action cannot be undone.`)) return;
    try {
      await Promise.all(employees.map(emp => api.employees.delete(emp.id)));
      loadEmployees();
    } catch (err: any) {
      alert(err.message || 'Failed to delete employees');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      await api.employees.delete(id);
      loadEmployees();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleStatus = async (emp: Employee) => {
    try {
      await api.employees.update(emp.id, { isActive: !emp.isActive });
      loadEmployees();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      designation: '',
      dateOfBirth: '',
      isActive: true,
    });
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
          <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
          <p className="text-sm text-slate-500 mt-1">Manage employee records</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingEmployee(null);
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary"
          >
            Add Employee
          </button>
          {employees.length > 0 && (
            <button onClick={handleDeleteAll} className="btn-danger">
              Delete All
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Designation</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">DOB</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{emp.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{emp.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{emp.designation}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(emp.dateOfBirth).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${emp.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {emp.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button onClick={() => handleEdit(emp)} className="text-indigo-600 hover:text-indigo-900 font-medium mr-3">
                      Edit
                    </button>
                    <button onClick={() => toggleStatus(emp)} className="text-amber-600 hover:text-amber-900 font-medium mr-3">
                      {emp.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => handleDelete(emp.id)} className="text-red-600 hover:text-red-900 font-medium">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                    No employees found. Add your first employee to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">{editingEmployee ? 'Edit Employee' : 'Add Employee'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Name</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  required
                  className="input"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="label">Designation</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="label">Date of Birth</label>
                <input
                  type="date"
                  required
                  className="input"
                  value={formData.dateOfBirth}
                  onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
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
                  {editingEmployee ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
