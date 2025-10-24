import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import patientsRoutes from './routes/patients';
import workSchedulesRoutes from './routes/workSchedules';
import appointmentsRoutes from './routes/appointments';
import userServicesRoutes from './routes/userServices';
import usersRoutes from './routes/users';
import patientPlansRoutes from './routes/patientPlans';
import accountsReceivableRoutes from './routes/accountsReceivable';
import accountsPayableRoutes from './routes/accountsPayable';
import transactionsRoutes from './routes/transactions';
import subusersRoutes from './routes/subusers';
import anamneseQuestionsRoutes from './routes/anamneseQuestions';
import anamneseAnswersRoutes from './routes/anamneseAnswers';
import medicalRecordsRoutes from './routes/medicalRecords';
import stripeRoutes from './routes/stripe';

const app = express();

app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/auth', authRoutes);
app.use('/patients', patientsRoutes);
app.use('/work-schedules', workSchedulesRoutes);
app.use('/appointments', appointmentsRoutes);
app.use('/user-services', userServicesRoutes);
app.use('/users', usersRoutes);
app.use('/patient-plans', patientPlansRoutes);
app.use('/accounts-receivable', accountsReceivableRoutes);
app.use('/accounts-payable', accountsPayableRoutes);
app.use('/transactions', transactionsRoutes);
app.use('/subusers', subusersRoutes);
app.use('/anamnese-questions', anamneseQuestionsRoutes);
app.use('/anamnese-answers', anamneseAnswersRoutes);
app.use('/medical-records', medicalRecordsRoutes);
app.use('/stripe', stripeRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Leelo API' });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Log error internally (in production, use proper logging service)
  res.status(500).json({ message: 'Something went wrong!' });
});

export default app; 