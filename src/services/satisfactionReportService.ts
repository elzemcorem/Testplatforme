import { supabase } from "../utils/supabase/client";

export interface SatisfactionData {
  dcm: { requests: number; satisfied: number; unsatisfied: number };
  dtm: { requests: number; satisfied: number; unsatisfied: number };
  daf: { requests: number; satisfied: number; unsatisfied: number };
  qhse: { requests: number; satisfied: number; unsatisfied: number };
  do: { requests: number; satisfied: number; unsatisfied: number };
  notes?: string;
}

export interface SatisfactionReport extends SatisfactionData {
  id: string;
  exitReportId: string;
  vehicleId: string;
  userId: string;
  createdAt: Date;
}

export const satisfactionReportService = {
  /**
   * Créer un rapport de satisfaction
   */
  async createSatisfactionReport(
    exitReportId: string,
    vehicleId: string,
    userId: string,
    data: SatisfactionData,
    createdBy: string
  ): Promise<boolean> {
    try {
      console.log("📊 Création du rapport de satisfaction...");

      const { error } = await supabase
        .from("satisfaction_reports")
        .insert([
          {
            exit_report_id: exitReportId,
            vehicle_id: vehicleId,
            user_id: userId,
            dcm_requests: data.dcm.requests,
            dcm_satisfied: data.dcm.satisfied,
            dcm_unsatisfied: data.dcm.unsatisfied,
            dtm_requests: data.dtm.requests,
            dtm_satisfied: data.dtm.satisfied,
            dtm_unsatisfied: data.dtm.unsatisfied,
            daf_requests: data.daf.requests,
            daf_satisfied: data.daf.satisfied,
            daf_unsatisfied: data.daf.unsatisfied,
            qhse_requests: data.qhse.requests,
            qhse_satisfied: data.qhse.satisfied,
            qhse_unsatisfied: data.qhse.unsatisfied,
            do_requests: data.do.requests,
            do_satisfied: data.do.satisfied,
            do_unsatisfied: data.do.unsatisfied,
            notes: data.notes || null,
            created_by: createdBy,
          },
        ]);

      if (error) {
        console.error("❌ Erreur création rapport satisfaction:", error);
        return false;
      }

      console.log("✅ Rapport de satisfaction créé");
      return true;
    } catch (error) {
      console.error("❌ Exception:", error);
      return false;
    }
  },

  /**
   * Charger un rapport de satisfaction
   */
  async loadSatisfactionReport(exitReportId: string): Promise<SatisfactionReport | null> {
    try {
      const { data, error } = await supabase
        .from("satisfaction_reports")
        .select("*")
        .eq("exit_report_id", exitReportId)
        .single();

      if (error || !data) {
        console.log("ℹ️ Pas de rapport de satisfaction trouvé");
        return null;
      }

      return {
        id: data.id,
        exitReportId: data.exit_report_id,
        vehicleId: data.vehicle_id,
        userId: data.user_id,
        dcm: {
          requests: data.dcm_requests,
          satisfied: data.dcm_satisfied,
          unsatisfied: data.dcm_unsatisfied,
        },
        dtm: {
          requests: data.dtm_requests,
          satisfied: data.dtm_satisfied,
          unsatisfied: data.dtm_unsatisfied,
        },
        daf: {
          requests: data.daf_requests,
          satisfied: data.daf_satisfied,
          unsatisfied: data.daf_unsatisfied,
        },
        qhse: {
          requests: data.qhse_requests,
          satisfied: data.qhse_satisfied,
          unsatisfied: data.qhse_unsatisfied,
        },
        do: {
          requests: data.do_requests,
          satisfied: data.do_satisfied,
          unsatisfied: data.do_unsatisfied,
        },
        notes: data.notes,
        createdAt: new Date(data.created_at),
      };
    } catch (error) {
      console.error("❌ Exception chargement:", error);
      return null;
    }
  },

  /**
   * Mettre à jour un rapport de satisfaction
   */
  async updateSatisfactionReport(
    id: string,
    data: SatisfactionData
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("satisfaction_reports")
        .update({
          dcm_requests: data.dcm.requests,
          dcm_satisfied: data.dcm.satisfied,
          dcm_unsatisfied: data.dcm.unsatisfied,
          dtm_requests: data.dtm.requests,
          dtm_satisfied: data.dtm.satisfied,
          dtm_unsatisfied: data.dtm.unsatisfied,
          daf_requests: data.daf.requests,
          daf_satisfied: data.daf.satisfied,
          daf_unsatisfied: data.daf.unsatisfied,
          qhse_requests: data.qhse.requests,
          qhse_satisfied: data.qhse.satisfied,
          qhse_unsatisfied: data.qhse.unsatisfied,
          do_requests: data.do.requests,
          do_satisfied: data.do.satisfied,
          do_unsatisfied: data.do.unsatisfied,
          notes: data.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.error("❌ Erreur mise à jour:", error);
        return false;
      }

      console.log("✅ Rapport mis à jour");
      return true;
    } catch (error) {
      console.error("❌ Exception:", error);
      return false;
    }
  },

  /**
   * Calculer les taux de satisfaction
   */
  calculateRates(service: { requests: number; satisfied: number; unsatisfied: number }) {
    if (service.requests === 0) return { satisfaction: 0, dissatisfaction: 0 };
    return {
      satisfaction: Math.round((service.satisfied / service.requests) * 100),
      dissatisfaction: Math.round((service.unsatisfied / service.requests) * 100),
    };
  },

  /**
   * Calculer les totaux
   */
  calculateTotals(data: SatisfactionData) {
    const totalRequests =
      data.dcm.requests +
      data.dtm.requests +
      data.daf.requests +
      data.qhse.requests +
      data.do.requests;

    const totalSatisfied =
      data.dcm.satisfied +
      data.dtm.satisfied +
      data.daf.satisfied +
      data.qhse.satisfied +
      data.do.satisfied;

    const totalUnsatisfied =
      data.dcm.unsatisfied +
      data.dtm.unsatisfied +
      data.daf.unsatisfied +
      data.qhse.unsatisfied +
      data.do.unsatisfied;

    return {
      requests: totalRequests,
      satisfied: totalSatisfied,
      unsatisfied: totalUnsatisfied,
    };
  },
};
