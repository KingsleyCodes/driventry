// lib/customer-analysis.js
export const CUSTOMER_FOLLOWUP_TYPES = {
  UPGRADE_ELIGIBLE: 'upgrade_eligible',
  SUPPORT_FOLLOWUP: 'support_followup',
  NEW_ARRIVAL_NOTIFICATION: 'new_arrival_notification',
  LOYALTY_REWARD: 'loyalty_reward'
};

export const PHONE_LIFECYCLE = {
  FLAGSHIP: 24, // months
  MID_RANGE: 18, // months
  BUDGET: 12, // months
  DEFAULT: 18 // months
};

// AI Analysis Engine
export class CustomerAnalysisEngine {
  static analyzeCustomerForFollowup(transactions, products, customerInfo) {
    const analysis = {
      score: 0,
      type: null,
      reason: '',
      urgency: 'low', // low, medium, high
      suggestedAction: '',
      confidence: 0
    };

    if (!transactions || transactions.length === 0) {
      return null;
    }

    // Get latest transaction
    const latestTransaction = transactions[0];
    const purchaseDate = latestTransaction.timestamp?.toDate?.();
    
    if (!purchaseDate) {
      return null;
    }

    const monthsSincePurchase = this.getMonthsDifference(purchaseDate, new Date());
    const totalSpent = transactions.reduce((sum, t) => sum + (t.total || 0), 0);
    const transactionCount = transactions.length;

    // Analyze purchased products
    const purchasedProducts = this.analyzePurchasedProducts(transactions, products);
    const averageProductAge = this.calculateAverageProductAge(purchasedProducts);

    // Calculate upgrade eligibility
    const upgradeScore = this.calculateUpgradeScore(monthsSincePurchase, averageProductAge, purchasedProducts);
    
    // Calculate support need score (based on purchase age and product type)
    const supportScore = this.calculateSupportScore(monthsSincePurchase, purchasedProducts);
    
    // Calculate loyalty score
    const loyaltyScore = this.calculateLoyaltyScore(transactionCount, totalSpent, monthsSincePurchase);

    // Determine primary follow-up type
    if (upgradeScore >= 0.7 && monthsSincePurchase >= 12) {
      analysis.type = CUSTOMER_FOLLOWUP_TYPES.UPGRADE_ELIGIBLE;
      analysis.score = upgradeScore;
      analysis.urgency = monthsSincePurchase >= 18 ? 'high' : 'medium';
      analysis.reason = `Customer purchased ${this.getProductTypes(purchasedProducts)} ${Math.round(monthsSincePurchase)} months ago`;
      analysis.suggestedAction = `Contact about upgrading to newer ${this.getUpgradeSuggestion(purchasedProducts)} models`;
      analysis.confidence = Math.min(upgradeScore * 100, 95);
    } 
    else if (supportScore >= 0.6) {
      analysis.type = CUSTOMER_FOLLOWUP_TYPES.SUPPORT_FOLLOWUP;
      analysis.score = supportScore;
      analysis.urgency = monthsSincePurchase >= 24 ? 'high' : 'medium';
      analysis.reason = `Customer's device may need maintenance or support after ${Math.round(monthsSincePurchase)} months of use`;
      analysis.suggestedAction = 'Check if they are experiencing any issues and offer support services';
      analysis.confidence = Math.min(supportScore * 100, 85);
    }
    else if (loyaltyScore >= 0.8) {
      analysis.type = CUSTOMER_FOLLOWUP_TYPES.LOYALTY_REWARD;
      analysis.score = loyaltyScore;
      analysis.urgency = 'medium';
      analysis.reason = `Loyal customer with ${transactionCount} purchases totaling $${totalSpent}`;
      analysis.suggestedAction = 'Offer loyalty discount or early access to new arrivals';
      analysis.confidence = Math.min(loyaltyScore * 100, 90);
    }

    return analysis.score > 0 ? analysis : null;
  }

  static getMonthsDifference(date1, date2) {
    return (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth());
  }

  static analyzePurchasedProducts(transactions, products) {
    const purchasedProducts = [];
    
    transactions.forEach(transaction => {
      transaction.items?.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          purchasedProducts.push({
            ...product,
            purchaseDate: transaction.timestamp?.toDate?.(),
            quantity: item.quantity
          });
        }
      });
    });

    return purchasedProducts;
  }

  static calculateAverageProductAge(purchasedProducts) {
    if (purchasedProducts.length === 0) return 0;
    
    const totalAge = purchasedProducts.reduce((sum, product) => {
      const productAge = this.estimateProductAge(product);
      return sum + productAge;
    }, 0);
    
    return totalAge / purchasedProducts.length;
  }

  static estimateProductAge(product) {
    // Simple estimation based on product name and category
    const name = product.name?.toLowerCase() || '';
    
    if (name.includes('iphone 15') || name.includes('samsung s24') || name.includes('2024')) return 3;
    if (name.includes('iphone 14') || name.includes('samsung s23') || name.includes('2023')) return 12;
    if (name.includes('iphone 13') || name.includes('samsung s22') || name.includes('2022')) return 24;
    if (name.includes('iphone 12') || name.includes('samsung s21') || name.includes('2021')) return 36;
    
    return 18; // Default average
  }

  static calculateUpgradeScore(monthsSincePurchase, averageProductAge, purchasedProducts) {
    let score = 0;
    
    // Base score on time since purchase
    if (monthsSincePurchase >= 24) score += 0.8;
    else if (monthsSincePurchase >= 18) score += 0.6;
    else if (monthsSincePurchase >= 12) score += 0.4;
    
    // Adjust based on product age at time of purchase
    if (averageProductAge >= 24) score += 0.3;
    else if (averageProductAge >= 12) score += 0.2;
    
    // Bonus for flagship products (more likely to upgrade)
    const hasFlagship = purchasedProducts.some(p => 
      p.name?.toLowerCase().includes('pro') || 
      p.name?.toLowerCase().includes('ultra') ||
      p.name?.toLowerCase().includes('max')
    );
    if (hasFlagship) score += 0.2;
    
    return Math.min(score, 1.0);
  }

  static calculateSupportScore(monthsSincePurchase, purchasedProducts) {
    let score = 0;
    
    // Higher score for older purchases
    if (monthsSincePurchase >= 18) score += 0.7;
    else if (monthsSincePurchase >= 12) score += 0.5;
    else if (monthsSincePurchase >= 6) score += 0.3;
    
    // Bonus for complex devices (more likely to need support)
    const hasComplexDevice = purchasedProducts.some(p => 
      p.name?.toLowerCase().includes('fold') || 
      p.name?.toLowerCase().includes('flip') ||
      p.name?.toLowerCase().includes('gaming')
    );
    if (hasComplexDevice) score += 0.3;
    
    return Math.min(score, 1.0);
  }

  static calculateLoyaltyScore(transactionCount, totalSpent, monthsSinceLastPurchase) {
    let score = 0;
    
    // Based on number of transactions
    if (transactionCount >= 5) score += 0.6;
    else if (transactionCount >= 3) score += 0.4;
    else if (transactionCount >= 2) score += 0.2;
    
    // Based on total spent
    if (totalSpent >= 2000) score += 0.4;
    else if (totalSpent >= 1000) score += 0.3;
    else if (totalSpent >= 500) score += 0.2;
    
    // Penalty for long time since last purchase
    if (monthsSinceLastPurchase <= 3) score += 0.3;
    else if (monthsSinceLastPurchase <= 6) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  static getProductTypes(purchasedProducts) {
    const types = purchasedProducts.map(p => {
      const name = p.name?.toLowerCase() || '';
      if (name.includes('iphone')) return 'iPhone';
      if (name.includes('samsung')) return 'Samsung';
      if (name.includes('pixel')) return 'Google Pixel';
      if (name.includes('oneplus')) return 'OnePlus';
      return 'device';
    });
    
    return [...new Set(types)].join(', ') || 'device';
  }

  static getUpgradeSuggestion(purchasedProducts) {
    const brands = purchasedProducts.map(p => {
      const name = p.name?.toLowerCase() || '';
      if (name.includes('iphone')) return 'iPhone';
      if (name.includes('samsung')) return 'Samsung';
      if (name.includes('pixel')) return 'Pixel';
      return null;
    }).filter(Boolean);
    
    return [...new Set(brands)].join(' or ') || 'latest';
  }
}