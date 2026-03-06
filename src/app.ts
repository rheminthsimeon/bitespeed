import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import identityRoutes from './routes/identityRoutes';

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());

// Root endpoint
app.get('/', (req, res) => {
    res.send('BiteSpeed Identity Reconciliation API is running');
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Identity routes
app.use('/', identityRoutes);

export default app;
