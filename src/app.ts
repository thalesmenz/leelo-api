import express from 'express';
import cors from 'cors';
import routes from './routes';
import authRoutes from './routes/auth';

const app = express();

app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api', routes);
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Leelo API' });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

export default app; 