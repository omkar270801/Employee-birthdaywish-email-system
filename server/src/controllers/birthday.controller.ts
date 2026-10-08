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
    const rawDays = req.query.days;
    const days = rawDays === undefined ? 7 : Number(rawDays);
    if (!Number.isInteger(days) || days < 1 || days > 90) {
      return res.status(400).json({ success: false, message: 'days must be an integer between 1 and 90' });
    }
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
    if (req.body?.resend !== undefined && typeof req.body.resend !== 'boolean') {
      return res.status(400).json({ success: false, message: 'resend must be a boolean' });
    }
    const result = await sendBirthdayEmailToEmployee(employeeId, req.body?.resend === true);
    res.json({
      success: result.success,
      message: result.success ? 'Email sent successfully' : result.error || ('reason' in result ? result.reason : undefined),
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
