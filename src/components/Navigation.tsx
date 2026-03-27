'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <motion.nav
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-nowrap gap-1.5 rounded-full border border-white/20 bg-white/10 p-1.5 backdrop-blur-md sm:top-6 sm:gap-2 sm:p-2"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Link href="/">
        <motion.button
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all sm:px-6 ${
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
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all sm:px-6 ${
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