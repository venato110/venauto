import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

const SplashScreen = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      navigate(user ? "/map" : "/auth");
    }, 2000);
    return () => clearTimeout(timer);
  }, [user, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center venato-gradient">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center"
      >
        {/* Loqo Animasiyası */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="mb-8 flex justify-center"
        >
          {/* Arxa plansız, birbaşa görünən loqo */}
          <img 
            src="/logoo1.png" 
            alt="Venauto Logo" 
            className="h-32 w-32 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none'; 
            }}
          />
        </motion.div>

        {/* Tətbiq Adı */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-4xl font-bold tracking-tight text-primary-foreground"
        >
          Venauto
        </motion.h1>

        {/* Şüar */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-2 text-primary-foreground/70"
        >
          Anında park yeri tap və rezerv et
        </motion.p>

        {/* Yüklənmə İndikatoru */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8"
        >
          <div className="mx-auto h-1 w-16 animate-pulse rounded-full bg-primary-foreground/40" />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
