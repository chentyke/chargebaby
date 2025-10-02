/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false, // 可以设置为true来在构建时忽略ESLint错误
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
      {
        protocol: 'https',
        hostname: 'msecfs.opposhop.cn',
      },
      {
        protocol: 'https',
        hostname: 'image.suning.cn',
      },
      {
        protocol: 'https',
        hostname: 'img10.360buyimg.com',
      },
      {
        protocol: 'https',
        hostname: 'gd1.alicdn.com',
      },
      {
        protocol: 'https',
        hostname: 'gd2.alicdn.com',
      },
      {
        protocol: 'https',
        hostname: 'gd3.alicdn.com',
      },
      {
        protocol: 'https',
        hostname: 'gd4.alicdn.com',
      },
    ],
    // 不包含 Notion 域名，强制使用我们的代理
  },
  webpack: (config, { dev }) => {
    // Map core 'punycode' to the userland module to silence Node DEP0040
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      punycode$: require.resolve('punycode/'),
    }
    
    // 优化开发环境构建
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    
    return config
  },
  // Turbopack配置
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
}

module.exports = nextConfig
