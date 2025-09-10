import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useFamilies } from '@/hooks/useFamilies';
import { Users, Settings } from 'lucide-react';

export const FamilySelector = () => {
  const { families, currentFamily, setCurrentFamily } = useFamilies();

  if (families.length === 0) {
    return null;
  }

  if (families.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
        <Users className="h-4 w-4" />
        <span className="text-sm font-medium">{families[0].name}</span>
        <Badge variant="outline" className="text-xs">
          {families[0].family_public_id}
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Users className="h-4 w-4" />
      <Select
        value={currentFamily?.id || ''}
        onValueChange={(familyId) => {
          const family = families.find(f => f.id === familyId);
          if (family) setCurrentFamily(family);
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Seleccionar familia" />
        </SelectTrigger>
        <SelectContent>
          {families.map((family) => (
            <SelectItem key={family.id} value={family.id}>
              <div className="flex items-center gap-2">
                <span>{family.name}</span>
                <Badge variant="outline" className="text-xs">
                  {family.userRole}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};