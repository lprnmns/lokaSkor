/**
 * Optimistic Updates System
 * Provides immediate UI feedback with rollback capabilities
 */

import { EventEmitter } from 'events';
import { BusinessCategory, AnalysisMode, LatLng, PointAnalysisResponse, AreaAnalysisResponse } from '../api/types';
import { ErrorLogger } from '../api/errors';

export interface OptimisticUpdate {
  id: string;
  operation: string;
  parameters: Record<string, unknown>;
  optimisticData: any;
  originalData: any;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed' | 'rolled_back';
  retryCount: number;
  maxRetries: number;
  rollbackCallback?: () => void;
  confirmCallback?: (data: any) => void;
  errorCallback?: (error: any) => void;
}

export interface OptimisticUpdateConfig {
  enableOptimisticUpdates: boolean;
  maxPendingUpdates: number;
  defaultTimeout: number;
  autoRollbackOnError: boolean;
  enableConflictResolution: boolean;
  debugMode: boolean;
}

export interface ConflictResolution {
  strategy: 'client_wins' | 'server_wins' | 'merge' | 'user_choice';
  mergeFunction?: (clientData: any, serverData: any) => any;
  userChoiceCallback?: (clientData: any, serverData: any) => Promise<any>;
}

export interface OptimisticUpdateStats {
  totalUpdates: number;
  pendingUpdates: number;
  confirmedUpdates: number;
  failedUpdates: number;
  rolledBackUpdates: number;
  averageConfirmationTime: number;
  successRate: number;
}

export class OptimisticUpdateManager extends EventEmitter {
  private static instance: OptimisticUpdateManager;
  private pendingUpdates: Map<string, OptimisticUpdate> = new Map();
  private updateHistory: OptimisticUpdate[] = [];
  private timers: Map<string, NodeJS.Timeout> = new Map();
  
  private config: OptimisticUpdateConfig = {
    enableOptimisticUpdates: true,
    maxPendingUpdates: 10,
    defaultTimeout: 30000, // 30 seconds
    autoRollbackOnError: true,
    enableConflictResolution: true,
    debugMode: process.env.NODE_ENV === 'development'
  };

  private constructor() {
    super();
  }

  static getInstance(): OptimisticUpdateManager {
    if (!OptimisticUpdateManager.instance) {
      OptimisticUpdateManager.instance = new OptimisticUpdateManager();
    }
    return OptimisticUpdateManager.instance;
  }

  /**
   * Create optimistic update for point analysis
   */
  createPointAnalysisUpdate(
    lat: number,
    lon: number,
    kategori: BusinessCategory,
    callbacks?: {
      rollback?: () => void;
      confirm?: (data: PointAnalysisResponse) => void;
      error?: (error: any) => void;
    }
  ): string {
    const optimisticData = this.generateOptimisticPointAnalysis(lat, lon, kategori);
    
    return this.createOptimisticUpdate(
      'analyzePoint',
      { lat, lon, kategori },
      optimisticData,
      null,
      callbacks
    );
  }

  /**
   * Create optimistic update for area analysis
   */
  createAreaAnalysisUpdate(
    mahalle: string,
    kategori: BusinessCategory,
    callbacks?: {
      rollback?: () => void;
      confirm?: (data: AreaAnalysisResponse) => void;
      error?: (error: any) => void;
    }
  ): string {
    const optimisticData = this.generateOptimisticAreaAnalysis(mahalle, kategori);
    
    return this.createOptimisticUpdate(
      'analyzeArea',
      { mahalle, kategori },
      optimisticData,
      null,
      callbacks
    );
  }

  /**
   * Create optimistic update for heatmap data
   */
  createHeatmapUpdate(
    kategori: BusinessCategory,
    bounds: any,
    callbacks?: {
      rollback?: () => void;
      confirm?: (data: any) => void;
      error?: (error: any) => void;
    }
  ): string {
    const optimisticData = this.generateOptimisticHeatmapData(kategori, bounds);
    
    return this.createOptimisticUpdate(
      'getHeatmapData',
      { kategori, bounds },
      optimisticData,
      null,
      callbacks
    );
  }

  /**
   * Create generic optimistic update
   */
  createOptimisticUpdate(
    operation: string,
    parameters: Record<string, unknown>,
    optimisticData: any,
    originalData: any,
    callbacks?: {
      rollback?: () => void;
      confirm?: (data: any) => void;
      error?: (error: any) => void;
    }
  ): string {
    if (!this.config.enableOptimisticUpdates) {
      throw new Error('Optimistic updates are disabled');
    }

    if (this.pendingUpdates.size >= this.config.maxPendingUpdates) {
      this.cleanupOldestUpdate();
    }

    const update: OptimisticUpdate = {
      id: this.generateId(),
      operation,
      parameters,
      optimisticData,
      originalData,
      timestamp: new Date(),
      status: 'pending',
      retryCount: 0,
      maxRetries: 3,
      rollbackCallback: callbacks?.rollback,
      confirmCallback: callbacks?.confirm,
      errorCallback: callbacks?.error
    };

    this.pendingUpdates.set(update.id, update);
    
    // Set timeout for automatic rollback
    this.setUpdateTimeout(update);
    
    // Emit optimistic update event
    this.emit('optimistic_update_created', update);
    
    if (this.config.debugMode) {
      console.log(`[OptimisticUpdate] Created: ${update.operation} (${update.id})`);
    }

    return update.id;
  }

  /**
   * Confirm optimistic update with server data
   */
  confirmUpdate(updateId: string, serverData: any): boolean {
    const update = this.pendingUpdates.get(updateId);
    if (!update || update.status !== 'pending') {
      return false;
    }

    // Handle potential conflicts
    if (this.config.enableConflictResolution) {
      const resolvedData = this.resolveConflicts(update.optimisticData, serverData);
      if (resolvedData !== serverData) {
        this.handleConflictResolution(update, resolvedData, serverData);
        return true;
      }
    }

    // Confirm the update
    update.status = 'confirmed';
    update.originalData = serverData;
    
    // Clear timeout
    this.clearUpdateTimeout(updateId);
    
    // Move to history
    this.moveToHistory(update);
    
    // Call confirm callback
    if (update.confirmCallback) {
      try {
        update.confirmCallback(serverData);
      } catch (error) {
        ErrorLogger.error(`Confirm callback failed for update ${updateId}`, error as any);
      }
    }

    this.emit('optimistic_update_confirmed', update, serverData);
    
    if (this.config.debugMode) {
      console.log(`[OptimisticUpdate] Confirmed: ${update.operation} (${updateId})`);
    }

    return true;
  }

  /**
   * Fail optimistic update and optionally rollback
   */
  failUpdate(updateId: string, error: any, autoRollback: boolean = this.config.autoRollbackOnError): boolean {
    const update = this.pendingUpdates.get(updateId);
    if (!update || update.status !== 'pending') {
      return false;
    }

    update.status = 'failed';
    
    // Clear timeout
    this.clearUpdateTimeout(updateId);
    
    // Handle rollback
    if (autoRollback) {
      this.rollbackUpdate(updateId);
    } else {
      // Move to history without rollback
      this.moveToHistory(update);
    }

    // Call error callback
    if (update.errorCallback) {
      try {
        update.errorCallback(error);
      } catch (callbackError) {
        ErrorLogger.error(`Error callback failed for update ${updateId}`, callbackError as any);
      }
    }

    this.emit('optimistic_update_failed', update, error);
    
    if (this.config.debugMode) {
      console.log(`[OptimisticUpdate] Failed: ${update.operation} (${updateId})`, error);
    }

    return true;
  }

  /**
   * Rollback optimistic update
   */
  rollbackUpdate(updateId: string): boolean {
    const update = this.pendingUpdates.get(updateId);
    if (!update) {
      return false;
    }

    update.status = 'rolled_back';
    
    // Clear timeout
    this.clearUpdateTimeout(updateId);
    
    // Call rollback callback
    if (update.rollbackCallback) {
      try {
        update.rollbackCallback();
      } catch (error) {
        ErrorLogger.error(`Rollback callback failed for update ${updateId}`, error as any);
      }
    }

    // Move to history
    this.moveToHistory(update);
    
    this.emit('optimistic_update_rolled_back', update);
    
    if (this.config.debugMode) {
      console.log(`[OptimisticUpdate] Rolled back: ${update.operation} (${updateId})`);
    }

    return true;
  }

  /**
   * Get pending update by ID
   */
  getPendingUpdate(updateId: string): OptimisticUpdate | undefined {
    return this.pendingUpdates.get(updateId);
  }

  /**
   * Get all pending updates
   */
  getPendingUpdates(): OptimisticUpdate[] {
    return Array.from(this.pendingUpdates.values());
  }

  /**
   * Get pending updates for specific operation
   */
  getPendingUpdatesByOperation(operation: string): OptimisticUpdate[] {
    return Array.from(this.pendingUpdates.values())
      .filter(update => update.operation === operation);
  }

  /**
   * Check if there are pending updates for parameters
   */
  hasPendingUpdatesForParameters(operation: string, parameters: Record<string, unknown>): boolean {
    return Array.from(this.pendingUpdates.values()).some(update => 
      update.operation === operation && 
      this.parametersMatch(update.parameters, parameters)
    );
  }

  /**
   * Cancel pending update
   */
  cancelUpdate(updateId: string): boolean {
    const update = this.pendingUpdates.get(updateId);
    if (!update || update.status !== 'pending') {
      return false;
    }

    return this.rollbackUpdate(updateId);
  }

  /**
   * Cancel all pending updates
   */
  cancelAllUpdates(): number {
    const pendingIds = Array.from(this.pendingUpdates.keys());
    let cancelledCount = 0;

    pendingIds.forEach(id => {
      if (this.cancelUpdate(id)) {
        cancelledCount++;
      }
    });

    return cancelledCount;
  }

  /**
   * Get optimistic update statistics
   */
  getStats(): OptimisticUpdateStats {
    const now = new Date();
    const recentHistory = this.updateHistory.filter(
      update => now.getTime() - update.timestamp.getTime() < 3600000 // Last hour
    );

    const confirmedUpdates = recentHistory.filter(u => u.status === 'confirmed');
    const failedUpdates = recentHistory.filter(u => u.status === 'failed');
    const rolledBackUpdates = recentHistory.filter(u => u.status === 'rolled_back');

    const totalConfirmationTime = confirmedUpdates.reduce((sum, update) => {
      // This would calculate actual confirmation time
      return sum + 1000; // Placeholder
    }, 0);

    return {
      totalUpdates: recentHistory.length,
      pendingUpdates: this.pendingUpdates.size,
      confirmedUpdates: confirmedUpdates.length,
      failedUpdates: failedUpdates.length,
      rolledBackUpdates: rolledBackUpdates.length,
      averageConfirmationTime: confirmedUpdates.length > 0 ? 
        totalConfirmationTime / confirmedUpdates.length : 0,
      successRate: recentHistory.length > 0 ? 
        (confirmedUpdates.length / recentHistory.length) * 100 : 0
    };
  }

  /**
   * Configure optimistic updates
   */
  configure(config: Partial<OptimisticUpdateConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('config_changed', this.config);
  }

  /**
   * Clear all updates and reset state
   */
  reset(): void {
    // Cancel all pending updates
    this.cancelAllUpdates();
    
    // Clear timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    
    // Clear history
    this.updateHistory = [];
    
    this.emit('reset');
  }

  private generateOptimisticPointAnalysis(
    lat: number,
    lon: number,
    kategori: BusinessCategory
  ): PointAnalysisResponse {
    // Generate realistic optimistic data based on location and category
    const baseScore = this.estimateBaseScore(lat, lon, kategori);
    
    return {
      total_score: baseScore,
      normalized_score: baseScore,
      raw_score: baseScore * 4, // Rough conversion
      category: this.getScoreCategory(baseScore),
      color: this.getScoreColor(baseScore),
      emoji: this.getScoreEmoji(baseScore),
      breakdown: this.generateOptimisticBreakdown(kategori, baseScore),
      optimistic: true,
      loading: false
    } as any;
  }

  private generateOptimisticAreaAnalysis(
    mahalle: string,
    kategori: BusinessCategory
  ): AreaAnalysisResponse {
    const estimatedLocations = Math.floor(Math.random() * 20) + 5; // 5-25 locations
    const averageScore = Math.floor(Math.random() * 40) + 50; // 50-90 score
    
    return {
      mahalle,
      kategori,
      en_iyi_lokasyonlar: this.generateOptimisticLocations(estimatedLocations, averageScore),
      toplam_lokasyon: estimatedLocations,
      ortalama_skor: averageScore,
      analiz_ozeti: `${mahalle} için ${estimatedLocations} lokasyon analiz ediliyor...`,
      optimistic: true,
      loading: false
    } as any;
  }

  private generateOptimisticHeatmapData(kategori: BusinessCategory, bounds: any): any {
    const dataPoints = Math.floor(Math.random() * 50) + 20; // 20-70 points
    const heatmapData = [];
    
    for (let i = 0; i < dataPoints; i++) {
      heatmapData.push([
        bounds.south + Math.random() * (bounds.north - bounds.south),
        bounds.west + Math.random() * (bounds.east - bounds.west),
        Math.random() // intensity
      ]);
    }

    return {
      heatmap_data: heatmapData,
      total_points: dataPoints,
      bounds,
      optimistic: true,
      loading: false
    };
  }

  private estimateBaseScore(lat: number, lon: number, kategori: BusinessCategory): number {
    // Simple heuristic based on location (closer to city center = higher score)
    const cityCenter = { lat: 39.9334, lng: 32.8597 }; // Kızılay
    const distance = Math.sqrt(
      Math.pow(lat - cityCenter.lat, 2) + Math.pow(lon - cityCenter.lng, 2)
    );
    
    const baseScore = Math.max(30, 90 - (distance * 1000)); // Rough calculation
    
    // Category-specific adjustments
    const categoryMultipliers = {
      eczane: 1.1,
      firin: 0.9,
      cafe: 1.0,
      market: 0.95,
      restoran: 1.05
    };
    
    return Math.min(100, Math.max(0, baseScore * categoryMultipliers[kategori]));
  }

  private getScoreCategory(score: number): string {
    if (score >= 90) return 'Mükemmel';
    if (score >= 70) return 'Çok İyi';
    if (score >= 50) return 'İyi';
    if (score >= 30) return 'Orta';
    return 'Uygun Değil';
  }

  private getScoreColor(score: number): string {
    if (score >= 90) return '#28a745';
    if (score >= 70) return '#ffc107';
    if (score >= 50) return '#fd7e14';
    if (score >= 30) return '#dc3545';
    return '#6c757d';
  }

  private getScoreEmoji(score: number): string {
    if (score >= 90) return '🟢';
    if (score >= 70) return '🟡';
    if (score >= 50) return '🟠';
    if (score >= 30) return '🔴';
    return '⚫';
  }

  private generateOptimisticBreakdown(kategori: BusinessCategory, baseScore: number): Record<string, any> {
    const factors = {
      eczane: ['hastane', 'rakip_eczane', 'nufus_yogunlugu', 'yas_profili'],
      firin: ['rakip_firin', 'nufus_yogunlugu', 'gelir_duzeyi', 'metro'],
      cafe: ['rakip_cafe', 'universite', 'metro', 'yas_profili'],
      market: ['rakip_market', 'nufus_yogunlugu', 'gelir_duzeyi', 'avm'],
      restoran: ['rakip_restoran', 'metro', 'avm', 'yas_profili']
    };

    const breakdown: Record<string, any> = {};
    const categoryFactors = factors[kategori] || factors.cafe;
    
    categoryFactors.forEach(factor => {
      const score = baseScore + (Math.random() - 0.5) * 40; // ±20 variation
      breakdown[factor] = {
        score: Math.max(-50, Math.min(100, score)),
        distance: Math.floor(Math.random() * 1000) + 100, // 100-1100m
        count: Math.floor(Math.random() * 10) + 1 // 1-10 count
      };
    });

    return breakdown;
  }

  private generateOptimisticLocations(count: number, averageScore: number): any[] {
    const locations = [];
    
    for (let i = 0; i < Math.min(count, 10); i++) { // Limit to top 10
      const score = averageScore + (Math.random() - 0.5) * 20;
      locations.push({
        lat: 39.9 + Math.random() * 0.1,
        lon: 32.8 + Math.random() * 0.1,
        score: Math.max(0, Math.min(100, score)),
        category: this.getScoreCategory(score),
        emoji: this.getScoreEmoji(score),
        color: this.getScoreColor(score),
        address: `Optimistic Location ${i + 1}`
      });
    }

    return locations.sort((a, b) => b.score - a.score);
  }

  private setUpdateTimeout(update: OptimisticUpdate): void {
    const timer = setTimeout(() => {
      if (this.config.autoRollbackOnError) {
        this.rollbackUpdate(update.id);
      } else {
        this.failUpdate(update.id, new Error('Update timeout'));
      }
    }, this.config.defaultTimeout);

    this.timers.set(update.id, timer);
  }

  private clearUpdateTimeout(updateId: string): void {
    const timer = this.timers.get(updateId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(updateId);
    }
  }

  private moveToHistory(update: OptimisticUpdate): void {
    this.pendingUpdates.delete(update.id);
    this.updateHistory.push(update);
    
    // Keep history size manageable
    if (this.updateHistory.length > 1000) {
      this.updateHistory = this.updateHistory.slice(-1000);
    }
  }

  private cleanupOldestUpdate(): void {
    const oldestUpdate = Array.from(this.pendingUpdates.values())
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];
    
    if (oldestUpdate) {
      this.rollbackUpdate(oldestUpdate.id);
    }
  }

  private parametersMatch(params1: Record<string, unknown>, params2: Record<string, unknown>): boolean {
    const keys1 = Object.keys(params1).sort();
    const keys2 = Object.keys(params2).sort();
    
    if (keys1.length !== keys2.length) return false;
    
    return keys1.every(key => 
      keys2.includes(key) && params1[key] === params2[key]
    );
  }

  private resolveConflicts(optimisticData: any, serverData: any): any {
    // Simple conflict resolution - prefer server data
    // In a real implementation, this would be more sophisticated
    return serverData;
  }

  private handleConflictResolution(update: OptimisticUpdate, resolvedData: any, serverData: any): void {
    // Handle conflict resolution based on strategy
    // For now, just use server data
    this.confirmUpdate(update.id, serverData);
  }

  private generateId(): string {
    return `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}