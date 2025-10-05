'use client';

import { useState } from 'react';
import { Heart, Plus, Clock, TrendingUp, Users } from 'lucide-react';
import { WishlistProduct, WISHLIST_STATUS_LABELS, WISHLIST_STATUS_COLORS } from '@/types/chargebaby';
import { CapWidget } from './cap-widget';
// 简单的时间格式化工具
function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays}天前`;
    } else if (diffHours > 0) {
      return `${diffHours}小时前`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}分钟前`;
    } else {
      return '刚刚';
    }
  } catch {
    return '未知时间';
  }
}
import { AddProductModal } from './add-product-modal';

interface WishlistInterfaceProps {
  wishlistProducts: WishlistProduct[];
}

export function WishlistInterface({ wishlistProducts }: WishlistInterfaceProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [votingProducts, setVotingProducts] = useState<Set<string>>(new Set());
  const [selectedStatus, setSelectedStatus] = useState<WishlistProduct['status'] | 'all'>('requested');
  const [pendingVerification, setPendingVerification] = useState<string | null>(null);
  const [capTokens, setCapTokens] = useState<Map<string, string>>(new Map());

  // 按状态筛选产品
  const filteredProducts = selectedStatus === 'all' 
    ? wishlistProducts 
    : wishlistProducts.filter(product => product.status === selectedStatus);

  // 状态统计
  const statusCounts = {
    all: wishlistProducts.length,
    requested: wishlistProducts.filter(p => p.status === 'requested').length,
    planned: wishlistProducts.filter(p => p.status === 'planned').length,
    testing: wishlistProducts.filter(p => p.status === 'testing').length,
    completed: wishlistProducts.filter(p => p.status === 'completed').length,
  };

  const statusFilters = [
    { key: 'requested' as const, label: '等待测试', count: statusCounts.requested },
    { key: 'planned' as const, label: '计划测试', count: statusCounts.planned },
    { key: 'testing' as const, label: '测试中', count: statusCounts.testing },
    { key: 'completed' as const, label: '已完成', count: statusCounts.completed },
    { key: 'all' as const, label: '全部', count: statusCounts.all },
  ];

  // 投票处理
  const handleVote = async (productId: string) => {
    if (votingProducts.has(productId)) return;

    const token = capTokens.get(productId);
    if (!token) {
      setPendingVerification(productId);
      return;
    }

    setVotingProducts(prev => new Set(prev).add(productId));

    try {
      const response = await fetch('/api/wishlist/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, capToken: token }),
      });

      if (response.ok) {
        // 刷新页面以显示新的投票数
        window.location.reload();
      } else {
        console.error('投票失败');
      }
    } catch (error) {
      console.error('投票错误:', error);
    } finally {
      setVotingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleCapVerify = (productId: string, token: string) => {
    setCapTokens(prev => new Map(prev).set(productId, token));
    setPendingVerification(null);
    // 自动执行投票
    setTimeout(() => handleVote(productId), 100);
  };

  const handleCapError = () => {
    setPendingVerification(null);
    alert('验证失败，请重试');
  };

  return (
    <div className="space-y-8">
      {/* 状态筛选器 */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-2 justify-start sm:justify-center min-w-max px-4 sm:px-0">
          {statusFilters.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setSelectedStatus(key)}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                selectedStatus === key
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white/70 text-gray-700 hover:bg-purple-50 border border-gray-200'
              }`}
            >
              {label} {count > 0 && <span className="text-xs">({count})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* 添加产品按钮 */}
      <div className="text-center px-4">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.98] w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          申请新产品测试
        </button>
      </div>

      {/* Cap 验证弹窗 */}
      {pendingVerification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 m-4 max-w-md w-full">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">安全验证</h3>
              <p className="text-gray-600 text-sm">请完成安全验证后继续点赞</p>
            </div>
            <div className="flex justify-center mb-4">
              <CapWidget 
                onVerify={(token) => handleCapVerify(pendingVerification, token)}
                onError={handleCapError}
              />
            </div>
            <div className="text-center">
              <button
                onClick={() => setPendingVerification(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 产品列表 */}
      {filteredProducts.length > 0 ? (
        <div className="grid gap-6">
          {filteredProducts.map((product, index) => (
            <WishlistProductCard 
              key={product.id} 
              product={product} 
              rank={index + 1}
              onVote={handleVote}
              isVoting={votingProducts.has(product.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
              {selectedStatus === 'all' ? <Plus className="w-8 h-8 text-purple-600" /> : <Users className="w-8 h-8 text-purple-600" />}
            </div>
            <div className="text-gray-600">
              <div className="text-lg font-medium mb-2">
                {selectedStatus === 'all' ? '暂无申请产品' : '暂无相关产品'}
              </div>
              <div className="text-sm">
                {selectedStatus === 'all' 
                  ? '还没有用户申请产品测试，成为第一个吧！' 
                  : `当前没有"${WISHLIST_STATUS_LABELS[selectedStatus as WishlistProduct['status']]}"状态的产品`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 添加产品弹窗 */}
      <AddProductModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}

function WishlistProductCard({ 
  product, 
  rank, 
  onVote, 
  isVoting 
}: { 
  product: WishlistProduct; 
  rank: number; 
  onVote: (id: string) => void;
  isVoting: boolean;
}) {

  const getCardStyles = (status: WishlistProduct['status']) => {
    switch (status) {
      case 'requested':
        return 'bg-gray-50/80 border-gray-200/50 hover:bg-gray-100/80';
      case 'planned':
        return 'bg-blue-50/80 border-blue-200/50 hover:bg-blue-100/80';
      case 'testing':
        return 'bg-yellow-50/80 border-yellow-200/50 hover:bg-yellow-100/80';
      case 'completed':
        return 'bg-green-50/80 border-green-200/50 hover:bg-green-100/80';
      default:
        return 'bg-white/70 border-white/20 hover:bg-white/80';
    }
  };

  const getTextStyles = (status: WishlistProduct['status']) => {
    switch (status) {
      case 'requested':
        return 'text-gray-900';
      case 'planned':
        return 'text-blue-900';
      case 'testing':
        return 'text-yellow-900';
      case 'completed':
        return 'text-green-900';
      default:
        return 'text-gray-900';
    }
  };

  return (
    <div className={`backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl shadow-black/5 overflow-hidden hover:shadow-xl sm:hover:shadow-2xl hover:shadow-black/10 transition-all duration-300 ${getCardStyles(product.status)}`}>
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-4 sm:gap-6">
          {/* 排名徽章 */}
          <div className="flex-shrink-0">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-base sm:text-lg font-bold ${
              rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white' :
              rank === 2 ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-white' :
              rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white' :
              'bg-gray-100 text-gray-600'
            }`}>
              {rank}
            </div>
          </div>

          {/* 产品信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* 产品名称和状态 */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                  <h3 className={`text-lg sm:text-xl font-bold leading-tight ${getTextStyles(product.status)}`}>{product.name}</h3>
                  <span className={`self-start px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                    WISHLIST_STATUS_COLORS[product.status]
                  }`}>
                    {WISHLIST_STATUS_LABELS[product.status]}
                  </span>
                </div>
                
                {/* 时间信息 */}
                <div className={`flex items-center gap-1 text-sm ${product.status === 'completed' ? 'text-green-700' : product.status === 'testing' ? 'text-yellow-700' : product.status === 'planned' ? 'text-blue-700' : 'text-gray-600'}`}>
                  <Clock className="w-4 h-4" />
                  {formatRelativeTime(product.submittedAt)}
                </div>
              </div>

              {/* 投票按钮 */}
              <button
                onClick={() => onVote(product.id)}
                disabled={isVoting}
                className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-200 flex-shrink-0 ${
                  isVoting
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200 active:scale-95'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span className="text-sm sm:text-base font-medium">
                  {isVoting ? (
                    <span className="sm:hidden">...</span>
                  ) : (
                    <>
                      <span className="sm:hidden">{product.voteCount}</span>
                      <span className="hidden sm:inline">{product.voteCount} 票</span>
                    </>
                  )}
                </span>
                {!isVoting && (
                  <TrendingUp className="w-4 h-4 hidden sm:block" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
