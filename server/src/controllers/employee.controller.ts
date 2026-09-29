import { Response } from 'express';
import * as employeeService from '../services/employee.service';
import * as emailService from '../services/email.service';
import * as templateService from '../services/template.service';
import { AuthRequest } from '../middleware/auth';
import { validate, body } from '../middleware/validate';
import * as XLSX from 'xlsx';

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
    const { name, email, designation, dateOfBirth } = req.body;

    const existingEmail = await employeeService.getEmployeeByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const employee = await employeeService.createEmployee({
      name,
      email,
      department: 'General',
      designation,
      dateOfBirth: new Date(dateOfBirth),
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

    const { email, ...updateData } = req.body;

    if (email && email !== employee.email) {
      const existingEmail = await employeeService.getEmployeeByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }
    }

    const updated = await employeeService.updateEmployee(req.params.id, {
      ...updateData,
      ...(email && { email }),
      department: 'General',
      ...(req.body.dateOfBirth && { dateOfBirth: new Date(req.body.dateOfBirth) }),
    });

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

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const requestedSheet = req.body.sheetName;
    const sheetName = requestedSheet && workbook.Sheets[requestedSheet] ? requestedSheet : workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { raw: false }) as Record<string, any>[];

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
      const hasValidEmail = cleanedEmail.includes('@');

      let dobDate: Date | null = null;

      if (dobRaw === undefined || dobRaw === null || String(dobRaw).trim() === '') {
        // Allow missing DOB - set to null
        dobDate = null;
      } else if (dobRaw instanceof Date) {
        dobDate = new Date(dobRaw);
      } else if (typeof dobRaw === 'number') {
        const excelEpoch = new Date(1899, 11, 30);
        dobDate = new Date(excelEpoch.getTime() + dobRaw * 24 * 60 * 60 * 1000);
      } else {
        const dobString = String(dobRaw).trim();
        const ddmmyyyy = dobString.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
        if (ddmmyyyy) {
          const day = parseInt(ddmmyyyy[1], 10);
          const month = parseInt(ddmmyyyy[2], 10);
          const year = parseInt(ddmmyyyy[3], 10);
          if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            dobDate = new Date(year, month - 1, day);
          }
        }
        if (!dobDate || isNaN(dobDate.getTime())) {
          const parsed = new Date(dobString);
          if (!isNaN(parsed.getTime())) {
            dobDate = parsed;
          }
        }
        if (!dobDate || isNaN(dobDate.getTime())) {
          // Allow invalid DOB format - set to null
          dobDate = null;
        }
      }

      let finalName = name;
      let finalEmail = cleanedEmail;

      if (!finalName && !hasValidEmail) {
        // If both name and email are missing, skip the row
        continue;
      } else if (!finalName && hasValidEmail) {
        finalName = cleanedEmail.split('@')[0];
      } else if (finalName && !hasValidEmail) {
        // Generate placeholder email if name exists but email is missing
        finalEmail = `${finalName.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@unknown.local`;
      }

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
      await employeeService.bulkCreateEmployees(validEmployees);
      addedCount = validEmployees.length;
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
