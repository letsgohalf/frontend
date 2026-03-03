import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Image dimensions
const STORY_SIZE = { width: 1080, height: 1920 };
const SQUARE_SIZE = { width: 1080, height: 1080 };

// Design colors matching the reference
const COLORS = {
  background: '#e8e6e1', // Light gray/beige
  cardBg: '#1f1f1f', // Dark card background
  cardBorder: '#2a2a2a',
  white: '#ffffff',
  textPrimary: '#ffffff',
  textSecondary: '#a3a3a3',
  teal: '#14b8a6',
  peach: '#fcd5ce',
  lavender: '#c4b5fd',
  lime: '#a3e635',
  yellow: '#d4e157',
  pink: '#fda4af',
  star: '#1a1a1a',
};

const postTypeConfig: Record<string, { label: string; bgColor: string; textColor: string; emoji: string }> = {
  'looking-for-roommate': {
    label: 'Looking for roommate',
    bgColor: '#3d3d3d',
    textColor: '#ffffff',
    emoji: '🏠',
  },
  'looking-for-place': {
    label: 'Looking for place',
    bgColor: '#c4b5fd33',
    textColor: '#c4b5fd',
    emoji: '🔑',
  },
  'have-spare-room': {
    label: 'Has spare room',
    bgColor: '#a3e63533',
    textColor: '#a3e635',
    emoji: '🏠',
  },
  'announcement': {
    label: 'Announcement',
    bgColor: '#fcd34d33',
    textColor: '#fcd34d',
    emoji: '📢',
  },
  'house-alert': {
    label: '🚨 House Alert',
    bgColor: '#f8717133',
    textColor: '#f87171',
    emoji: '🚨',
  },
  'subscription-split': {
    label: 'Subscription Split',
    bgColor: '#a78bfa33',
    textColor: '#a78bfa',
    emoji: '📺',
  },
  'grocery-split': {
    label: 'Grocery Split',
    bgColor: '#4ade8033',
    textColor: '#4ade80',
    emoji: '🛒',
  },
  'carpool-offer': {
    label: 'Carpool Offer',
    bgColor: '#38bdf833',
    textColor: '#38bdf8',
    emoji: '🚗',
  },
  'carpool-request': {
    label: 'Looking for a Ride',
    bgColor: '#fbbf2433',
    textColor: '#fbbf24',
    emoji: '🙋',
  },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function formatTimeAgo(date: string): string {
  const now = new Date();
  const postDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

  if (diffInSeconds < 3600) return `${Math.max(1, Math.floor(diffInSeconds / 60))}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  return postDate.toLocaleDateString();
}

// Background watermark logo
const LogoWatermark = ({ x, y, size, opacity, origin }: { x: number; y: number; size: number; opacity: number; origin: string }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity,
    }}
  >
    <img
      src={`${origin}/logo/letsgohalf-icon-logo-trimmed.png`}
      alt=""
      width={size}
      height={size}
    />
  </div>
);

// 4-pointed star
const Star = ({ x, y, size = 24 }: { x: number; y: number; size?: number }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <svg width={size} height={size} viewBox="0 0 24 24" fill={COLORS.star}>
      <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z" />
    </svg>
  </div>
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'square';
    
    const size = format === 'story' ? STORY_SIZE : SQUARE_SIZE;
    const isStory = format === 'story';
    
    // Fetch post data from backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/posts/${id}`);
    
    if (!response.ok) {
      return new Response('Post not found', { status: 404 });
    }
    
    const post = await response.json();
    const typeConfig = postTypeConfig[post.postType] || postTypeConfig['looking-for-roommate'];
    
    // Get author initials
    const initials = post.author?.name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: COLORS.background,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Background watermark logo */}
          <LogoWatermark
            x={isStory ? 290 : 340}
            y={isStory ? 700 : 280}
            size={isStory ? 500 : 400}
            opacity={0.08}
            origin={new URL(request.url).origin}
          />
          
          {/* Stars in corners */}
          <Star x={80} y={isStory ? 1780 : 920} size={32} />
          <Star x={968} y={isStory ? 1780 : 920} size={32} />
          {isStory && (
            <>
              <Star x={120} y={100} size={24} />
              <Star x={920} y={150} size={28} />
            </>
          )}

          {/* Logo in top left */}
          <div
            style={{
              position: 'absolute',
              top: 50,
              left: 50,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <img
              src={`${new URL(request.url).origin}/logo/letsgohalf-icon-logo-black-trimmed.png`}
              alt="LetsGoHalf"
              width={64}
              height={64}
            />
          </div>

          {/* Main content area */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: isStory ? '200px 60px 200px' : '120px 60px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Post Card - styled like dark mode app UI */}
            <div
              style={{
                width: '100%',
                maxWidth: isStory ? 960 : 900,
                backgroundColor: COLORS.cardBg,
                borderRadius: 24,
                padding: 32,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              }}
            >
              {/* Author row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {/* Avatar */}
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: COLORS.peach,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>
                      {initials}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 22, fontWeight: 600, color: COLORS.textPrimary }}>
                      {post.author?.name?.split(' ')[0] || 'User'}
                    </span>
                    <span style={{ fontSize: 16, color: COLORS.textSecondary }}>
                      {formatTimeAgo(post.createdAt)}
                    </span>
                  </div>
                </div>
                {/* Three dots menu icon */}
                <div style={{ display: 'flex', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.textSecondary }} />
                  <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.textSecondary }} />
                  <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.textSecondary }} />
                </div>
              </div>

              {/* Post type badge */}
              <div
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: typeConfig.bgColor,
                  color: typeConfig.textColor,
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: 16,
                  fontWeight: 500,
                }}
              >
                {typeConfig.label}
              </div>

              {/* Content */}
              <p
                style={{
                  fontSize: isStory ? 26 : 24,
                  color: COLORS.textPrimary,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {truncateText(post.content, isStory ? 300 : 220)}
              </p>

              {/* Details row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
                {/* Location */}
                {post.location && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: '#2a2a2a',
                      padding: '10px 16px',
                      borderRadius: 20,
                    }}
                  >
                    <span style={{ color: COLORS.teal, fontSize: 16 }}>📍</span>
                    <span style={{ fontSize: 16, color: COLORS.textPrimary }}>
                      {truncateText(post.location, 20)}
                    </span>
                  </div>
                )}

                {/* Budget */}
                {post.budget > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: '#2a2a2a',
                      padding: '10px 16px',
                      borderRadius: 20,
                    }}
                  >
                    <span style={{ color: COLORS.lime, fontSize: 16, fontWeight: 600 }}>
                      {formatCurrency(post.budget)}
                    </span>
                  </div>
                )}

                {/* Spots */}
                {post.spotsAvailable > 0 && post.postType !== 'announcement' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: '#2a2a2a',
                      padding: '10px 16px',
                      borderRadius: 20,
                    }}
                  >
                    <span style={{ fontSize: 16, color: COLORS.textSecondary }}>👥</span>
                    <span style={{ fontSize: 16, color: COLORS.textPrimary }}>
                      {post.spotsAvailable} spot{post.spotsAvailable !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Stats row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 16,
                  borderTop: '1px solid #333',
                  marginTop: 8,
                }}
              >
                <div style={{ display: 'flex', gap: 24 }}>
                  <span style={{ fontSize: 16, color: COLORS.textSecondary }}>
                    {post.likesCount || 0} reactions
                  </span>
                  <span style={{ fontSize: 16, color: COLORS.textSecondary }}>
                    {post.commentsCount || 0} comments
                  </span>
                </div>
                {(post.interestedCount || 0) > 0 && (
                  <span style={{ fontSize: 16, color: COLORS.teal, fontWeight: 500 }}>
                    {post.interestedCount} interested
                  </span>
                )}
              </div>

              {/* Action buttons row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 12,
                }}
              >
                {/* Left actions */}
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 22 }}>🤍</span>
                    <span style={{ fontSize: 16, color: COLORS.textSecondary }}>{post.likesCount || 0}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 22 }}>💬</span>
                    <span style={{ fontSize: 16, color: COLORS.textSecondary }}>{post.commentsCount || 0}</span>
                  </div>
                  <span style={{ fontSize: 22 }}>🔖</span>
                  <span style={{ fontSize: 22 }}>🔗</span>
                </div>

                {/* I'm Interested button */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: COLORS.yellow,
                    padding: '12px 20px',
                    borderRadius: 24,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{typeConfig.emoji}</span>
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>
                    I&apos;m Interested
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom section with QR code and branding */}
          <div
            style={{
              position: 'absolute',
              bottom: isStory ? 100 : 40,
              left: 60,
              right: 60,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
            }}
          >
            {/* Left: Branding */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>
                LetsGoHalf
              </span>
              <span style={{ fontSize: 16, color: '#666' }}>
                Find your perfect split
              </span>
            </div>

            {/* Right: QR Code */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  backgroundColor: '#fff',
                  padding: 8,
                  borderRadius: 12,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  display: 'flex',
                }}
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`https://letsgohalf.com/post/${id}`)}&bgcolor=ffffff&color=1a1a1a`}
                  alt="QR Code"
                  width={80}
                  height={80}
                  style={{ borderRadius: 4 }}
                />
              </div>
              <span style={{ fontSize: 12, color: '#666', fontWeight: 500 }}>
                Scan to view
              </span>
            </div>
          </div>
        </div>
      ),
      {
        ...size,
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      }
    );
  } catch (error) {
    console.error('Error generating post image:', error);
    return new Response('Error generating image', { status: 500 });
  }
}
