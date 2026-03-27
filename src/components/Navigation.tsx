'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <motion.nav
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-white/10 backdrop-blur-md rounded-full p-2 border border-white/20"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Link href="/">
        <motion.button
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
            pathname === '/'
              ? 'bg-white text-gray-900'
              : 'text-white hover:bg-white/10'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🎰 뽑기
        </motion.button>
      </Link>
      <Link href="/library">
        <motion.button
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
            pathname === '/library'
              ? 'bg-white text-gray-900'
              : 'text-white hover:bg-white/10'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          📚 라이브러리
        </motion.button>
      </Link>
    </motion.nav>
  );
}