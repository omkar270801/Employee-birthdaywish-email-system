import { Response } from 'express';
import * as employeeService from '../services/employee.service';
import * as emailService from '../services/email.service';
import * as templateService from '../services/template.service';
import { AuthRequest } from '../middleware/auth';
import ExcelJS from 'exceljs';
import { createUtcDateOnly } from '../utils/timezone';

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const parseDateOnly = (value: string): Date | null => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = createUtcDateOnly(year, month, day);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? date
    : null;
};

const createDateOfBirth = (year: number, month: number, day: number): Date => createUtcDateOnly(year, month + 1, day);

// ExcelJS returns objects for formulas, rich text, and hyperlinks. Unwrap those
// values before validating/importing so they aren't treated as "[object Object]".
const getCellValue = (value: unknown): unknown => {
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const cell = value as { result?: unknown; text?: unknown; richText?: Array<{ text?: unknown }> };
    if ('result' in cell) return cell.result;
    if (Array.isArray(cell.richText)) return cell.richText.map(part => part.text ?? '').join('');
    if (typeof cell.text === 'string') return cell.text;
  }
  return value;
};

const displayCellValue = (value: unknown): string => {
  const unwrapped = getCellValue(value);
  return unwrapped === undefined || unwrapped === null ? '' : String(unwrapped).trim();
};

const parseUploadDate = (value: unknown): Date | null => {
  value = getCellValue(value);
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    // ExcelJS dates represent the calendar date in UTC. Using local getters can
    // shift the birthday by a day on servers in time zones west of UTC.
    return createDateOfBirth(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const wholeDays = Math.floor(value);
    const date = new Date(Date.UTC(1899, 11, 30 + wholeDays));
    return Number.isNaN(date.getTime()) ? null : createDateOfBirth(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }
  if (typeof value !== 'string') return null;

  const text = value.trim();
  const dmy = text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);
    const date = createUtcDateOnly(year, month, day);
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
  }
  return parseDateOnly(text);
};

export const getEmployees = async (req: AuthRequest, res: Response) => {
  try {
    const { department, isActive, search } = req.query;
    const employees = await employeeService.getAllEmployees({
      department: department as string | undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search: search as string | undefined,
    });
    res.json({ success: true, data: employees });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, data: employee });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const designation = typeof req.body?.designation === 'string' ? req.body.designation.trim() : '';
    const dateOfBirth = typeof req.body?.dateOfBirth === 'string' ? parseDateOnly(req.body.dateOfBirth) : null;
    if (!name || name.length > 200 || !isValidEmail(email) || !designation || designation.length > 200 || !dateOfBirth) {
      return res.status(400).json({ success: false, message: 'Provide a valid name, email, designation, and YYYY-MM-DD date of birth' });
    }

    const existingEmail = await employeeService.getEmployeeByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const employee = await employeeService.createEmployee({
      name,
      email,
      department: 'General',
      designation,
      dateOfBirth,
    });

    res.status(201).json({ success: true, data: employee });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const input = req.body && typeof req.body === 'object' ? req.body : {};
    const allowedFields = ['name', 'email', 'designation', 'dateOfBirth', 'isActive', 'department'];
    if (Object.keys(input).some(field => !allowedFields.includes(field))) {
      return res.status(400).json({ success: false, message: 'Unsupported employee field' });
    }

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) {
      if (typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 200) {
        return res.status(400).json({ success: false, message: 'Name must be 1 to 200 characters' });
      }
      updateData.name = input.name.trim();
    }
    if (input.email !== undefined) {
      if (typeof input.email !== 'string' || !isValidEmail(input.email.trim())) {
        return res.status(400).json({ success: false, message: 'Provide a valid email address' });
      }
      updateData.email = input.email.trim().toLowerCase();
    }
    if (input.designation !== undefined) {
      if (typeof input.designation !== 'string' || !input.designation.trim() || input.designation.trim().length > 200) {
        return res.status(400).json({ success: false, message: 'Designation must be 1 to 200 characters' });
      }
      updateData.designation = input.designation.trim();
    }
    if (input.dateOfBirth !== undefined) {
      const dateOfBirth = typeof input.dateOfBirth === 'string' ? parseDateOnly(input.dateOfBirth) : null;
      if (!dateOfBirth) return res.status(400).json({ success: false, message: 'Date of birth must be a real YYYY-MM-DD date' });
      updateData.dateOfBirth = dateOfBirth;
    }
    if (input.isActive !== undefined) {
      if (typeof input.isActive !== 'boolean') return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
      updateData.isActive = input.isActive;
    }
    if (input.department !== undefined) {
      if (input.department !== null && (typeof input.department !== 'string' || input.department.length > 100)) {
        return res.status(400).json({ success: false, message: 'Department must be at most 100 characters' });
      }
      updateData.department = input.department;
    }
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'At least one employee field is required' });
    }

    if (updateData.email && updateData.email !== employee.email) {
      const existingEmail = await employeeService.getEmployeeByEmail(updateData.email as string);
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }
    }

    const updated = await employeeService.updateEmployee(req.params.id, updateData);

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteEmployee = async (req: AuthRequest, res: Response) => {
  try {
    await employeeService.deleteEmployee(req.params.id);
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadEmployees = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const workbook = new ExcelJS.Workbook();
    const workbookBuffer = Buffer.from(req.file.buffer) as unknown as Parameters<typeof workbook.xlsx.load>[0];
    await workbook.xlsx.load(workbookBuffer);
    const requestedSheet = req.body.sheetName;
    const worksheet = requestedSheet ? workbook.getWorksheet(requestedSheet) : workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({ success: false, message: 'Selected sheet was not found' });
    }
    const sheetRows: Array<{ rowNumber: number; values: unknown[] }> = [];
    worksheet.eachRow({ includeEmpty: false }, row => {
      sheetRows.push({
        rowNumber: row.number,
        values: Array.from({ length: worksheet.columnCount }, (_, index) => row.getCell(index + 1).value),
      });
    });

    const normalize = (value: string) =>
      String(value || '')
        .toLowerCase()
        .replace(/[\s_\-]+/g, ' ')
        .trim();

    if (!sheetRows.length) {
      return res.status(400).json({ success: false, message: 'Excel file is empty' });
    }

    // Find the actual header row by looking for common header patterns
    const allAliases = [
      ...['name', 'full name', 'employee name', 'employee', 'staff name', 'person name', 'name of the employee', 'name of employee', 'emp name'],
      ...['dob', 'date of birth', 'birth date', 'dateofbirth', 'dob date', 'birthdate', 'birth day', 'date of birth', 'birthday', 'date'],
      ...['email', 'email id', 'e-mail', 'mail', 'email address', 'e mail', 'emailid', 'email id'],
      ...['designation', 'designation ', 'job title', 'position', 'role', 'job role', 'designation name', 'job']
    ];

    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(sheetRows.length, 10); i++) {
      const normalizedHeaders = sheetRows[i].values.map(value => normalize(displayCellValue(value)));
      
      // Check if this row has at least 2 columns that match our header aliases
      const matchCount = normalizedHeaders.filter(h => 
        allAliases.some(alias => h === alias || h.includes(alias))
      ).length;

      if (matchCount >= 2) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      return res.status(400).json({ success: false, message: 'Could not find valid header row in Excel file' });
    }

    const headerMap: Record<string, number> = {};
    const rawHeaders = sheetRows[headerRowIndex].values;

    const nameAliases = ['name', 'full name', 'employee name', 'employee', 'staff name', 'person name', 'name of the employee', 'name of employee', 'emp name'];
    const dobAliases = ['dob', 'date of birth', 'birth date', 'dateofbirth', 'dob date', 'birthdate', 'birth day', 'date of birth', 'birthday', 'date'];
    const emailAliases = ['email', 'email id', 'e-mail', 'mail', 'email address', 'e mail', 'emailid', 'email id'];
    const designationAliases = ['designation', 'designation ', 'job title', 'position', 'role', 'job role', 'designation name', 'job'];

    rawHeaders.forEach((header, index) => {
      const key = normalize(displayCellValue(header));
      if (headerMap['name'] === undefined && nameAliases.some(alias => key === alias || key.includes(alias))) {
        headerMap['name'] = index;
      } else if (headerMap['dob'] === undefined && dobAliases.some(alias => key === alias || key.includes(alias))) {
        headerMap['dob'] = index;
      } else if (headerMap['email'] === undefined && emailAliases.some(alias => key === alias || key.includes(alias))) {
        headerMap['email'] = index;
      } else if (headerMap['designation'] === undefined && designationAliases.some(alias => key === alias || key.includes(alias))) {
        headerMap['designation'] = index;
      }
    });

    const missingHeaders = ['name'].filter(key => headerMap[key] === undefined);
    if (missingHeaders.length) {
      return res.status(400).json({ success: false, message: `Missing required columns: ${missingHeaders.join(', ')}` });
    }

    const errors: string[] = [];
    const validEmployees: any[] = [];
    let duplicateCount = 0;
    let addedCount = 0;
    const seenEmails = new Set<string>();
    const dataRows = sheetRows.filter(row => row.rowNumber > sheetRows[headerRowIndex].rowNumber);
    if (dataRows.length > 5000) {
      return res.status(400).json({ success: false, message: 'Excel file may contain at most 5,000 employee rows' });
    }

    for (const row of dataRows) {
      const rowNumber = row.rowNumber;

      const rawEmail = row.values[headerMap['email']];
      const email = displayCellValue(rawEmail);
      const name = headerMap['name'] !== undefined ? displayCellValue(row.values[headerMap['name']]) : '';
      const designation = headerMap['designation'] !== undefined ? displayCellValue(row.values[headerMap['designation']]) : '';
      const dobRaw = row.values[headerMap['dob']];

      if (!name) continue;

      const cleanedEmail = email.toLowerCase().replace(/[\s\u00A0]+/g, '').trim();
      const normalizedEmail = isValidEmail(cleanedEmail) && cleanedEmail.length <= 320 ? cleanedEmail : null;
      const dobDate = parseUploadDate(dobRaw);
      if (name.length > 200) {
        errors.push(`Row ${rowNumber}: Name exceeds 200 characters`);
        continue;
      }

      if (normalizedEmail && seenEmails.has(normalizedEmail)) {
        errors.push(`Row ${rowNumber}: Duplicate email in file`);
        duplicateCount++;
        continue;
      }

      if (normalizedEmail) {
        seenEmails.add(normalizedEmail);
      }

      const existingEmail = normalizedEmail ? await employeeService.getEmployeeByEmail(normalizedEmail) : null;
      if (existingEmail) {
        errors.push(`Row ${rowNumber}: Duplicate email in database`);
        duplicateCount++;
        continue;
      }

      validEmployees.push({
        name,
        email: normalizedEmail,
        department: 'General',
        designation: designation || null,
        dateOfBirth: dobDate,
      });
    }

    if (validEmployees.length > 0) {
      const result = await employeeService.bulkCreateEmployees(validEmployees);
      addedCount = result.count;
    }

    return res.json({
      success: true,
      message: `Upload completed: ${addedCount} added, ${duplicateCount} duplicates skipped`,
      added: addedCount,
      duplicates: duplicateCount,
      invalid: errors.length,
      errors,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
