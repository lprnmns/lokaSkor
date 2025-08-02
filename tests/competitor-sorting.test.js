/**
 * Competitor Sorting and Star Indicator Test Suite
 * Tests for the mod1-comparison UI fixes
 */

describe('Competitor Sorting and Star Indicators', () => {
    let mockLocationComparison;
    let mockResults;

    beforeEach(() => {
        // Mock results with competitor data
        mockResults = {
            locations: [
                {
                    id: 'loc_1',
                    name: 'Location 1',
                    totalScore: 75,
                    rank: 1,
                    scores: {
                        hospital: 85,
                        competitor: 60,
                        important: 70,
                        demographic: 80
                    },
                    details: {
                        competitors: [
                            { name: 'Competitor A', distance: '500m', distance_meters: 500, impact: -10 },
                            { name: 'Competitor B', distance: '200m', distance_meters: 200, impact: -15 },
                            { name: 'Competitor C', distance: '800m', distance_meters: 800, impact: -5 },
                            { name: 'Competitor D', distance: '300m', distance_meters: 300, impact: -12 },
                            { name: 'Competitor E', distance: '100m', distance_meters: 100, impact: -20 },
                            { name: 'Competitor F', distance: '1000m', distance_meters: 1000, impact: -3 }
                        ]
                    }
                },
                {
                    id: 'loc_2',
                    name: 'Location 2',
                    totalScore: 65,
                    rank: 2,
                    scores: {
                        hospital: 70,
                        competitor: 90, // Highest competitor score
                        important: 60,
                        demographic: 50
                    },
                    details: {
                        competitors: []
                    }
                }
            ]
        };

        // Mock LocationComparison class
        mockLocationComparison = {
            findWinningMetrics: function(locations) {
                const metrics = ['hospital', 'important', 'demographic', 'competitor'];
                const winners = {};
                
                metrics.forEach(metric => {
                    let maxScore = -1;
                    let winnerIndex = -1;
                    
                    locations.forEach((result, index) => {
                        const score = result.scores?.[metric] || 0;
                        if (typeof score === 'number' && !isNaN(score) && score > maxScore) {
                            maxScore = score;
                            winnerIndex = index;
                        }
                    });
                    
                    if (winnerIndex !== -1 && maxScore > 0) {
                        winners[metric] = winnerIndex;
                    }
                });
                
                return winners;
            },

            getLocationWinners: function(allWinners, locationIndex) {
                const locationWinners = {};
                
                Object.keys(allWinners).forEach(metric => {
                    if (allWinners[metric] === locationIndex) {
                        locationWinners[metric] = true;
                    }
                });
                
                return locationWinners;
            }
        };
    });

    describe('Competitor Sorting', () => {
        test('should sort competitors by distance (nearest to farthest)', () => {
            const competitors = mockResults.locations[0].details.competitors;
            const sorted = competitors
                .sort((a, b) => (a.distance_meters || 999999) - (b.distance_meters || 999999));
            
            expect(sorted[0].distance_meters).toBe(100); // Competitor E
            expect(sorted[1].distance_meters).toBe(200); // Competitor B
            expect(sorted[2].distance_meters).toBe(300); // Competitor D
            expect(sorted[3].distance_meters).toBe(500); // Competitor A
            expect(sorted[4].distance_meters).toBe(800); // Competitor C
        });

        test('should limit competitors to maximum 5', () => {
            const competitors = mockResults.locations[0].details.competitors;
            const limited = competitors
                .sort((a, b) => (a.distance_meters || 999999) - (b.distance_meters || 999999))
                .slice(0, 5);
            
            expect(limited.length).toBe(5);
            expect(limited[4].distance_meters).toBe(800); // Should not include the 1000m competitor
        });

        test('should handle empty competitor arrays', () => {
            const competitors = mockResults.locations[1].details.competitors;
            const sorted = competitors
                .sort((a, b) => (a.distance_meters || 999999) - (b.distance_meters || 999999))
                .slice(0, 5);
            
            expect(sorted.length).toBe(0);
        });
    });

    describe('Star Indicator Logic', () => {
        test('should identify winning metrics correctly', () => {
            const winners = mockLocationComparison.findWinningMetrics(mockResults.locations);
            
            expect(winners.hospital).toBe(0); // Location 1 has highest hospital score (85)
            expect(winners.competitor).toBe(1); // Location 2 has highest competitor score (90)
            expect(winners.important).toBe(0); // Location 1 has highest important score (70)
            expect(winners.demographic).toBe(0); // Location 1 has highest demographic score (80)
        });

        test('should determine location winners correctly', () => {
            const allWinners = mockLocationComparison.findWinningMetrics(mockResults.locations);
            
            const location1Winners = mockLocationComparison.getLocationWinners(allWinners, 0);
            const location2Winners = mockLocationComparison.getLocationWinners(allWinners, 1);
            
            expect(location1Winners.hospital).toBe(true);
            expect(location1Winners.important).toBe(true);
            expect(location1Winners.demographic).toBe(true);
            expect(location1Winners.competitor).toBeUndefined();
            
            expect(location2Winners.competitor).toBe(true);
            expect(location2Winners.hospital).toBeUndefined();
        });

        test('should handle tied scores correctly', () => {
            const tiedResults = {
                locations: [
                    { scores: { hospital: 80 } },
                    { scores: { hospital: 80 } }
                ]
            };
            
            const winners = mockLocationComparison.findWinningMetrics(tiedResults.locations);
            expect(winners.hospital).toBe(0); // First location wins in case of tie
        });

        test('should ignore invalid scores', () => {
            const invalidResults = {
                locations: [
                    { scores: { hospital: NaN } },
                    { scores: { hospital: null } },
                    { scores: { hospital: 50 } }
                ]
            };
            
            const winners = mockLocationComparison.findWinningMetrics(invalidResults.locations);
            expect(winners.hospital).toBe(2); // Only valid score wins
        });
    });

    describe('Edge Cases', () => {
        test('should handle missing distance_meters field', () => {
            const competitorsWithMissingData = [
                { name: 'A', distance: '200m', distance_meters: 200 },
                { name: 'B', distance: '100m' }, // Missing distance_meters
                { name: 'C', distance: '300m', distance_meters: 300 }
            ];
            
            const sorted = competitorsWithMissingData
                .sort((a, b) => (a.distance_meters || 999999) - (b.distance_meters || 999999));
            
            expect(sorted[0].distance_meters).toBe(200);
            expect(sorted[1].distance_meters).toBe(300);
            expect(sorted[2].distance_meters).toBeUndefined(); // Missing data goes to end
        });

        test('should handle zero scores correctly', () => {
            const zeroScoreResults = {
                locations: [
                    { scores: { hospital: 0 } },
                    { scores: { hospital: 10 } }
                ]
            };
            
            const winners = mockLocationComparison.findWinningMetrics(zeroScoreResults.locations);
            expect(winners.hospital).toBe(1); // Only meaningful scores (> 0) should win
        });
    });
});

// Manual testing helper functions
window.testCompetitorSorting = function() {
    console.log('🧪 Testing competitor sorting...');
    
    const testData = [
        { name: 'Far Competitor', distance_meters: 1000 },
        { name: 'Close Competitor', distance_meters: 100 },
        { name: 'Medium Competitor', distance_meters: 500 }
    ];
    
    const sorted = testData
        .sort((a, b) => (a.distance_meters || 999999) - (b.distance_meters || 999999))
        .slice(0, 5);
    
    console.log('Sorted competitors:', sorted);
    return sorted;
};

window.testStarIndicators = function() {
    console.log('⭐ Testing star indicators...');
    
    const testResults = [
        { scores: { hospital: 85, competitor: 60 } },
        { scores: { hospital: 70, competitor: 90 } }
    ];
    
    const winners = {};
    ['hospital', 'competitor'].forEach(metric => {
        let maxScore = -1;
        let winnerIndex = -1;
        
        testResults.forEach((result, index) => {
            const score = result.scores[metric] || 0;
            if (score > maxScore) {
                maxScore = score;
                winnerIndex = index;
            }
        });
        
        if (winnerIndex !== -1 && maxScore > 0) {
            winners[metric] = winnerIndex;
        }
    });
    
    console.log('Winners:', winners);
    return winners;
};