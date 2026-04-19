import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { rutasRouter } from './routes/rutas';
import { desplazamientosRouter } from './routes/desplazamientos';
import { usersRouter } from './routes/users';
import { errorHandler } from './lib/errors';

if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  throw new Error('FRONTEND_URL debe configurarse en producción');
}

const app = express();
const PORT = process.env.PORT ?? 4000;
const allowedOrigin = process.env.FRONTEND_URL ?? 'http://localhost:3000';

app.use(cors({ origin: allowedOrigin }));
app.use(express.json({ limit: '10kb' }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/rutas', rutasRouter);
app.use('/api/desplazamientos', desplazamientosRouter);
app.use('/api/admin/usuarios', usersRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler global — debe ir al final
app.use(errorHandler);

app.listen(PORT);
