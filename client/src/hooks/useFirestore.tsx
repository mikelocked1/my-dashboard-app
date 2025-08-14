import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  createHealthData, 
  getHealthDataByUser,
  createAppointment,
  getAppointmentsByUser 
} from "@/lib/firestore";
import type { InsertHealthData, InsertAppointment } from "@shared/schema";

export const useHealthData = (userId: string, dataType?: string) => {
  return useQuery({
    queryKey: ["/api/health-data", userId, dataType],
    queryFn: () => getHealthDataByUser(userId, dataType),
    enabled: !!userId,
  });
};

export const useCreateHealthData = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createHealthData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health-data"] });
    },
  });
};

export const useAppointments = (userId: string, role: string) => {
  return useQuery({
    queryKey: ["/api/appointments", userId, role],
    queryFn: () => getAppointmentsByUser(userId, role),
    enabled: !!userId,
  });
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
  });
};
