import { toast } from 'react-toastify';

export const showToast = {
  success: (message: string, options?: any) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  },

  error: (message: string, options?: any) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 7000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  },

  info: (message: string, options?: any) => {
    toast.info(message, {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  },

  warning: (message: string, options?: any) => {
    toast.warning(message, {
      position: "top-right",
      autoClose: 6000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  },

  loading: (message: string, options?: any) => {
    return toast.loading(message, {
      position: "top-right",
      autoClose: false,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: false,
      ...options
    });
  },

  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId);
  },

  dismissAll: () => {
    toast.dismiss();
  }
};

// Specific toast messages for the app
export const toastMessages = {
  conversion: {
    completed: "Conversion completed successfully! 🎵",
    failed: "Conversion failed. Please try again.",
    invalidUrl: "Please enter a valid YouTube URL."
  },
  
  download: {
    started: "Download started! 📥",
    failed: "Download failed. Please try again.",
    noFile: "File not found. Please try converting again."
  },
  
  contact: {
    success: "Thank you for your message! We'll get back to you soon. 📧",
    failed: "Failed to send message. Please try again.",
    validation: "Please fill in all required fields."
  }
};
