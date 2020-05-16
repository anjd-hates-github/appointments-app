export interface BookAppointmentModel {
  user_name: string;
  starts_at: Date;
  duration: number;
  expert_id: number;
  timezone?: string;
}
