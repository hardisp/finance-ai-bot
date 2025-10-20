import express from 'express';
import dotenv from 'dotenv';
import googleOauth from './routes/googleOauth.js';
import hubspotOauth from './routes/hubspotOauth.js';


dotenv.config();
const app = express();
app.use(express.json());


app.use('/api/oauth', googleOauth);
app.use('/api/oauth', hubspotOauth);


app.get('/api/health', (_req, res) => res.json({status: 'ok'}));


const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Backend listening on ${port}`));