'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car,
  Plus,
  Loader2,
  MapPin,
  ChevronDown,
  ChevronUp,
  Navigation,
  RefreshCw,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import SharedHeader from '@/components/SharedHeader';
import LocationPrompt from '@/components/carpool/LocationPrompt';
import CarpoolRideCard from '@/components/carpool/CarpoolRideCard';
import CarpoolMapWrapper from '@/components/carpool/CarpoolMapWrapper';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useCarpoolPolling } from '@/hooks/useCarpoolPolling';
import { generateOfferCopy } from '@/lib/utils/carpool-copy';
import { useAuth } from '@/contexts/AuthContext';

export default function FindRidePage() {
  const router = useRouter();
  const { isAuthenticated, promptAuth } = useAuth();
  const [activeTab, setActiveTab] = useState('carpool');
  const [mapExpanded, setMapExpanded] = useState(false);

  // Auto-expand map on desktop
  const [desktopChecked, setDesktopChecked] = useState(false);
  if (typeof window !== 'undefined' && !desktopChecked) {
    if (window.innerWidth >= 1024) setMapExpanded(true);
    setDesktopChecked(true);
  }

  const geo = useGeolocation();
  const { posts, isLoading, isRefreshing, newPostIds, userInteractions, refetch } =
    useCarpoolPolling({
      postType: 'carpool-offer',
      viewerLat: geo.latitude,
      viewerLng: geo.longitude,
    });

  const handlePostRequest = () => {
    if (!isAuthenticated) {
      promptAuth('Sign in to post a ride request');
      return;
    }
    router.push('/create?type=carpool-request');
  };

  const handlePostClick = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  return (
    <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <SharedHeader>
        <header className="header-mobile px-5 pt-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-neutral-500 mb-0.5">Carpool</p>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Car className="w-6 h-6 text-sky-500" />
                Find a Ride
              </h1>
            </div>
            {isRefreshing && (
              <Loader2 className="w-4 h-4 animate-spin text-[var(--teal-500)]" />
            )}
          </div>
          <p className="text-sm text-neutral-500">
            See drivers offering rides near you
          </p>
        </header>

        <header className="header-web">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
                <Car className="w-7 h-7 text-sky-500" />
                Find a Ride
              </h1>
              <p className="text-neutral-500 mt-1">
                Drivers offering rides near you
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isRefreshing && (
                <Loader2 className="w-4 h-4 animate-spin text-[var(--teal-500)]" />
              )}
              <button
                onClick={refetch}
                className="p-2 rounded-full hover:bg-[var(--peach-100)] dark:hover:bg-neutral-800 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
          </div>
        </header>
      </SharedHeader>

      <div className="content-container">
        <div className="three-column-layout">
          <div className="main-feed safe-bottom">
            <div className="px-5 lg:px-0">
              {/* Location prompt */}
              <LocationPrompt
                locationName={geo.locationName}
                hasExplicitLocation={geo.hasExplicitLocation}
                isLoading={geo.isLoading}
                error={geo.error}
                dismissed={geo.dismissed}
                onRequestLocation={geo.requestLocation}
                onDismiss={geo.dismissPrompt}
              />

              {/* Location confirmation */}
              {geo.hasExplicitLocation && geo.locationName && (
                <div className="flex items-center gap-2 mb-4 text-xs text-neutral-500">
                  <Navigation className="w-3 h-3 text-[var(--teal-500)]" />
                  <span>Showing rides near <strong className="text-neutral-700 dark:text-neutral-300">{geo.locationName}</strong></span>
                </div>
              )}

              {/* Post a request CTA */}
              <button
                onClick={handlePostRequest}
                className="w-full mb-4 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border-2 border-dashed border-[var(--peach-200)] dark:border-neutral-700 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:border-[var(--teal-400)] hover:text-[var(--teal-600)] dark:hover:border-[var(--teal-500)] dark:hover:text-[var(--teal-400)] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Post a Ride Request
              </button>

              {/* Map section */}
              <div className="mb-4">
                <button
                  onClick={() => setMapExpanded(!mapExpanded)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--peach-50)] dark:bg-neutral-800 hover:bg-[var(--peach-100)] dark:hover:bg-neutral-700 transition-colors mb-2"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    <MapPin className="w-4 h-4 text-[var(--teal-500)]" />
                    Map View
                    {posts.length > 0 && (
                      <span className="text-xs text-neutral-400">
                        ({posts.length} ride{posts.length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </span>
                  {mapExpanded ? (
                    <ChevronUp className="w-4 h-4 text-neutral-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-400" />
                  )}
                </button>

                <AnimatePresence>
                  {mapExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="h-[300px] lg:h-[350px] rounded-2xl overflow-hidden border border-[var(--peach-200)] dark:border-neutral-700">
                        <CarpoolMapWrapper
                          posts={posts}
                          viewerLat={geo.latitude}
                          viewerLng={geo.longitude}
                          mode="find"
                          onPostClick={handlePostClick}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Ride cards list */}
              <div className="space-y-3">
                {isLoading ? (
                  // Loading skeletons
                  Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-[var(--peach-200)] dark:border-neutral-700 animate-pulse"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                        <div className="flex-1">
                          <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-700 rounded mb-1" />
                          <div className="h-3 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
                        </div>
                      </div>
                      <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-700 rounded mb-2" />
                      <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded mb-3" />
                      <div className="flex gap-4">
                        <div className="h-3 w-20 bg-neutral-200 dark:bg-neutral-700 rounded" />
                        <div className="h-3 w-20 bg-neutral-200 dark:bg-neutral-700 rounded" />
                        <div className="h-3 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
                      </div>
                    </div>
                  ))
                ) : posts.length === 0 ? (
                  // Empty state
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-sky-100 dark:bg-sky-500/10 flex items-center justify-center mx-auto mb-4">
                      <Car className="w-8 h-8 text-sky-400" />
                    </div>
                    <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                      No rides nearby
                    </h4>
                    <p className="text-sm text-neutral-500 mb-4">
                      Be the first to offer a ride, or post a request!
                    </p>
                    <button
                      onClick={handlePostRequest}
                      className="btn-primary py-3 px-6 text-sm inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Post a Ride Request
                    </button>
                  </div>
                ) : (
                  posts.map((post) => (
                    <CarpoolRideCard
                      key={post.id}
                      post={post}
                      smartCopy={generateOfferCopy(post, geo.latitude, geo.longitude)}
                      isNew={newPostIds.has(post.id)}
                      mode="find"
                      userInteractions={userInteractions}
                    />
                  ))
                )}
              </div>

              {/* Auto-refresh indicator */}
              {!isLoading && posts.length > 0 && (
                <p className="text-center text-xs text-neutral-400 mt-6 mb-4">
                  Auto-refreshes every 20 seconds
                </p>
              )}
            </div>
          </div>

          {/* Right sidebar - desktop map + info */}
          <aside className="right-sidebar">
            <div className="card-glass p-5 mb-6">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                How it works
              </h3>
              <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-500/10 text-sky-600 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <span>Find a driver heading your way</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10 text-[var(--lime-600)] flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <span>Tap &quot;Join Ride&quot; to start a thread</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--yellow-100)] dark:bg-[var(--yellow-500)]/10 text-[var(--yellow-600)] flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <span>Agree on details and share the cost</span>
                </li>
              </ul>
            </div>

            <div className="card-glass p-5">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                Need a ride regularly?
              </h3>
              <p className="text-sm text-neutral-500 mb-3">
                Post a ride request so drivers can find you.
              </p>
              <button
                onClick={handlePostRequest}
                className="w-full btn-primary py-2.5 text-sm"
              >
                Post a Request
              </button>
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
