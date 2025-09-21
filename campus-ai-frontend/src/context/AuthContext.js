import React, { createContext, useContext, useReducer, useEffect, useState } from "react";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";

const AuthContext = createContext();
const initialState = { isAuthenticated: false, token: null, user: null };

const reducer = (state, { type, payload }) => {
  switch (type) {
    case "SET_LOGGED_IN":
      return { ...state, isAuthenticated: true, token: payload.token };
      case "SET_PROFILE":
        return { ...state, user: payload.userData };
        case "SET_LOGGED_OUT":
          return initialState;
          default:
            return state;
          }
        };
        
        export function AuthProvider({ children }) {
          const [state, dispatch] = useReducer(reducer, initialState);
          const [isAppLoading, setIsAppLoading] = useState(true); // start loading at app init
          const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchUserProfile(token);
    } else {
      setIsAppLoading(false);
    }
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('res', res)
      const userData = res.data.user; // { email, firstName }
      console.log("userData in context", userData);
      dispatch({ type: "SET_LOGGED_IN", payload: { token } });
      dispatch({ type: "SET_PROFILE", payload:  {userData}  });
    } catch (err) {
      console.error("Auth error:", err);
      localStorage.removeItem("token");
    } finally {
      setIsAppLoading(false);
    }
  };

  const logout = () => {
  localStorage.removeItem("token");
  dispatch({ type: "SET_LOGGED_OUT" });
  navigate('/auth/login');  // ✅ correct way
};
  return (
    <AuthContext.Provider
      value={{ ...state, dispatch, isAppLoading, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);
