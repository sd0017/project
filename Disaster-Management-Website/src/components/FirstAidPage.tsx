import React from "react";
import {
  ArrowLeft,
  Heart,
  AlertTriangle,
  Thermometer,
  Scissors,
  Shield,
  ExternalLink,
} from "lucide-react";
// Updated with comprehensive first aid information
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { useLanguage } from "./LanguageContext";

interface FirstAidPageProps {
  onBack: () => void;
}

// First Aid content that will be translated
const getFirstAidData = (
  translate: (key: string) => string,
) => [
  {
    id: "1",
    title: translate("burnTreatment") || "Burn Treatment",
    severity: "critical",
    icon: Thermometer,
    videoUrl: "https://www.youtube.com/watch?v=i2aT5fhpvgA",
    steps: [
      translate("burnStep1") &&
        "Ensure safety & stop the burning source – Move victim away from fire, chemicals, or electricity.",
      translate("burnStep2") &&
        "Call for help – Alert emergency teams immediately.",
      translate("burnStep3") &&
        "Cool briefly – Use clean, cool water for max 10 minutes (no ice).",
      translate("burnStep4") &&
        "Remove restrictions – Take off jewelry/clothes around (not stuck to) the burn.",
      translate("burnStep5") &&
        "Cover & protect – Loosely cover with a clean cloth or sheet; no creams or butter.",
      translate("burnStep6") &&
        "Prevent shock & monitor – Lay victim flat, elevate legs, keep warm, check breathing, reassure until help arrives.",
    ],
  },
  {
    id: "2",
    title: translate("basicWoundCare") || "Basic Wound Care",
    severity: "high",
    icon: Scissors,
    videoUrl: "https://www.youtube.com/watch?v=0TZspUGZskY",
    steps: [
      translate("woundStep1") &&
        "Ensure safety & protect yourself – Move to a safe area, wear gloves if possible.",
      translate("woundStep2") &&
        "Control bleeding – Apply firm, direct pressure with a clean cloth/bandage; elevate if possible.",
      translate("woundStep3") &&
        "Clean the wound – Rinse gently with the cleanest water available; remove dirt/debris if safe.",
      translate("woundStep4") &&
        "Cover & protect – Apply a sterile or clean dressing/cloth; secure it loosely.",
      translate("woundStep5") &&
        "Prevent shock – Lay the person down, elevate legs, keep them warm and calm.",
      translate("woundStep6") &&
        "Monitor & seek help – Watch for infection (redness, swelling, pus), keep checking breathing and consciousness, and get medical care ASAP.",
    ],
  },
  {
    id: "3",
    title: translate("bleedingControl") || "Bleeding Control",
    severity: "critical",
    icon: Heart,
    videoUrl: "https://www.youtube.com/watch?v=LkmJZ-JBWi4",
    steps: [
      translate("bleedingStep1") &&
        "Make sure the area is safe and protect yourself",
      translate("bleedingStep2") &&
        "Expose the wound by removing clothing if needed",
      translate("bleedingStep3") &&
        "Press directly on the wound with cloth or hand",
      translate("bleedingStep4") &&
        "Raise the injured part above heart level if possible",
      translate("bleedingStep5") &&
        "Wrap with a firm bandage, don't remove soaked cloths",
      translate("bleedingStep6") &&
        "Call for medical help, use tourniquet only if bleeding won't stop",
    ],
  },
  {
    id: "4",
    title: translate("chokingRelief") || "Choking Relief",
    severity: "critical",
    icon: AlertTriangle,
    videoUrl: "https://www.youtube.com/watch?v=Zk-npz72GWI",
    steps: [
      translate("chokingStep1") &&
        "Check if the person can cough or speak",
      translate("chokingStep2") ||
        "Ask them to cough forcefully if they can",
      translate("chokingStep3") &&
        "If they can't breathe, give 5 back blows between the shoulder blades",
      translate("chokingStep4") &&
        "Give 5 abdominal thrusts (Heimlich) if back blows don't work",
      translate("chokingStep5") &&
        "Repeat back blows and thrusts until object comes out or they go unresponsive",
      translate("chokingStep6") &&
        "If unresponsive, start CPR and call emergency help",
    ],
  },
  {
    id: "5",
    title:
      translate("unconsciousFainting") ||
      "Unconscious/Fainting",
    severity: "high",
    icon: Heart,
    videoUrl: "https://www.youtube.com/watch?v=-KidD6_Fmio",
    steps: [
      translate("unconsciousStep1") &&
        "Lay the person flat on their back",
      translate("unconsciousStep2") &&
        "Loosen tight clothing around neck and waist",
      translate("unconsciousStep3") &&
        "Raise legs about 12 inches if no injury",
      translate("unconsciousStep4") &&
        "Check breathing and pulse",
      translate("unconsciousStep5") &&
        "Keep airway clear, turn to side if vomiting",
      translate("unconsciousStep6") &&
        "Call for medical help if they don't wake up quickly",
    ],
  },
  {
    id: "6",
    title:
      translate("fractureManagement") || "Fracture Management",
    severity: "high",
    icon: Shield,
    videoUrl: "https://www.youtube.com/watch?v=N3Mjjx6eDGk",
    steps: [
      translate("fractureStep1") &&
        "Keep the injured person still and calm",
      translate("fractureStep2") &&
        "Support the injured area without moving it",
      translate("fractureStep3") &&
        "Apply a splint or padding to immobilize the limb",
      translate("fractureStep4") &&
        "Use cloth or bandage to secure splint in place",
      translate("fractureStep5") &&
        "Apply ice packs wrapped in cloth to reduce swelling",
      translate("fractureStep6") &&
        "Get medical help immediately, don't try to straighten the bone",
    ],
  },
];

export const FirstAidPage: React.FC<FirstAidPageProps> = ({
  onBack,
}) => {
  const { translate } = useLanguage();

  const firstAidData = getFirstAidData(translate);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSeverityLabel = (severity: string) => {
    return (
      translate(
        `severity${severity.charAt(0).toUpperCase() + severity.slice(1)}`,
      ) || severity.toUpperCase()
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-600 text-white p-4 shadow-lg">
        <div className="flex items-center gap-4 max-w-7xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-white hover:bg-red-700"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="flex items-center gap-2">
            <Heart className="h-6 w-6" />
            {translate("firstAidGuide")}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <p className="text-gray-600">
            {translate("firstAidDescription") ||
              "Essential emergency first aid procedures for disaster situations. Follow these step-by-step guides to provide immediate assistance until professional help arrives."}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {firstAidData.map((item) => {
            const IconComponent = item.icon;
            return (
              <Card
                key={item.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5 text-red-600" />
                      {item.title}
                    </span>
                    <Badge
                      variant="outline"
                      className={getSeverityColor(
                        item.severity,
                      )}
                    >
                      {getSeverityLabel(item.severity)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {item.videoUrl && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <a
                        href={item.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <ExternalLink className="h-4 w-4" />
                        {translate("watchTutorialVideo")}
                      </a>
                    </div>
                  )}
                  <ol className="space-y-2">
                    {item.steps.map((step, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-800 rounded-full flex items-center justify-center text-sm">
                          {index + 1}
                        </span>
                        <span className="text-sm leading-relaxed">
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Emergency Numbers */}
        <Card className="mt-6 bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800">
              {translate("emergencyContactNumbers")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-red-800">
                  {translate("police")}
                </div>
                <div>100</div>
              </div>
              <div>
                <div className="font-medium text-red-800">
                  {translate("fireService")}
                </div>
                <div>101</div>
              </div>
              <div>
                <div className="font-medium text-red-800">
                  {translate("ambulance")}
                </div>
                <div>108</div>
              </div>
              <div>
                <div className="font-medium text-red-800">
                  {translate("disasterHelpline")}
                </div>
                <div>1078</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
          <p className="text-sm text-yellow-800">
            <strong>{translate("importantNote")}</strong>{" "}
            {translate("firstAidDisclaimer")}
          </p>
        </div>
      </div>
    </div>
  );
};