import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, Filter, Users } from 'lucide-react';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';

interface BudgetFiltersProps {
  selectedMembers: string[];
  onMemberToggle: (memberId: string) => void;
  onClearFilters: () => void;
}

export const BudgetFilters = ({ selectedMembers, onMemberToggle, onClearFilters }: BudgetFiltersProps) => {
  const { members } = useBudgetSupabase();

  const removeMemberFilter = (memberId: string) => {
    onMemberToggle(memberId);
  };

  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || 'Miembro';

  const hasActiveFilters = selectedMembers.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Controles de filtros */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Filtro por miembros */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Miembros
              {selectedMembers.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 text-xs">
                  {selectedMembers.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="start">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Filtrar por miembros</h4>
              {members.map((member) => (
                <div key={member.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`member-${member.id}`}
                    checked={selectedMembers.includes(member.id)}
                    onChange={() => onMemberToggle(member.id)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor={`member-${member.id}`} className="text-sm">
                    {member.name}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Filtros activos (chips) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {selectedMembers.map((memberId) => (
            <Badge key={memberId} variant="secondary" className="flex items-center gap-1">
              {getMemberName(memberId)}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 w-4 h-4"
                onClick={() => removeMemberFilter(memberId)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};