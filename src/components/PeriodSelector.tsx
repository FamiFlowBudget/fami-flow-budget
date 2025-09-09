import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar, ChevronDown } from 'lucide-react';
import { usePeriod } from '@/providers/PeriodProvider';
export const PeriodSelector = () => {
  const {
    period,
    setPeriod,
    getPeriodLabel
  } = usePeriod();
  const [open, setOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const years = Array.from({
    length: 5
  }, (_, i) => currentYear - 2 + i);
  const months = Array.from({
    length: 12
  }, (_, i) => ({
    value: i + 1,
    label: new Date(2024, i).toLocaleDateString('es-CL', {
      month: 'long'
    })
  }));
  const handlePeriodChange = (type: 'month' | 'year', value: string) => {
    setPeriod({
      ...period,
      [type]: parseInt(value)
    });
  };
  return <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" aria-label="Seleccionar período" className="h-6 px-1 text-sm font-medium">
          <Calendar className="w-4 h-4 mr-2" />
          {getPeriodLabel()}
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Mes
            </label>
            <Select value={period.month.toString()} onValueChange={value => handlePeriodChange('month', value)}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map(month => <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Año
            </label>
            <Select value={period.year.toString()} onValueChange={value => handlePeriodChange('year', value)}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>;
};