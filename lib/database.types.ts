export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          table_name: string;
          record_id: string | null;
          old_data: Json | null;
          new_data: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          table_name: string;
          record_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          table_name?: string;
          record_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      branches: {
        Row: {
          id: string;
          name: string;
          location: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          location: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          location?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          address: string | null;
          govt_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          address?: string | null;
          govt_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          address?: string | null;
          govt_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      equipment: {
        Row: {
          id: string;
          name: string;
          serial_number: string;
          category_id: string | null;
          branch_id: string | null;
          status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'LOST';
          rental_price: number;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          serial_number: string;
          category_id?: string | null;
          branch_id?: string | null;
          status?: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'LOST';
          rental_price: number;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          serial_number?: string;
          category_id?: string | null;
          branch_id?: string | null;
          status?: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'LOST';
          rental_price?: number;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          fullName: string | null;
          role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'EMPLOYEE';
          branch_id: string | null;
          branchId: string | null;
          managerId: string | null;
          hourlyRate: number;
          currency: string;
          created_at: string;
          updated_at: string;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          fullName?: string | null;
          role?: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'EMPLOYEE';
          branch_id?: string | null;
          branchId?: string | null;
          managerId?: string | null;
          hourlyRate?: number;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          fullName?: string | null;
          role?: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'EMPLOYEE';
          branch_id?: string | null;
          branchId?: string | null;
          managerId?: string | null;
          hourlyRate?: number;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      attendance_logs: {
        Row: {
          id: string;
          userId: string;
          clockIn: string;
          clockOut: string | null;
          totalHours: number | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          userId: string;
          clockIn: string;
          clockOut?: string | null;
          totalHours?: number | null;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          userId?: string;
          clockIn?: string;
          clockOut?: string | null;
          totalHours?: number | null;
          createdAt?: string;
          updatedAt?: string;
        };
      };
      rental_items: {
        Row: {
          id: string;
          rental_id: string;
          equipment_id: string;
          price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          rental_id: string;
          equipment_id: string;
          price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          rental_id?: string;
          equipment_id?: string;
          price?: number;
          created_at?: string;
        };
      };
      rentals: {
        Row: {
          id: string;
          client_id: string;
          staff_id: string | null;
          start_date: string;
          end_date: string;
          actual_return_date: string | null;
          status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
          total_amount: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          staff_id?: string | null;
          start_date: string;
          end_date: string;
          actual_return_date?: string | null;
          status?: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
          total_amount: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          staff_id?: string | null;
          start_date?: string;
          end_date?: string;
          actual_return_date?: string | null;
          status?: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
          total_amount?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      studio_events: {
        Row: {
          id: string;
          userId: string;
          clientId: string | null;
          title: string;
          description: string | null;
          startTime: string;
          endTime: string;
          location: string;
          status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          userId: string;
          clientId?: string | null;
          title: string;
          description?: string | null;
          startTime: string;
          endTime: string;
          location?: string;
          status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          userId?: string;
          clientId?: string | null;
          title?: string;
          description?: string | null;
          startTime?: string;
          endTime?: string;
          location?: string;
          status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
          updatedAt?: string;
        };
      };
      event_equipment: {
        Row: {
          id: string;
          eventId: string;
          equipmentId: string;
          createdAt: string;
        };
        Insert: {
          id?: string;
          eventId: string;
          equipmentId: string;
          createdAt?: string;
        };
        Update: {
          id?: string;
          eventId?: string;
          equipmentId?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_role: {
        Args: {
          user_id: string;
        };
        Returns: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
      };
    };
    Enums: {
      user_role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
      equipment_status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'LOST';
      rental_status:
        | 'PENDING'
        | 'ACTIVE'
        | 'COMPLETED'
        | 'CANCELLED'
        | 'OVERDUE';
      event_status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
    };
  };
}
