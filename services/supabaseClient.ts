
import { createClient } from '@supabase/supabase-js';
import { WorkShift, Employee } from '../types';

const supabaseUrl = 'https://yhufsgcnhptfyovotxkr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlodWZzZ2NuaHB0Znlvdm90eGtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDM2NjgsImV4cCI6MjA3NTQ3OTY2OH0.M-DPvJ-3Ttkods89Ios7MDQIxvcggi3v-4G05lwQRww';

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- SHIFT MANAGEMENT ---

export const fetchStaffShifts = async (startDate: string, endDate: string): Promise<WorkShift[]> => {
    try {
        const { data, error } = await supabase
            .from('staff_shifts')
            .select('*')
            .gte('work_date', startDate)
            .lte('work_date', endDate);

        if (error) throw error;

        return (data || []).map(row => ({
            id: row.id,
            employeeId: row.employee_id,
            employeeName: row.employee_name,
            day: row.work_date,
            shift: row.shift_type as any,
            startTime: row.start_time,
            endTime: row.end_time
        }));
    } catch (e) {
        console.error("Error fetching shifts:", e);
        return [];
    }
};

export const createStaffShift = async (shift: Omit<WorkShift, 'id'>) => {
    try {
        const { error } = await supabase.from('staff_shifts').insert({
            employee_id: shift.employeeId,
            employee_name: shift.employeeName,
            work_date: shift.day,
            shift_type: shift.shift,
            start_time: shift.startTime,
            end_time: shift.endTime
        });
        if (error) throw error;
        return true;
    } catch (e) {
        console.error("Error creating shift:", e);
        return false;
    }
};

export const updateStaffShift = async (id: string, updates: Partial<WorkShift>) => {
    try {
        const payload: any = {};
        if (updates.shift) payload.shift_type = updates.shift;
        if (updates.startTime) payload.start_time = updates.startTime;
        if (updates.endTime) payload.end_time = updates.endTime;

        const { error } = await supabase.from('staff_shifts').update(payload).eq('id', id);
        if (error) throw error;
        return true;
    } catch (e) {
        console.error("Error updating shift:", e);
        return false;
    }
};

export const deleteStaffShift = async (id: string) => {
    try {
        const { error } = await supabase.from('staff_shifts').delete().eq('id', id);
        if (error) throw error;
        return true;
    } catch (e) {
        console.error("Error deleting shift:", e);
        return false;
    }
}

// --- EMPLOYEE PROFILES (FICHA PERÚ) ---

export const fetchEmployeeProfiles = async (): Promise<Record<string, Partial<Employee>>> => {
    try {
        const { data, error } = await supabase.from('employee_profiles').select('*');
        if (error) throw error;
        
        const map: Record<string, Partial<Employee>> = {};
        data?.forEach((row: any) => {
            map[row.odoo_id] = {
                identificationId: row.dni,
                personalEmail: row.personal_email,
                personalPhone: row.personal_phone,
                address: row.address,
                birthDate: row.birth_date,
                photoUrl: row.photo_url,
                publicToken: row.public_token, // TOKEN PÚBLICO
                pensionSystem: row.pension_system,
                bankName: row.bank_name,
                bankAccount: row.bank_account,
                emergencyContactName: row.emergency_contact_name,
                emergencyContactPhone: row.emergency_contact_phone,
                salaryBase: row.salary_base,
                salaryCommission: row.salary_commission,
                hasFamilyAllowance: row.has_family_allowance
            };
        });
        return map;
    } catch (e) {
        console.error("Error fetching profiles:", e);
        return {};
    }
};

// Nueva función para subir imagen
export const uploadEmployeePhoto = async (file: File): Promise<string | null> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Subir al bucket 'employee-photos'
        const { error: uploadError } = await supabase.storage
            .from('employee-photos')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Error uploading file:', uploadError);
            return null;
        }

        // Obtener URL pública
        const { data } = supabase.storage
            .from('employee-photos')
            .getPublicUrl(filePath);

        return data.publicUrl;
    } catch (error) {
        console.error('Error in uploadEmployeePhoto:', error);
        return null;
    }
};

export const upsertEmployeeProfile = async (odooId: string, profile: Partial<Employee>) => {
    try {
        const payload = {
            odoo_id: odooId,
            dni: profile.identificationId,
            personal_email: profile.personalEmail,
            personal_phone: profile.personalPhone,
            address: profile.address,
            birth_date: profile.birthDate,
            photo_url: profile.photoUrl,
            pension_system: profile.pensionSystem,
            bank_name: profile.bankName,
            bank_account: profile.bankAccount,
            emergency_contact_name: profile.emergencyContactName,
            emergency_contact_phone: profile.emergencyContactPhone,
            salary_base: profile.salaryBase,
            salary_commission: profile.salaryCommission,
            has_family_allowance: profile.hasFamilyAllowance,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from('employee_profiles').upsert(payload);
        if (error) throw error;
        return true;
    } catch (e) {
        console.error("Error upserting profile:", e);
        return false;
    }
};

// --- PUBLIC VIEW METHODS ---

export const getPublicEmployeeByToken = async (token: string): Promise<Partial<Employee> | null> => {
    try {
        const { data, error } = await supabase
            .from('employee_profiles')
            .select('*')
            .eq('public_token', token)
            .single();
        
        if (error || !data) return null;

        return {
            id: data.odoo_id, // We use this to fetch shifts
            identificationId: data.dni,
            personalEmail: data.personal_email,
            personalPhone: data.personal_phone,
            address: data.address,
            birthDate: data.birth_date,
            photoUrl: data.photo_url,
            pensionSystem: data.pension_system,
            bankName: data.bank_name,
            bankAccount: data.bank_account,
            emergencyContactName: data.emergency_contact_name,
            emergencyContactPhone: data.emergency_contact_phone,
            // Don't expose salary in public view by default for security, or keep it if requested
        };
    } catch (e) {
        return null;
    }
};

export const fetchPublicShifts = async (employeeId: string): Promise<WorkShift[]> => {
    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('staff_shifts')
            .select('*')
            .eq('employee_id', employeeId)
            .gte('work_date', startOfMonth)
            .lte('work_date', endOfNextMonth);

        if (error) throw error;

        return (data || []).map(row => ({
            id: row.id,
            employeeId: row.employee_id,
            employeeName: row.employee_name,
            day: row.work_date,
            shift: row.shift_type as any,
            startTime: row.start_time,
            endTime: row.end_time
        }));
    } catch (e) {
        return [];
    }
};
