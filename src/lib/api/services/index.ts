// API Services Exports
export { LocationAnalysisService } from './locationAnalysis';

// Create service instances
import { LocationAnalysisService } from './locationAnalysis';

// Singleton instances for use throughout the application
export const locationAnalysisService = new LocationAnalysisService();

// Service factory for custom configurations
export const createLocationAnalysisService = (config?: any) => {
  return new LocationAnalysisService(config);
};