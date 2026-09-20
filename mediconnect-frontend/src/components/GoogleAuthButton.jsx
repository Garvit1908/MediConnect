import { useEffect, useRef, useState } from "react";
import { useToast } from "../lib/toast";

export default function GoogleAuthButton({
  text = "continue_with",
  onSuccess,
  onError,
  disabled = false,
  width,
}) {
  const containerRef = useRef(null);
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const toast = useToast();

  const successRef = useRef(onSuccess);
  const errorRef = useRef(onError);
  successRef.current = onSuccess;
  errorRef.current = onError;

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;

    if (window.google?.accounts?.id) {
      setIsGsiLoaded(true);
      return;
    }

    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        setIsGsiLoaded(true);
        clearInterval(interval);
      }
    }, 150);

    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 6000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [clientId]);

  useEffect(() => {
    if (!clientId || !isGsiLoaded || !containerRef.current) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response?.credential) {
            successRef.current?.(response.credential);
          } else {
            const err = "No credential received from Google.";
            console.error(err, response);
            errorRef.current?.(err);
          }
        },
      });

      containerRef.current.innerHTML = "";

      window.google.accounts.id.renderButton(containerRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text,
        shape: "rectangular",
        logo_alignment: "center",
        width: width || 380,
      });
    } catch (err) {
      console.error("Error rendering Google Sign-In button:", err);
      errorRef.current?.(err.message || "Failed to initialize Google Sign-In button");
    }
  }, [clientId, isGsiLoaded, text, width]);

  const handleFallbackClick = () => {
    if (!clientId) {
      toast.info(
        "Google Client ID not configured. Please add VITE_GOOGLE_CLIENT_ID to your frontend .env file."
      );
    }
  };

  if (clientId) {
    return (
      <div
        className="google-auth-wrapper"
        style={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          pointerEvents: disabled ? "none" : "auto",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <div ref={containerRef} style={{ width: "100%", display: "flex", justifyContent: "center" }} />
      </div>
    );
  }

  return (
    <div className="google-auth-wrapper" style={{ width: "100%" }}>
      <button
        type="button"
        className="btn btn-outline btn-block google-custom-btn"
        onClick={handleFallbackClick}
        disabled={disabled}
        title="Google Client ID required in .env"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          style={{ marginRight: 10, flexShrink: 0 }}
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>
          {text === "signup_with"
            ? "Sign up with Google"
            : text === "signin_with"
            ? "Sign in with Google"
            : "Continue with Google"}
        </span>
      </button>
    </div>
  );
}
