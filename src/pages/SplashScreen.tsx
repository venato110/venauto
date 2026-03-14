import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Car } from "lucide-react";
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
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="mb-6 flex justify-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-foreground/20 backdrop-blur-sm">
            <Car className="h-10 w-10 text-primary-foreground" />
          </div>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-4xl font-bold tracking-tight text-primary-foreground"
        >
          Venato
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-2 text-primary-foreground/70"
        >
          Find & reserve parking instantly
        </motion.p>
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
