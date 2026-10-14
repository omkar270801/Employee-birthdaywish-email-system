export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  designation: string;
  dateOfBirth: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailLog {
  id: string;
  employeeId: string;
  templateId: string;
  birthdayDate: string;
  recipientEmail: string;
  subject: string;
  status: string;
  sentAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  employee?: {
    name: string;
    email: string;
    department: string;
    designation: string;
  };
  template?: {
    name: string;
  };
}

export interface DashboardStats {
  totalEmployees: number;
  todayBirthdays: Array<{
    id: string;
    name: string;
    email: string;
    designation: string;
    dateOfBirth: string;
    emailStatus: string;
  }>;
  todayEmailsSent: number;
  todayEmailsNotSent: number;
  upcomingCount: number;
}

export interface UpcomingBirthday {
  employee: {
    id: string;
    name: string;
    email: string;
    department: string;
    designation: string;
    dateOfBirth: string;
  };
  date: string;
}
