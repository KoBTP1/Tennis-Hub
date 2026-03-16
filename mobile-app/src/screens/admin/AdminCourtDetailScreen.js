import React from "react";
import CourtDetailScreen from "../user/CourtDetailScreen";

export default function AdminCourtDetailScreen({ courtId, onBack }) {
  return <CourtDetailScreen courtId={courtId} onBack={onBack} onTabPress={() => {}} asSheet allowBooking={false} />;
}
