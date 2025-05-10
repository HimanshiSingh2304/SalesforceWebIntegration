import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './Routes/auth.js'; 

dotenv.config();

const app = express();
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'https://salesforcewebintegrationfrontend.onrender.com', 
  credentials: true 
}));
app.use(express.json());

app.use('/auth', authRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
