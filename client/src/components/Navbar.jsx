import React, { useContext } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

const Navbar = () => {
  const navigate = useNavigate();
  const { userData, backendUrl, setUserData, setIsLoggedin } =
    useContext(AppContent);

  const sendVerificationOtp = async () => {
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(
        backendUrl + "/api/auth/send-verify-otp"
      );

      if (data.success) {
        navigate("/email-verify");
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(backendUrl + "/api/auth/logout");
      data.success && setIsLoggedin(false);
      data.success && setUserData(false);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="w-full flex justify-between items-center p-4 sm:p-6 sm:px-24 absolute top-0">
      <img
        src={assets.logo}
        className="w-28 sm:w-32 cursor-pointer"
        alt="Logo"
        onClick={() => navigate("/")}
      />

      {userData ? (
        <div className="relative group">
          <div className="w-8 h-8 flex justify-center items-center rounded-full bg-black text-white cursor-pointer">
            {userData.name[0].toUpperCase()}
          </div>
          {/* Dropdown Menu */}
          <div className="absolute hidden group-hover:flex flex-col right-0 bg-white shadow-lg rounded-md py-2 w-40 text-sm text-gray-700">
            {!userData.isAccountVerified && (
              <button
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer w-full text-left"
                onClick={sendVerificationOtp}
              >
                Verify Email
              </button>
            )}
            <button
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer w-full text-left"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 border border-gray-500 rounded-full px-6 py-2 text-gray-800 hover:bg-gray-100 transition-all"
        >
          Login <img src={assets.arrow_icon} alt="Arrow Icon" />
        </button>
      )}
    </div>
  );
};

export default Navbar;
