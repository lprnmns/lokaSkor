import { Target, MapPin, Users, Layers, Settings, Download, Plus, Minus, ChevronDown, Coffee, UtensilsCrossed, ShoppingBag, Cross } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const LocationDashboard = () => {
  const [analysisMode, setAnalysisMode] = useState("heatmap");
  const [selectedCategory, setSelectedCategory] = useState("cafe");
  const [trafficData, setTrafficData] = useState(true);
  const [competitorAnalysis, setCompetitorAnalysis] = useState(false);
  const [demographics, setDemographics] = useState(true);

  // Business category icons and colors
  const categoryIcons = {
    cafe: { icon: Coffee, color: "bg-amber-600", emoji: "☕" },
    restaurant: { icon: UtensilsCrossed, color: "bg-orange-600", emoji: "🍽️" },
    retail: { icon: ShoppingBag, color: "bg-purple-600", emoji: "🛍️" },
    pharmacy: { icon: Cross, color: "bg-green-600", emoji: "⚕️" }
  };

  const getCurrentCategoryData = () => categoryIcons[selectedCategory as keyof typeof categoryIcons];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Sidebar - 30% */}
      <div className="w-[30%] bg-gradient-primary p-6 flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">LocationIQ Pro</h1>
            </div>
          </div>
          <p className="text-white/80 text-sm">Advanced Site Selection & Market Analysis</p>
        </div>

        {/* Analysis Mode Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-5 shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Analysis Mode</h3>
          <div className="space-y-3">
            <div
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                analysisMode === "point" 
                  ? "bg-primary/10 border border-primary text-primary" 
                  : "hover:bg-gray-50"
              }`}
              onClick={() => setAnalysisMode("point")}
            >
              <MapPin className="w-5 h-5" />
              <div>
                <div className="font-medium">Point Analysis</div>
                <div className="text-sm text-gray-500">Analyze specific locations</div>
              </div>
            </div>
            <div
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                analysisMode === "area" 
                  ? "bg-primary/10 border border-primary text-primary" 
                  : "hover:bg-gray-50"
              }`}
              onClick={() => setAnalysisMode("area")}
            >
              <Users className="w-5 h-5" />
              <div>
                <div className="font-medium">Area Analysis</div>
                <div className="text-sm text-gray-500">Compare neighborhoods</div>
              </div>
            </div>
            <div
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                analysisMode === "heatmap" 
                  ? "bg-primary/10 border border-primary text-primary" 
                  : "hover:bg-gray-50"
              }`}
              onClick={() => setAnalysisMode("heatmap")}
            >
              <Layers className="w-5 h-5" />
              <div>
                <div className="font-medium">Heatmap View</div>
                <div className="text-sm text-gray-500">Visualize data density</div>
              </div>
            </div>
          </div>
        </div>

        {/* Business Category Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-5 shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Business Category</h3>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 ${getCurrentCategoryData().color} rounded-full`}></div>
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cafe">
                <div className="flex items-center gap-2">
                  <Coffee className="w-4 h-4" />
                  <span>Cafe</span>
                </div>
              </SelectItem>
              <SelectItem value="restaurant">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>Restaurant</span>
                </div>
              </SelectItem>
              <SelectItem value="retail">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Retail</span>
                </div>
              </SelectItem>
              <SelectItem value="pharmacy">
                <div className="flex items-center gap-2">
                  <Cross className="w-4 h-4" />
                  <span>Eczane</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Location Controls Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-5 shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Location Controls</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Area</label>
              <Select defaultValue="downtown">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="downtown">Downtown Core</SelectItem>
                  <SelectItem value="suburbs">Suburbs</SelectItem>
                  <SelectItem value="waterfront">Waterfront</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Traffic Data</span>
                <Switch checked={trafficData} onCheckedChange={setTrafficData} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Competitor Analysis</span>
                <Switch checked={competitorAnalysis} onCheckedChange={setCompetitorAnalysis} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Demographics</span>
                <Switch checked={demographics} onCheckedChange={setDemographics} />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button className="w-full bg-gradient-secondary hover:bg-gradient-primary text-white">
                Run Analysis
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                Advanced Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Site Score Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Site Score</h3>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              {getCurrentCategoryData().emoji} {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
            </Badge>
          </div>
          
          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-gray-900 mb-1">87</div>
            <div className="text-sm text-gray-500">out of 100</div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Foot Traffic:</span>
              <span className="text-sm font-medium text-success">High</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Competition:</span>
              <span className="text-sm font-medium text-warning">Medium</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Demographics:</span>
              <span className="text-sm font-medium text-success">Excellent</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Accessibility:</span>
              <span className="text-sm font-medium text-success">Very Good</span>
            </div>
          </div>

          <Button variant="outline" size="sm" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Right Map Area - 70% */}
      <div className="w-[70%] flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Interactive Map View</h2>
            <Badge variant="secondary" className="bg-primary/10 text-primary">Heatmap View</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Layers className="w-4 h-4 mr-2" />
              Layers
            </Button>
            <Button variant="outline" size="sm">
              Zoom to Fit
            </Button>
          </div>
        </div>

        {/* Map Content */}
        <div className="flex-1 bg-gray-50 relative">
          {/* Map Placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Interactive Map</h3>
              <p className="text-gray-600 mb-4">
                Your location analysis will be displayed here with markers, heatmaps, and demographic overlays.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span>Analyzing Downtown Core</span>
              </div>
            </div>
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button size="icon" variant="outline" className="w-8 h-8 bg-white">
              <Plus className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="outline" className="w-8 h-8 bg-white">
              <Minus className="w-4 h-4" />
            </Button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-lg">
            <h4 className="font-medium text-sm mb-2">Legend</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>High Score (80-100)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Medium Score (60-79)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Low Score (0-59)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationDashboard;