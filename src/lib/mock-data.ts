import { Client, Status, SubmissionType } from '@/types/clients';

const mtdClient: Client = {
  id: 'mtd0',
  niNumber: 'AB 00 00 00 C',
  firstName: 'Client MTD 0 FIRST',
  lastName: 'Client MTD 0 LAST',
  email: 'clientMTD0@mail.com',
  taxReturns: [
    {
      id: 'mtd_0',
      deadline: new Date('2025-08-07'),
      status: Status.filed,
      startTaxYear: 2024,
      submissionType: SubmissionType.q_1,
      type: 'MTD',
      checkList: [
        { text: 'Sales/income records for the quarter', done: true },
        { text: 'Business expense receipts for the quarter', done: true },
        { text: 'Bank statements for the quarter', done: false },
        { text: 'Mileage log (if claiming vehicle expenses)', done: false },
      ],
    },
    {
      id: 'mtd_1',
      deadline: new Date('2025-11-07'),
      status: Status.in_progress,
      startTaxYear: 2024,
      submissionType: SubmissionType.q_2,
      type: 'MTD',
      checkList: [
        { text: 'Sales/income records for the quarter', done: true },
        { text: 'Business expense receipts for the quarter', done: true },
        { text: 'Bank statements for the quarter', done: false },
        { text: 'Mileage log (if claiming vehicle expenses)', done: false },
      ],
    },
    {
      id: 'mtd_2',
      deadline: new Date('2026-02-07'),
      status: Status.not_started,
      startTaxYear: 2024,
      submissionType: SubmissionType.q_3,
      type: 'MTD',
      checkList: [
        { text: 'Sales/income records for the quarter', done: true },
        { text: 'Business expense receipts for the quarter', done: true },
        { text: 'Bank statements for the quarter', done: false },
        { text: 'Mileage log (if claiming vehicle expenses)', done: false },
      ],
    },
  ],
  regime: 'MTD',
};

const sa100Client: Client = {
  id: 'sa1000',
  niNumber: 'AB 00 00 01 C',
  firstName: 'Client SA100 0 FIRST',
  lastName: 'Client SA100 0 LAST',
  email: 'clientSA1000@mail.com',
  taxReturns: [
    {
      id: 'sa100_0',
      deadline: new Date('2026-01-31'),
      status: Status.not_started,
      startTaxYear: 2025,
      type: 'SA100',
      checkList: [
        { text: 'P60 (employment income)', done: true },
        { text: 'P11D (benefits in kind, if applicable)', done: true },
        { text: 'Bank statements', done: true },
        { text: 'Self-employment income and expenses (if sole trader)', done: true },
        { text: 'Rental income and expenses (if landlord)', done: false },
        { text: 'Dividend certificates', done: false },
        { text: 'Pension contribution statements', done: false },
        { text: 'Capital gains records (if applicable)', done: false },
      ],
    },
  ],
  regime: 'SA100',
};

export const clients: Client[] = [mtdClient, sa100Client];
