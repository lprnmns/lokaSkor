import LocationDashboard from "@/components/LocationDashboard";
import { useTranslation } from "@/contexts/TranslationContext";

const Index = () => {
  const { t } = useTranslation();
  return <LocationDashboard t={t} />;
};

export default Index;
