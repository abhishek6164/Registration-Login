import express from 'express';
import userAuth from '../middleware/userAuth.js';  // ✅ Use import, not require
import { getUserData } from '../controllers/userController.js'; // ✅ Add .js extension

const userRouter = express.Router();

userRouter.get('/data', userAuth, getUserData);

export default userRouter;