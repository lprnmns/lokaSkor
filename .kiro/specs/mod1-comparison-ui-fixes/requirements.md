# Requirements Document

## Introduction

Bu spec, `/mod1-comparison` sayfasındaki iki önemli kullanıcı deneyimi sorununu çözmek için oluşturulmuştur. Rekabet analizi bölümünde rakip işletmelerin daha iyi görüntülenmesi ve ana skor dışındaki diğer yüksek skorların görsel temsilinin iyileştirilmesi hedeflenmektedir.

## Requirements

### Requirement 1

**User Story:** As a user analyzing location competition, I want to see the top 5 closest competitors ordered from nearest to farthest, so that I can better understand the competitive landscape around my potential location.

#### Acceptance Criteria

1. WHEN a user expands the competition analysis section THEN the system SHALL display exactly 5 competitors maximum
2. WHEN competitors are displayed THEN the system SHALL order them from nearest to farthest distance
3. WHEN no competitors exist within range THEN the system SHALL display an appropriate message indicating no competitors found
4. WHEN fewer than 5 competitors exist THEN the system SHALL display all available competitors in distance order
5. WHEN competitor data is loaded THEN each competitor SHALL show name, distance, and impact score

### Requirement 2

**User Story:** As a user reviewing location analysis results, I want to see clean star indicators for the highest scoring metrics instead of badge-style indicators, so that the interface looks cleaner and more professional.

#### Acceptance Criteria

1. WHEN a location has the highest score in any metric category THEN the system SHALL display a borderless star (⭐) next to that metric
2. WHEN displaying the star indicator THEN the system SHALL NOT use any background, border, or badge styling
3. WHEN multiple locations are compared THEN only the location with the highest score in each category SHALL receive the star indicator
4. WHEN a location has multiple highest scores THEN each qualifying metric SHALL display its own star indicator
5. WHEN the main total score is displayed THEN it SHALL NOT be affected by this change and keep its current styling