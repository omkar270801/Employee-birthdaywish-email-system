import { Response } from 'express';
import * as employeeService from '../services/employee.service';
import * as emailService from '../services/email.service';
import * as templateService from '../services/template.service';
import { AuthRequest } from '../middleware/auth';
import ExcelJS from 'exceljs';

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const parseDateOnly = (value: string): Date | null => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3])
    ? date
    : null;
};

const parseUploadDate = (value: unknown): Date | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = new Date(new Date(1899, 11, 30).getTime() + value * 24 * 60 * 60 * 1000);
    return Number.isNaN(date.getTime()) ? null : new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  if (typeof value !== 'string') return null;

  const text = value.trim();
  const dmy = text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
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
    const sheetRows: unknown[][] = [];
    worksheet.eachRow({ includeEmpty: false }, row => {
      sheetRows.push((row.values as unknown[]).slice(1));
    });
    const headerKeys = (sheetRows[0] || []).map((value, index) => String(value ?? `__EMPTY_${index}`));
    const rawData = sheetRows.slice(1).map(row => Object.fromEntries(
      headerKeys.map((header, index) => [header, row[index]])
    ));

    const normalize = (value: string) =>
      String(value || '')
        .toLowerCase()
        .replace(/[\s_\-]+/g, ' ')
        .trim();

    const filteredData = rawData.filter(row => {
      const values = Object.values(row || {});
      return values.some(value => value !== undefined && value !== null && String(value).trim() !== '');
    });

    if (!filteredData.length) {
      return res.status(400).json({ success: false, message: 'Excel file is empty' });
    }
    if (filteredData.length > 5000) {
      return res.status(400).json({ success: false, message: 'Excel file may contain at most 5,000 employee rows' });
    }

    // Find the actual header row by looking for common header patterns
    const allAliases = [
      ...['name', 'full name', 'employee name', 'employee', 'staff name', 'person name', 'name of the employee', 'name of employee', 'emp name'],
      ...['dob', 'date of birth', 'birth date', 'dateofbirth', 'dob date', 'birthdate', 'birth day', 'date of birth', 'birthday', 'date'],
      ...['email', 'email id', 'e-mail', 'mail', 'email address', 'e mail', 'emailid', 'email id'],
      ...['designation', 'designation ', 'job title', 'position', 'role', 'job role', 'designation name', 'job']
    ];

    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(filteredData.length, 10); i++) {
      const row = filteredData[i];
      const headers = Object.keys(row || {});
      const normalizedHeaders = headers.map(h => normalize(h));
      
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

    // Extract data rows (skip the header row and any rows before it)
    const dataRows = filteredData.slice(headerRowIndex + 1);

    const headerMap: Record<string, string> = {};
    const rawHeaders = Object.keys(filteredData[headerRowIndex] || {});

    const nameAliases = ['name', 'full name', 'employee name', 'employee', 'staff name', 'person name', 'name of the employee', 'name of employee', 'emp name'];
    const dobAliases = ['dob', 'date of birth', 'birth date', 'dateofbirth', 'dob date', 'birthdate', 'birth day', 'date of birth', 'birthday', 'date'];
    const emailAliases = ['email', 'email id', 'e-mail', 'mail', 'email address', 'e mail', 'emailid', 'email id'];
    const designationAliases = ['designation', 'designation ', 'job title', 'position', 'role', 'job role', 'designation name', 'job'];

    rawHeaders.forEach(header => {
      const key = normalize(header);
      if (!headerMap['name'] && nameAliases.some(alias => key === alias || key.includes(alias))) {
        headerMap['name'] = header;
      } else if (!headerMap['dob'] && dobAliases.some(alias => key === alias || key.includes(alias))) {
        headerMap['dob'] = header;
      } else if (!headerMap['email'] && emailAliases.some(alias => key === alias || key.includes(alias))) {
        headerMap['email'] = header;
      } else if (!headerMap['designation'] && designationAliases.some(alias => key === alias || key.includes(alias))) {
        headerMap['designation'] = header;
      }
    });

    const missingHeaders = ['name', 'dob', 'email', 'designation'].filter(key => !headerMap[key]);
    if (missingHeaders.length) {
      return res.status(400).json({ success: false, message: `Missing required columns: ${missingHeaders.join(', ')}` });
    }

    const errors: string[] = [];
    const validEmployees: any[] = [];
    let duplicateCount = 0;
    let addedCount = 0;
    const seenEmails = new Set<string>();

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = i + headerRowIndex + 2; // Adjust for header row and 1-based indexing

      const rawEmail = headerMap['email'] ? row[headerMap['email']] : undefined;
      const email = headerMap['email'] ? String(rawEmail || '').trim() : '';
      const name = headerMap['name'] ? String(row[headerMap['name']] || '').trim() : '';
      const designation = headerMap['designation'] ? String(row[headerMap['designation']] || '').trim() : '';
      const dobRaw = headerMap['dob'] ? row[headerMap['dob']] : undefined;

      const hasExplicitEmail = rawEmail !== undefined && rawEmail !== null && String(rawEmail).trim() !== '';
      const cleanedEmail = email.toLowerCase().replace(/[\s\u00A0]+/g, '').trim();
      const hasValidEmail = isValidEmail(cleanedEmail);
      const dobDate = parseUploadDate(dobRaw);
      if (!name || name.length > 200 || !designation || designation.length > 200 || !hasValidEmail || cleanedEmail.length > 320 || !dobDate) {
        errors.push(`Row ${rowNumber}: Name, valid email, designation, and valid date of birth are required`);
        continue;
      }
      const finalName = name;
      const finalEmail = cleanedEmail;

      if (hasExplicitEmail && seenEmails.has(finalEmail)) {
        errors.push(`Row ${rowNumber}: Duplicate email in file`);
        duplicateCount++;
        continue;
      }

      if (hasExplicitEmail) {
        seenEmails.add(finalEmail);
      }

      const existingEmail = await employeeService.getEmployeeByEmail(finalEmail);
      if (existingEmail) {
        errors.push(`Row ${rowNumber}: Duplicate email in database`);
        duplicateCount++;
        continue;
      }

      validEmployees.push({
        name: finalName,
        email: finalEmail,
        department: 'General',
        designation,
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
