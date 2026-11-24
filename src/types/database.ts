export type Database = {
  public: {
    Tables: {
      library_tasks: {
        Row: {
          id: number;
          created_at: string;
          user_id: string;
          task_title: string;
          reward_points: number;
          status: "pending" | "completed";
        };
        Insert: {
          id?: number;
          created_at?: string;
          user_id?: string;
          task_title: string;
          reward_points?: number;
          status?: "pending" | "completed";
        };
        Update: {
          id?: number;
          created_at?: string;
          user_id?: string;
          task_title?: string;
          reward_points?: number;
          status?: "pending" | "completed";
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
