import { Post } from '@/lib/api/posts';
import { haversineDistance } from '@/lib/utils/distance';

function getFirstName(post: Post): string {
  return post.author?.name?.split(' ')[0] || 'Someone';
}

function formatDepartureTime(post: Post): string {
  if (!post.carpoolDepartureTime) return '';

  const dep = new Date(post.carpoolDepartureTime);
  const now = new Date();
  const diffMs = dep.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < 0) return '';
  if (diffMins < 5) return ', leaving now';
  if (diffMins < 60) return `, leaving in ${diffMins}min`;

  // Format time
  const timeStr = dep.toLocaleTimeString('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Check if today or tomorrow
  const isToday = dep.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = dep.toDateString() === tomorrow.toDateString();

  if (isToday) return ` at ${timeStr}`;
  if (isTomorrow) return ` at ${timeStr} tomorrow`;

  const dayStr = dep.toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' });
  return ` on ${dayStr} at ${timeStr}`;
}

function getDistanceText(
  post: Post,
  viewerLat?: number | null,
  viewerLng?: number | null,
): string {
  // Prefer server-computed distance
  if (post.distance != null && post.distance > 0) {
    const km = Math.round(post.distance);
    return km < 1 ? ', less than 1km from you' : `, ${km}km from you`;
  }

  // Fallback to client-side calculation
  if (
    viewerLat != null &&
    viewerLng != null &&
    post.carpoolOriginLat != null &&
    post.carpoolOriginLng != null
  ) {
    const km = haversineDistance(viewerLat, viewerLng, post.carpoolOriginLat, post.carpoolOriginLng);
    return km < 1 ? ', less than 1km from you' : `, ${Math.round(km)}km from you`;
  }

  return '';
}

export function generateOfferCopy(
  post: Post,
  viewerLat?: number | null,
  viewerLng?: number | null,
): string {
  const name = getFirstName(post);
  const origin = post.carpoolOrigin || 'unknown';
  const destination = post.carpoolDestination || 'unknown';
  const distance = getDistanceText(post, viewerLat, viewerLng);
  const time = formatDepartureTime(post);

  return `${name} is offering a ride from ${origin} to ${destination}${distance}${time}`;
}

export function generateRequestCopy(
  post: Post,
  viewerLat?: number | null,
  viewerLng?: number | null,
): string {
  const name = getFirstName(post);
  const origin = post.carpoolOrigin || 'unknown';
  const destination = post.carpoolDestination || 'unknown';
  const distance = getDistanceText(post, viewerLat, viewerLng);
  const time = formatDepartureTime(post);

  return `${name} is looking for a ride from ${origin} to ${destination}${distance}${time}`;
}
