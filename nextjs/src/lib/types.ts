// ============================================================
// types.ts — Database types mirroring PostgreSQL schema exactly
// All fields nullable to match NUMERIC/TEXT columns
// ============================================================

export type Role = "instructor" | "student"
export type WBStatus = "ok" | "out_of_limits" | "check_range"
export type SubStatus = "draft" | "submitted" | "reviewed"

export interface Profile {
  id:          string
  email:       string
  full_name:   string
  role:        Role
  school_name: string | null
  license_num: string | null
  created_at:  string
  updated_at:  string
}

export interface Submission {
  id:              string
  user_id:         string
  created_at:      string

  // Flight info
  flight_type:     string | null
  flight_date:     string
  aircraft_reg:    string | null
  status:          SubStatus

  // W&B Inputs
  empty_mass_kg:   number | null
  empty_arm_m:     number | null
  front_seats_kg:  number | null
  rear_seats_kg:   number | null
  baggage_kg:      number | null
  fuel_mass_kg:    number | null

  // W&B Results
  total_mass_r5:   number | null
  total_mom_r5:    number | null
  cg_r5:           number | null
  total_mass_r7:   number | null
  total_mom_r7:    number | null
  cg_r7:           number | null
  wb_status:       WBStatus | null

  // Performance Inputs
  pressure_alt_ft: number | null
  oat_c:           number | null
  wind_kts:        number | null
  runway_surface:  string | null

  // Performance Results
  to_roll_m:       number | null
  to_50ft_m:       number | null
  ldg_roll_m:      number | null
  ldg_50ft_m:      number | null
  roc_fpm:         number | null
  density_alt_ft:  number | null

  // Fuel
  power_pct:       number | null
  fuel_flow_lhr:   number | null
  flight_time_hr:  number | null
  trip_fuel_l:     number | null
  trip_fuel_kg:    number | null

  // Instructor Review
  instructor_notes: string | null
  reviewed_by:      string | null
  reviewed_at:      string | null
}

// Submission enriched with student profile (client-side join)
export interface SubWithStudent extends Submission {
  student?: Pick<Profile, "full_name" | "email" | "license_num">
}
