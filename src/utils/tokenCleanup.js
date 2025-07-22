import Token from '../models/token.js';
import User from '../models/User.js';

// Cleanup expired access tokens
export const cleanupExpiredAccessTokens = async () => {
  try {
    console.log('Starting access token cleanup...');
    
    const result = await Token.deleteMany({
      type: 'access',
      expiresAt: { $lt: new Date() }
    });
    
    console.log(`Cleaned up ${result.deletedCount} expired access tokens`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up access tokens:', error);
    return 0;
  }
};

// Cleanup revoked tokens
export const cleanupRevokedTokens = async () => {
  try {
    console.log('Starting revoked token cleanup...');
    
    const result = await Token.deleteMany({
      isRevoked: true
    });
    
    console.log(`Cleaned up ${result.deletedCount} revoked tokens`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up revoked tokens:', error);
    return 0;
  }
};

// Cleanup tokens for inactive users (users who haven't logged in for 90 days)
export const cleanupInactiveSessions = async () => {
  try {
    console.log('Starting inactive session cleanup...');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Find users who haven't logged in for 30 days
    const inactiveUsers = await User.find({
      $or: [
        { lastLogin: { $lt: thirtyDaysAgo } },
        { lastLogin: { $exists: false } }
      ]
    }).select('_id');
    
    const inactiveUserIds = inactiveUsers.map(user => user._id);
    
    if (inactiveUserIds.length === 0) {
      console.log('No inactive users found');
      return 0;
    }
    
    // Delete tokens for inactive users
    const result = await Token.deleteMany({
      userId: { $in: inactiveUserIds }
    });
    
    console.log(`Cleaned up ${result.deletedCount} tokens for ${inactiveUserIds.length} inactive users`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up inactive sessions:', error);
    return 0;
  }
};

// Cleanup tokens that have been accessed more than their max usage limit
export const cleanupOverusedTokens = async () => {
  try {
    console.log('Starting overused token cleanup...');
    
    // Assuming access tokens should not be used more than 1000 times
    // and refresh tokens not more than 100 times
    const result = await Token.deleteMany({
      $or: [
        { type: 'access', usageCount: { $gt: 1000 } },
        { type: 'refresh', usageCount: { $gt: 100 } }
      ]
    });
    
    console.log(`Cleaned up ${result.deletedCount} overused tokens`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up overused tokens:', error);
    return 0;
  }
};

// Get token statistics
export const getTokenStats = async () => {
  try {
    const stats = await Token.aggregate([
      {
        $group: {
          _id: '$type',
          total: { $sum: 1 },
          expired: {
            $sum: {
              $cond: [{ $lt: ['$expiresAt', new Date()] }, 1, 0]
            }
          },
          revoked: {
            $sum: {
              $cond: ['$isRevoked', 1, 0]
            }
          },
          active: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$expiresAt', new Date()] },
                    { $ne: ['$isRevoked', true] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);
    
    const totalStats = await Token.countDocuments();
    
    return {
      total: totalStats,
      byType: stats,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting token stats:', error);
    return null;
  }
};

// Legacy function name for compatibility with scheduler
export const getRedisStats = getTokenStats;

// Cleanup all types of problematic tokens
export const cleanupAllTokens = async () => {
  try {
    console.log('Starting comprehensive token cleanup...');
    
    const [
      expiredAccess,
      expiredRefresh,
      revoked,
      inactive,
      overused
    ] = await Promise.all([
      cleanupExpiredAccessTokens(),
      cleanupExpiredRefreshTokens(),
      cleanupRevokedTokens(),
      cleanupInactiveSessions(),
      cleanupOverusedTokens()
    ]);
    
    const totalCleaned = expiredAccess + expiredRefresh + revoked + inactive + overused;
    
    console.log(`Total tokens cleaned: ${totalCleaned}`);
    console.log(`- Expired access tokens: ${expiredAccess}`);
    console.log(`- Expired refresh tokens: ${expiredRefresh}`);
    console.log(`- Revoked tokens: ${revoked}`);
    console.log(`- Inactive session tokens: ${inactive}`);
    console.log(`- Overused tokens: ${overused}`);
    
    return {
      total: totalCleaned,
      expiredAccess,
      expiredRefresh,
      revoked,
      inactive,
      overused
    };
  } catch (error) {
    console.error('Error in comprehensive cleanup:', error);
    return {
      total: 0,
      expiredAccess: 0,
      expiredRefresh: 0,
      revoked: 0,
      inactive: 0,
      overused: 0
    };
  }
};

// Function to revoke all tokens for a specific user
export const revokeUserTokens = async (userId) => {
  try {
    console.log(`Revoking all tokens for user: ${userId}`);
    
    const result = await Token.updateMany(
      { userId },
      { 
        isRevoked: true,
        revokedAt: new Date()
      }
    );
    
    console.log(`Revoked ${result.modifiedCount} tokens for user ${userId}`);
    return result.modifiedCount;
  } catch (error) {
    console.error('Error revoking user tokens:', error);
    return 0;
  }
};

// Function to revoke a specific token
export const revokeToken = async (tokenValue) => {
  try {
    console.log(`Revoking token: ${tokenValue.substring(0, 10)}...`);
    
    const result = await Token.updateOne(
      { token: tokenValue },
      { 
        isRevoked: true,
        revokedAt: new Date()
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('Token revoked successfully');
      return true;
    } else {
      console.log('Token not found or already revoked');
      return false;
    }
  } catch (error) {
    console.error('Error revoking token:', error);
    return false;
  }
};

// Function to check if a token is valid (not expired or revoked)
export const isTokenValid = async (tokenValue) => {
  try {
    const token = await Token.findOne({ token: tokenValue });
    
    if (!token) {
      return { valid: false, reason: 'Token not found' };
    }
    
    if (token.isRevoked) {
      return { valid: false, reason: 'Token is revoked' };
    }
    
    if (token.expiresAt < new Date()) {
      return { valid: false, reason: 'Token is expired' };
    }
    
    return { valid: true, token };
  } catch (error) {
    console.error('Error validating token:', error);
    return { valid: false, reason: 'Validation error' };
  }
};

// Function to update token usage count
export const incrementTokenUsage = async (tokenValue) => {
  try {
    const result = await Token.updateOne(
      { token: tokenValue },
      { 
        $inc: { usageCount: 1 },
        lastUsedAt: new Date()
      }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error incrementing token usage:', error);
    return false;
  }
};