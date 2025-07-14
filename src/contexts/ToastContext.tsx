import { createContext, ReactNode, useContext, useState } from "react";

type Toast = {
  message: string;
  type?: "success" | "error" | "info";
  id: number;
};
type ToastContextType = {
  showToast: (message: string, type?: "success" | "error" | "info") => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { message, type, id }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3500
    );
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-[4px] right-[4px] z-[9999] flex flex-col gap-[2px] border-2 border-[#030124] p-[4px] rounded-[10px]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-[4px] py-[2px] rounded-[6px] shadow-[10px] text-[#030121] font-bold
              ${
                toast.type === "success"
                  ? "bg-[#00f10f]"
                  : toast.type === "error"
                  ? "bg-[#ff0000]"
                  : "bg-gray-800"
              }
            `}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
