import React from "react";
import CourtDetailScreen from "../user/CourtDetailScreen";
import { useAuth } from "../../context/AuthContext";
import { getAdminCourtDetail, getAdminCourtSlots } from "../../services/adminService";

export default function AdminCourtDetailScreen({ courtId, onBack, forcedFavoriteState, onFavoriteStateChange }) {
  const { token } = useAuth();
  return (
    <CourtDetailScreen
      courtId={courtId}
      onBack={onBack}
      onTabPress={() => {}}
      asSheet
      allowBooking={false}
      showBookingActions={false}
      showHeaderBookingAction={false}
      fetchCourtDetail={(id) => getAdminCourtDetail({ token, courtId: id })}
      fetchCourtSlots={(id, date) => getAdminCourtSlots({ token, courtId: id, date })}
      forcedFavoriteState={forcedFavoriteState}
      onFavoriteStateChange={onFavoriteStateChange}
    />
  );
}
