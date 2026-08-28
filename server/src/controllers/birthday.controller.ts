import { Response } from 'express';
import { birthdayJob, getEmailHistory, sendBirthdayEmailToEmployee } from '../services/birthday.service';
import { getTodayBirthdays, getUpcomingBirthdays } from '../services/employee.service';
import { AuthRequest } from '../middleware/auth';

export const getTodayBirthdaysCtrl = async (req: AuthRequest, res: Response) => {
  try {
    const employees = await getTodayBirthdays();
    res.json({ success: true, data: employees });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUpcomingBirthdaysCtrl = async (req: AuthRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const birthdays = await getUpcomingBirthdays(days);
    res.json({ success: true, data: birthdays });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const triggerBirthdayJobCtrl = async (req: AuthRequest, res: Response) => {
  try {
    const result = await birthdayJob();
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendEmailToEmployeeCtrl = async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId } = req.params;
    const result = await sendBirthdayEmailToEmployee(employeeId);
    res.json({ success: result.success, message: result.success ? 'Email sent successfully' : result.error, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
