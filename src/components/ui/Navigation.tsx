"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { href: "/entry/new", icon: "M12 6v6m0 0v6m0-6h6m-6 0H6", label: "Start Tracking", color: "from-green-400 to-emerald-500", delay: 0.1 },
    { href: "/stats", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", label: "Insights", color: "from-blue-400 to-indigo-500", delay: 0.2 },
    { href: "/goals", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.304 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.304 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.304 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.304 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z", label: "Goals", color: "from-purple-400 to-pink-500", delay: 0.3 },
    { href: "/calendar", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", label: "Calendar", color: "from-orange-400 to-red-500", delay: 0.4 },
    { href: "/profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", label: "Profile", color: "from-cyan-400 to-teal-500", delay: 0.5 }
  ];

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-r from-white via-purple-50 to-white shadow-lg border-b-2 border-purple-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-3xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer">
              <span className="inline-block drop-shadow-lg" style={{
                textShadow: '0 0 15px rgba(99, 102, 241, 0.6)',
                filter: 'drop-shadow(0 0 10px rgba(99, 102, 241, 0.4))'
              }}>
                BUMood ✨
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            {navItems.map((item, index) => {
              const active = isActive(item.href);
              return (
                <motion.div
                  key={item.href}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: item.delay, duration: 0.5 }}
                >
                  <motion.div
                    animate={{ 
                      y: [0, -4, 0],
                    }}
                    transition={{
                      duration: 2 + index * 0.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Link 
                      href={item.href}
                      className={`group flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-lg hover:scale-105 bg-gradient-to-r ${item.color} text-white relative overflow-hidden z-10 ${
                        active ? "ring-4 ring-white ring-opacity-90 shadow-2xl scale-110 border-2 border-white border-opacity-70 animate-pulse" : ""
                      }`}
                    >
                      {/* Animated Background Shimmer */}
                      <motion.div
                        className="absolute inset-0 bg-white pointer-events-none"
                        animate={{
                          x: ['-100%', '200%'],
                          opacity: [0, 0.2, 0]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: index * 0.5
                        }}
                      />
                      
                      {/* Icon with Animation */}
                      <motion.svg 
                        className="w-5 h-5 relative z-10" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        animate={{ 
                          rotate: active ? [0, 10, -10, 0] : [0, 5, -5, 0],
                          scale: active ? [1, 1.1, 1] : [1, 1.05, 1]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </motion.svg>
                      
                      <span className="relative z-10">{item.label}</span>
                    </Link>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
