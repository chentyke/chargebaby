/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    rules: {
      'react/no-unescaped-entities': 'off', // 关闭中文引号警告
    },
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
