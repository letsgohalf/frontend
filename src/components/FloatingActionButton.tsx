'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, PenLine, Building2, Users, Repeat2, ShoppingBasket, Handshake, Car, Navigation } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { playSound } from '@/lib/sounds';

const menuItems = [
  { label: 'Make a Post', icon: PenLine, route: '/create', color: 'text-neutral-700 dark:text-neutral-300' },
  { label: 'House for Rent/Sale', icon: Building2, route: '/create?type=house-listing', color: 'text-orange-600 dark:text-orange-400' },
  { label: 'I Need a Roommate', icon: Users, route: '/create?type=looking-for-roommate', color: 'text-blue-600 dark:text-blue-400' },
  { label: 'Split a Subscription', icon: Repeat2, route: '/create?type=subscription-split', color: 'text-purple-600 dark:text-purple-400' },
  { label: 'Split Groceries', icon: ShoppingBasket, route: '/create?type=grocery-split', color: 'text-green-600 dark:text-green-400' },
  { label: 'Offer a Ride', icon: Car, route: '/carpool/offer', color: 'text-sky-600 dark:text-sky-400' },
  { label: 'Find a Ride', icon: Navigation, route: '/carpool/find', color: 'text-amber-600 dark:text-amber-400' },
  { label: 'Become a Partner', icon: Handshake, route: '/become-partner', color: 'text-[var(--teal-600)] dark:text-[var(--teal-400)]', special: true },
];

export default function FloatingActionButton() {
  const router = useRouter();
  const { isAuthenticated, promptAuth } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      playSound(prev ? 'swooshDown' : 'swooshUp');
      return !prev;
    });
  }, []);

  const handleItemClick = (route: string) => {
    playSound('click');
    setIsOpen(false);
    if (!isAuthenticated && route !== '/become-partner') {
      promptAuth('Sign in to create a post and find your perfect roommate');
      return;
    }
    router.push(route);
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[98]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Menu items */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed bottom-[170px] right-[20px] z-[99] flex flex-col-reverse items-end gap-3 sm:bottom-[184px] sm:right-[32px]">
            {menuItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 22,
                  delay: index * 0.05,
                }}
                className="flex items-center gap-2"
              >
                {/* Label pill */}
                <motion.button
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 22,
                    delay: index * 0.05 + 0.03,
                  }}
                  onClick={() => handleItemClick(item.route)}
                  className={
                    item.special
                      ? "px-4 py-2 rounded-full text-sm font-medium shadow-lg bg-gradient-to-r from-[var(--teal-100)] to-[var(--lime-100)] dark:from-[var(--teal-900)] dark:to-[var(--lime-900)] text-[var(--teal-700)] dark:text-[var(--teal-300)] border border-[var(--teal-200)] dark:border-[var(--teal-700)] whitespace-nowrap"
                      : "px-4 py-2 rounded-full text-sm font-medium shadow-lg bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 whitespace-nowrap"
                  }
                >
                  {item.label}
                </motion.button>

                {/* Icon circle */}
                <button
                  onClick={() => handleItemClick(item.route)}
                  className={
                    item.special
                      ? "w-12 h-12 rounded-full shadow-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-r from-[var(--teal-100)] to-[var(--lime-100)] dark:from-[var(--teal-900)] dark:to-[var(--lime-900)] border border-[var(--teal-200)] dark:border-[var(--teal-700)]"
                      : "w-12 h-12 rounded-full shadow-lg flex items-center justify-center flex-shrink-0 bg-white dark:bg-neutral-800"
                  }
                >
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.3 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggle}
        className="fab"
        aria-label={isOpen ? 'Close menu' : 'Open create menu'}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <Plus className="w-7 h-7" strokeWidth={2.5} />
        </motion.div>
      </motion.button>
    </>
  );
}
