import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModels.js';
import transporter from '../config/nodemailer.js';
import { EMAIL_VERIFY_TEMPLATE, PASSWORD_RESET_TEMPLATE } from '../config/emailTemplates.js'

export const register = async (req, res) => {
  const { name, email, password } = req.body;  // Fixed typo

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new userModel({
      name,
      email,
      password: hashedPassword
    });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });


    // sending welcome email to user after successful registration 
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: 'Account Verification',
      text: `Hello ${name}, welcome to our platform.  Your account has been created successfully with this email ${email}`
    };
    let info = await transporter.sendMail(mailOptions);
    console.log("📧 Email sent: ", info.response);
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return false;
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid password' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax", // 🔥 FIXED
      maxAge: 30 * 24 * 60 * 60 * 1000
    });


    return res.json({ success: true });

  } catch (error) {  // Fixed missing error parameter
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {  // Fixed parameter order
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production'
    });

    return res.json({ success: true, message: 'Logged out' });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const sendVerifyOtp = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await userModel.findById(userId);

    if (user.isAccountVerified) {
      return res.status(400).json({ success: false, message: 'Account already verified' });
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.verifyOtp = otp;
    user.verifyOtpExpires = Date.now() + 600000; // expires in 10 minutes

    await user.save();

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: 'Account Verification OTP',
      // text: `Hello ${user.name}, Your OTP for account verification is ${otp}`,
      html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  try {
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid user' });
    }

    if (user.verifyOtp === '' || user.verifyOtp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (user.verifyOtpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    user.isAccountVerified = true;
    user.verifyOtp = '';
    user.verifyOtpExpires = 0;

    await user.save();

    return res.json({ success: true, message: 'Account verified successfully' });





  } catch (error) {
    return res.json({ success: false, message: error.message })
  }

}


export const isAuthenticated = async (req, res) => {
  try {
    return res.json({ success: true })
  } catch (error) {
    return res.json({ success: false, message: error.message })
  }
};


export const sendResetOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({
      success: false, message: 'Email is required'
    })
  }

  try {
    const user = await userModel.findOne({ email })

    if (!user) {
      return res.status(400).json({
        success: false, message: 'User not found'
      })
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.resetOtp = otp;
    user.resetOtpExpiresAt = Date.now() + 300000; // expires in 10 minutes

    await user.save();

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: 'Account Verification OTP',
      // text: `Hello ${user.name}, Your OTP for resetting your pass is ${otp}. Using this OTP to proceed with resetting your password `,

      html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
    };

    await transporter.sendMail(mailOptions);

    return res.json({ success: true, message: 'OTP Sent to your email' })
  } catch (error) {
    return res.json({ success: false, message: error.message })
  }
}


export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: 'Email, OTP and new password are required' });
  }

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, message: 'User Not Found' });
    }

    // Debugging logs
    console.log("Stored OTP:", user.resetOtp, "Received OTP:", otp);

    if (!user.resetOtp || user.resetOtp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (user.resetOtpExpiresAt < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetOtp = ""; // Clear OTP after successful reset
    user.resetOtpExpiresAt = 0;

    await user.save();

    return res.json({ success: true, message: 'Password has been reset successfully' });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required' });
  }

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    if (!user.verifyOtp || user.verifyOtp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (user.verifyOtpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpires = 0;

    await user.save();

    return res.json({ success: true, message: 'OTP verified successfully' });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
