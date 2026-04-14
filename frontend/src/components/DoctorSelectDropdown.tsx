import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Search } from 'lucide-react';
import { doctorService } from '@/services/doctorService';
import { Doctor } from '@/types/doctor';

interface DoctorSelectDropdownProps {
  value: string;
  onChange: (doctorId: string) => void;
  placeholder?: string;
}

export const DoctorSelectDropdown = ({ value, onChange, placeholder = 'Select Doctor' }: DoctorSelectDropdownProps) => {
  const [doctors, setDoctors] = useState<Doctor[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await doctorService.getDoctors();
        setDoctors(response.data || response);
      } catch (error) {
        console.error('Failed to fetch doctors', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const filteredDoctors = (doctors || []).filter(doctor => 
    doctor.name.toLowerCase().includes(search.toLowerCase()) ||
    (doctor.specialization && doctor.specialization.toLowerCase().includes(search.toLowerCase())) ||
    (doctor.clinicName && doctor.clinicName.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedDoctor = (doctors || []).find(d => d._id === value);

  return (
    <div className="w-full">
      <label className="text-sm font-medium mb-2 block text-foreground">Preferred Doctor</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder}>
            {selectedDoctor && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{selectedDoctor.name} {selectedDoctor.specialization ? `- ${selectedDoctor.specialization}` : ''}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="w-[400px]">
          <div className="p-2 border-b">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md">
              <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search doctors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none outline-none flex-1 text-sm"
              />
            </div>
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading doctors...</div>
          ) : filteredDoctors.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No doctors found</div>
          ) : (
            filteredDoctors.map((doctor) => (
              <SelectItem key={doctor._id} value={doctor._id} className="p-0">
                <div className="px-4 py-3 hover:bg-accent">
                  <div className="font-medium text-foreground">{doctor.name}</div>
                  {doctor.specialization && <div className="text-xs text-muted-foreground">{doctor.specialization}</div>}
                  {doctor.clinicName && <div className="text-xs text-muted-foreground">{doctor.clinicName}</div>}
                  {doctor.phone && <div className="text-xs text-muted-foreground">{doctor.phone}</div>}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

