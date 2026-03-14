import { useLocation, useNavigate } from "react-router-dom";
import { Map, Heart, CalendarDays, Wallet, User } from "lucide-react";

const tabs = [
  { path: "/map", icon: Map, label: "Map" },
  { path: "/favorites", icon: Heart, label: "Favorites" },
  { path: "/reservations", icon: CalendarDays, label: "Bookings" },
  { path: "/wallet", icon: Wallet, label: "Wallet" },
  { path: "/profile", icon: User, label: "Profile" },
];

const HIDDEN_ON = ["/", "/auth"];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  if (HIDDEN_ON.includes(location.pathname)) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[1100] border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom">
      <div className="flex items-center justify-around py-1.5">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <tab.icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
