import { supabase } from "../utils/supabase/client";

export interface ExitReportData {
  vehicleId: string;
  vehicleName: string;
  reservationId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  departureDate: Date;
  expectedReturnDate: Date;
  odometerStart?: number;
  fuelLevelStart?: string;
  fuelLevelStartPercent?: number;
  vehicleCondition?: string;
  vehicleConditionNotes?: string;
  itemsChecklist?: Array<{
    name: string;
    status: "ok" | "defect" | "damaged";
  }>;
  fuelProvidedLiters?: number;
  fuelType?: string;
  inspectorName?: string;
  globalNotes?: string;
}

export const exitReportService = {
  /**
   * Créer un rapport de sortie
   */
  async createExitReport(
    reportData: ExitReportData,
    createdBy: string
  ): Promise<boolean> {
    try {
      console.log("📤 Création d'un rapport de sortie...");

      const { error } = await supabase
        .from("exit_reports")
        .insert([
          {
            vehicle_id: reportData.vehicleId,
            vehicle_name: reportData.vehicleName,
            reservation_id: reportData.reservationId || null,
            user_id: reportData.userId,
            user_name: reportData.userName,
            user_email: reportData.userEmail,
            departure_date: reportData.departureDate.toISOString(),
            expected_return_date: reportData.expectedReturnDate.toISOString(),
            odometer_reading_start: reportData.odometerStart || null,
            fuel_level_start: reportData.fuelLevelStart || null,
            fuel_level_start_percent: reportData.fuelLevelStartPercent || null,
            vehicle_condition: reportData.vehicleCondition || null,
            vehicle_condition_notes: reportData.vehicleConditionNotes || null,
            items_checklist: reportData.itemsChecklist || [],
            fuel_provided_liters: reportData.fuelProvidedLiters || 0,
            fuel_type: reportData.fuelType || "diesel",
            inspector_name: reportData.inspectorName || null,
            global_notes: reportData.globalNotes || null,
            created_by: createdBy,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

      if (error) {
        console.error("❌ Erreur création rapport de sortie:", error);
        return false;
      }

      console.log("✅ Rapport de sortie créé avec succès");
      return true;
    } catch (error) {
      console.error("❌ Exception lors de la création:", error);
      return false;
    }
  },

  /**
   * Charger tous les rapports de sortie
   */
  async loadExitReports(): Promise<ExitReportData[]> {
    try {
      console.log("📥 Chargement des rapports de sortie...");

      const { data, error } = await supabase
        .from("exit_reports")
        .select("*")
        .order("departure_date", { ascending: false });

      if (error) {
        console.error("❌ Erreur chargement rapports:", error);
        return [];
      }

      const mapped = (data || []).map((report: any) => ({
        vehicleId: report.vehicle_id,
        vehicleName: report.vehicle_name,
        reservationId: report.reservation_id,
        userId: report.user_id,
        userName: report.user_name,
        userEmail: report.user_email,
        departureDate: new Date(report.departure_date),
        expectedReturnDate: new Date(report.expected_return_date),
        odometerStart: report.odometer_reading_start,
        fuelLevelStart: report.fuel_level_start,
        fuelLevelStartPercent: report.fuel_level_start_percent,
        vehicleCondition: report.vehicle_condition,
        vehicleConditionNotes: report.vehicle_condition_notes,
        itemsChecklist: report.items_checklist || [],
        fuelProvidedLiters: report.fuel_provided_liters,
        fuelType: report.fuel_type,
        inspectorName: report.inspector_name,
        globalNotes: report.global_notes,
      }));

      console.log(`✅ ${mapped.length} rapports chargés`);
      return mapped;
    } catch (error) {
      console.error("❌ Exception:", error);
      return [];
    }
  },

  /**
   * Charger les rapports par véhicule
   */
  async loadVehicleExitReports(vehicleId: string): Promise<ExitReportData[]> {
    try {
      const { data, error } = await supabase
        .from("exit_reports")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .order("departure_date", { ascending: false });

      if (error) {
        console.error("❌ Erreur chargement rapports véhicule:", error);
        return [];
      }

      const mapped = (data || []).map((report: any) => ({
        vehicleId: report.vehicle_id,
        vehicleName: report.vehicle_name,
        reservationId: report.reservation_id,
        userId: report.user_id,
        userName: report.user_name,
        userEmail: report.user_email,
        departureDate: new Date(report.departure_date),
        expectedReturnDate: new Date(report.expected_return_date),
        odometerStart: report.odometer_reading_start,
        fuelLevelStart: report.fuel_level_start,
        fuelLevelStartPercent: report.fuel_level_start_percent,
        vehicleCondition: report.vehicle_condition,
        vehicleConditionNotes: report.vehicle_condition_notes,
        itemsChecklist: report.items_checklist || [],
        fuelProvidedLiters: report.fuel_provided_liters,
        fuelType: report.fuel_type,
        inspectorName: report.inspector_name,
        globalNotes: report.global_notes,
      }));

      return mapped;
    } catch (error) {
      console.error("❌ Exception:", error);
      return [];
    }
  },
};
