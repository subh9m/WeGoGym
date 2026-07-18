import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Auth() {
  const { loginWithEmail, signupWithEmail, loginAnonymously } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      return setError("Enter email and password.");
    }

    try {
      setError("");
      setLoading(true);
      if (isSignUp) {
        await signupWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err) {
      console.error(err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Email already in use.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("Email/Password sign-in is disabled. Enable it in your Firebase Console (Authentication -> Sign-in Method).");
      } else {
        setError("Auth operation failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAnonymousLogin() {
    try {
      setError("");
      setLoading(true);
      await loginAnonymously();
    } catch (err) {
      console.error(err);
      if (err.code === "auth/operation-not-allowed") {
        setError("Anonymous sign-in is disabled. Enable it in your Firebase Console (Authentication -> Sign-in Method).");
      } else {
        setError("Anonymous sign-in failed. Please verify your Firebase connection.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">WeGoGym</div>
          <div className="auth-sub">MINIMAL BODYBUILDING PLANNER</div>
        </div>

        {error && <div className="auth-error-msg">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label className="auth-input-label">Email Address</label>
            <div className="premium-input-box">
              <input 
                type="email" 
                className="premium-inner-input" 
                placeholder="e.g. sbom@wegogym.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label className="auth-input-label">Password</label>
            <div className="premium-input-box">
              <input 
                type="password" 
                className="premium-inner-input" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-premium-primary glow-white" 
            style={{ width: "100%", marginTop: "10px" }}
            disabled={loading}
          >
            {isSignUp ? "Create Account" : "Access Planner"}
          </button>
        </form>

        <div className="auth-mode-toggle">
          {isSignUp ? (
            <>
              Already registered?{" "}
              <span className="auth-toggle-link" onClick={() => setIsSignUp(false)}>
                Login
              </span>
            </>
          ) : (
            <>
              New user?{" "}
              <span className="auth-toggle-link" onClick={() => setIsSignUp(true)}>
                Sign Up
              </span>
            </>
          )}
        </div>

        <div className="divider-text">OR</div>

        <button 
          className="btn-premium-secondary glow-white" 
          style={{ width: "100%" }}
          onClick={handleAnonymousLogin}
          disabled={loading}
        >
          Start Anonymously
        </button>
      </div>
    </div>
  );
}
