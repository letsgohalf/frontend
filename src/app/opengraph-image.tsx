import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';

export const alt = 'LetsGoHalf - Split Costs, Share More';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  const logoData = await readFile(
    join(process.cwd(), 'public/logo/letsgohalf-main-logo-trimmed.png')
  );
  const logoSrc = `data:image/png;base64,${logoData.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: 'linear-gradient(135deg, #fef3e2 0%, #fce7d6 50%, #ffd6e0 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
        }}
      >
        {/* Logo */}
        <img
          src={logoSrc}
          width={797}
          height={219}
          style={{ marginBottom: '24px', objectFit: 'contain', height: '160px', width: 'auto' }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: '36px',
            color: '#0d9488',
            fontWeight: '600',
            marginBottom: '30px',
          }}
        >
          Split Costs, Share More
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: '24px',
            color: '#525252',
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: 1.4,
          }}
        >
          Find your perfect match to split bills or costs. Connect with verified users and save up to 50%.
        </div>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            gap: '40px',
            marginTop: '40px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'white',
              padding: '12px 24px',
              borderRadius: '30px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <span style={{ marginRight: '8px' }}>✓</span>
            <span style={{ fontSize: '20px', color: '#1a1a1a' }}>Verified Users</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'white',
              padding: '12px 24px',
              borderRadius: '30px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <span style={{ marginRight: '8px' }}>💰</span>
            <span style={{ fontSize: '20px', color: '#1a1a1a' }}>Save 50% on Costs</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'white',
              padding: '12px 24px',
              borderRadius: '30px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <span style={{ marginRight: '8px' }}>🤝</span>
            <span style={{ fontSize: '20px', color: '#1a1a1a' }}>Instant Matching</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
