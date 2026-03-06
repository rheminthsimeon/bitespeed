import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import identityRoutes from './routes/identityRoutes.js';

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Identity routes
app.use('/', identityRoutes);

export default app;
