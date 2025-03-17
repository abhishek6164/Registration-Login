import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/mongodb.js';  // Include .js extension
import authRouter from './routes/authRoutes.js'; // Include .js extension
const app = express();
const port = process.env.PORT || 4000;
import dotenv from 'dotenv'
import userRouter from './routes/userRoutes.js';
dotenv.config();

connectDB();
app.use(express.json());
app.use(cookieParser());

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

//API Endpoint 
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/api/auth', authRouter)
app.use('/api/user', userRouter)

app.listen(port, () => {
  console.log(`🚀 Server is running on port: ${port}`);
});
