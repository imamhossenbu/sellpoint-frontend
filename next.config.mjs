/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            // Cloudinary
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                pathname: '/**',
            },
            // Add any other hosts you use for coverUrl:
            // { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
            // { protocol: 'https', hostname: 'cdn.yoursite.com', pathname: '/**' },
        ],
    },
};

export default nextConfig;
