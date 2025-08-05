// src/components/CustomToast.jsx
import toast, { Toaster } from 'react-hot-toast';

export const showCustomToast = ({ type = "success", message = "Mensaje por defecto", duration, height, width}) => {
  const baseStyle = {
    height: height || "200px",
    width: width || "600px",
    maxWidth: width || "3000px",
    padding: "1.5rem",
    borderRadius: "1rem",
    fontSize: "2.25rem",
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  };

  const colorStyles = {
    success: { background: "#22c55e" }, // Verde
    warning: { background: "#facc15" }, // Amarillo
    error: { background: "#ef4444" },   // Rojo
  };

  toast(message, {
    duration: duration || 3000,
    position: "top-center",
    style: {
      ...baseStyle,
      ...(colorStyles[type] || colorStyles.success),
    },
  });
};

// Este es el contenedor que debe ir una vez en App.jsx o layout
export const ToastContainer = () => <Toaster />;
