import { Response } from 'express';
import { getEmailHistory, deleteEmailLog } from '../services/birthday.service';
import { testEmail } from '../services/email.service';
import { AuthRequest } from '../middleware/auth';
import { validate, body } from '../middleware/validate';

export const getEmailHistoryCtrl = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, status, employeeId } = req.query;
    const history = await getEmailHistory({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      status: status as string | undefined,
      employeeId: employeeId as string | undefined,
    });
    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteEmailLogCtrl = async (req: AuthRequest, res: Response) => {
  try {
    await deleteEmailLog(req.params.id);
    res.json({ success: true, message: 'Email log deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendTestEmailCtrl = async (req: AuthRequest, res: Response) => {
  try {
    const { to, subject, body } = req.body;
    const result = await testEmail(to, subject, body);
    res.json({ success: result.success, message: result.success ? 'Email sent successfully' : 'Failed to send email', data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
