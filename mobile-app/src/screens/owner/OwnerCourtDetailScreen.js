import React from "react";
import CourtDetailScreen from "../user/CourtDetailScreen";
import { getOwnerCourtDetail, getOwnerSlots } from "../../services/ownerService";

export default function OwnerCourtDetailScreen({ courtId, onBack, forcedFavoriteState, onFavoriteStateChange }) {
  return (
    <CourtDetailScreen
      courtId={courtId}
      onBack={onBack}
      onTabPress={() => {}}
      asSheet
      allowBooking={false}
      showBookingActions={false}
      showHeaderBookingAction={false}
      fetchCourtDetail={getOwnerCourtDetail}
      fetchCourtSlots={getOwnerSlots}
      forcedFavoriteState={forcedFavoriteState}
      onFavoriteStateChange={onFavoriteStateChange}
    />
  );
}
