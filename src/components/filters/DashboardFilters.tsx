import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { X, Filter, CalendarIcon } from 'lucide-react';
import { useFilters } from '@/providers/FiltersProvider';
import { useBudgetSupabase } from '@/hooks/useBudgetSupabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const DashboardFilters = () => {
  const { filters, setFilters, clearFilters, hasActiveFilters } = useFilters();
  const { members, categories } = useBudgetSupabase();

  const handleMemberToggle = (memberId: string) => {
    const updated = filters.members.includes(memberId)
      ? filters.members.filter(id => id !== memberId)
      : [...filters.members, memberId];
    setFilters({ members: updated });
  };

  const handleCategoryToggle = (categoryId: string) => {
    const updated = filters.categories.includes(categoryId)
      ? filters.categories.filter(id => id !== categoryId)
      : [...filters.categories, categoryId];
    setFilters({ categories: updated });
  };

  const removeMemberFilter = (memberId: string) => {
    setFilters({ members: filters.members.filter(id => id !== memberId) });
  };

  const removeCategoryFilter = (categoryId: string) => {
    setFilters({ categories: filters.categories.filter(id => id !== categoryId) });
  };

  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || 'Miembro';
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Categoría';

  return (
    <div className="flex flex-col gap-4">
      {/* Controles de filtros */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Filtro por miembros */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Miembros
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
                    checked={filters.members.includes(member.id)}
                    onChange={() => handleMemberToggle(member.id)}
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

        {/* Filtro por categorías */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Categorías
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="start">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Filtrar por categorías</h4>
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`category-${category.id}`}
                    checked={filters.categories.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor={`category-${category.id}`} className="text-sm">
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Filtro por rango de fechas */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Fechas
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Rango de fechas</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Desde</label>
                  <Calendar
                    mode="single"
                    selected={filters.dateRange.from}
                    onSelect={(date) => setFilters({ dateRange: { ...filters.dateRange, from: date } })}
                    locale={es}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Hasta</label>
                  <Calendar
                    mode="single"
                    selected={filters.dateRange.to}
                    onSelect={(date) => setFilters({ dateRange: { ...filters.dateRange, to: date } })}
                    locale={es}
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Filtros activos (chips) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.members.map((memberId) => (
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
          
          {filters.categories.map((categoryId) => (
            <Badge key={categoryId} variant="secondary" className="flex items-center gap-1">
              {getCategoryName(categoryId)}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 w-4 h-4"
                onClick={() => removeCategoryFilter(categoryId)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          
          {filters.dateRange.from && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Desde: {format(filters.dateRange.from, 'dd/MM/yyyy', { locale: es })}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 w-4 h-4"
                onClick={() => setFilters({ dateRange: { ...filters.dateRange, from: undefined } })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.dateRange.to && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Hasta: {format(filters.dateRange.to, 'dd/MM/yyyy', { locale: es })}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 w-4 h-4"
                onClick={() => setFilters({ dateRange: { ...filters.dateRange, to: undefined } })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};